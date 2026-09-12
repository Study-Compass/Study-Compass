const { createMongoMemoryConnection } = require('../helpers/mongoMemory');
const { ensurePivotComputeJobIndexes } = require('../../services/ensurePivotComputeJobIndexes');
const { createComputeJob } = require('../../services/pivotComputeJobStore');
const { loadFixture } = require('../../utilities/pivotAdminComputeJobContract');
const getGlobalModels = require('../../services/getGlobalModelService');

jest.mock('../../services/pivotExportArtifactStorage', () => {
  const actual = jest.requireActual('../../services/pivotExportArtifactStorage');
  return {
    ...actual,
    createPresignedGetUrl: jest.fn(async ({ objectKey, filename }) => ({
      downloadUrl: `https://s3.test/${objectKey}?get=1&name=${filename}`,
      expiresInSeconds: 120,
      expiresAt: '2026-09-11T20:10:00.000Z',
    })),
  };
});

const storage = require('../../services/pivotExportArtifactStorage');
const {
  createAdminCarouselArtifactDownload,
  getAdminComputeJob,
} = require('../../services/pivotComputeAdminService');

describe('carousel export admin downloads', () => {
  let mongo;
  let req;
  const fixture = loadFixture('result-carousel-valid-completed.json');

  beforeAll(async () => {
    mongo = await createMongoMemoryConnection({ withGlobalDb: true });
    req = { globalDb: mongo.globalConnection };
    await ensurePivotComputeJobIndexes(req, { force: true });
  });

  beforeEach(async () => {
    await mongo.reset();
    await ensurePivotComputeJobIndexes(req, { force: true });
    storage.createPresignedGetUrl.mockClear();
  });

  afterAll(async () => {
    await mongo.cleanup();
  });

  async function seedCompletedExport({ expired = false } = {}) {
    await createComputeJob(req, {
      externalJobId: fixture.jobId,
      kind: 'carousel-export',
      cityKey: 'iowacity',
      contractVersion: '1',
      contextVersion: fixture.basedOnContextVersion,
      createIdempotencyKey: 'idem:carousel-download-001',
      requestedAt: '2026-09-11T20:00:00.000Z',
      origin: { type: 'admin' },
      options: {
        deckId: fixture.deckId,
        deckRevision: fixture.renderedDeckRevision,
      },
    });
    const { PivotComputeJob } = getGlobalModels(req, 'PivotComputeJob');
    await PivotComputeJob.updateOne(
      { externalJobId: fixture.jobId },
      {
        $set: {
          status: 'completed',
          result: {
            mode: 'embedded',
            embedded: fixture,
            artifactRef: null,
            resultIdempotencyKey: fixture.idempotencyKey,
            submittedAt: new Date(fixture.completedAt),
            contractVersion: '1',
          },
          exportArtifacts: {
            attemptId: fixture.attemptId,
            attemptNumber: 1,
            prefix: `pivot-exports/iowacity/${fixture.jobId}/1/`,
            grantId: 'grant:carousel-download-001',
            finalizedAt: new Date('2026-09-11T20:07:00.000Z'),
            expiresAt: new Date('2026-09-25T20:07:00.000Z'),
            expired,
            artifacts: fixture.artifacts.map((artifact) => ({
              ...artifact,
              objectKey: `pivot-exports/iowacity/${fixture.jobId}/1/${artifact.logicalName}`,
            })),
          },
        },
      },
    );
  }

  it('returns a tenant-bound presigned download for a verified artifact', async () => {
    await seedCompletedExport();
    const zip = fixture.artifacts.find((artifact) => artifact.mimeType === 'application/zip');
    const download = await createAdminCarouselArtifactDownload(req, {
      externalJobId: fixture.jobId,
      artifactId: zip.artifactId,
      tenantKey: 'iowacity',
    });

    expect(download).toMatchObject({
      filename: 'carousel.zip',
      mimeType: 'application/zip',
      byteCount: zip.byteCount,
      artifactId: zip.artifactId,
    });
    expect(download.downloadUrl).toContain('pivot-exports/iowacity/');
    expect(storage.createPresignedGetUrl).toHaveBeenCalledWith(expect.objectContaining({
      filename: 'carousel.zip',
      contentType: 'application/zip',
    }));
  });

  it('rejects a download for another tenant and expired files', async () => {
    await seedCompletedExport();
    await expect(createAdminCarouselArtifactDownload(req, {
      externalJobId: fixture.jobId,
      artifactId: fixture.artifacts[0].artifactId,
      tenantKey: 'oakland',
    })).rejects.toMatchObject({ code: 'COMPUTE_JOB_TENANT_MISMATCH' });

    const { PivotComputeJob } = getGlobalModels(req, 'PivotComputeJob');
    await PivotComputeJob.updateOne(
      { externalJobId: fixture.jobId },
      { $set: { 'exportArtifacts.expired': true } },
    );
    await expect(createAdminCarouselArtifactDownload(req, {
      externalJobId: fixture.jobId,
      artifactId: fixture.artifacts[0].artifactId,
      tenantKey: 'iowacity',
    })).rejects.toMatchObject({ code: 'CAROUSEL_EXPORT_ARTIFACTS_EXPIRED' });
  });

  it('exposes carousel result facts without the embedded payload', async () => {
    await seedCompletedExport();
    const detail = await getAdminComputeJob(req, fixture.jobId);
    expect(detail.job.result.embedded).toBeUndefined();
    expect(detail.job.result.renderedDeckRevision).toBe(fixture.renderedDeckRevision);
    expect(detail.job.result.slideCount).toBe(2);
    expect(detail.job.result.renderDurationMs).toBe(180000);
  });
});
