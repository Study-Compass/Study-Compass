const express = require('express');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createMongoMemoryConnection } = require('../helpers/mongoMemory');
const { ensurePivotComputeJobIndexes } = require('../../services/ensurePivotComputeJobIndexes');
const { createComputeJob } = require('../../services/pivotComputeJobStore');
const { createWorkerCredentialVerifier } = require('../../services/pivotComputeWorkerAuth');
const { createPivotComputeWorkerRouter, WORKER_ID_HEADER } = require('../../routes/pivotComputeWorkerRoutes');
const { loadFixture } = require('../../utilities/pivotAdminComputeJobContract');
const { UPLOAD_PURPOSE } = require('../../services/pivotCarouselComputeContextService');
const { sha256HexToS3Checksum } = require('../../services/pivotExportArtifactStorage');

jest.mock('../../services/pivotExportArtifactStorage', () => {
  const actual = jest.requireActual('../../services/pivotExportArtifactStorage');
  return {
    ...actual,
    createPresignedPutUrl: jest.fn(async ({ objectKey, contentType, byteCount }) => ({
      uploadUrl: `https://s3.test/${objectKey}?signed=1`,
      uploadHeaders: {
        'Content-Type': contentType,
        'Content-Length': String(byteCount),
      },
      expiresInSeconds: 600,
    })),
    headExportObject: jest.fn(),
    hashExportObject: jest.fn(),
    deleteExportPrefix: jest.fn(async () => ({ deleted: 0 })),
  };
});

const storage = require('../../services/pivotExportArtifactStorage');

const WORKER_ID = 'relay-mini-1';
const WORKER_SECRET = 'test-worker-secret';
const FIXED_NOW = new Date('2026-09-11T20:06:00.000Z');
const PNG_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const PNG_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const ZIP = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

function workerCapability(overrides = {}) {
  return {
    ...loadFixture('worker-capability-valid.json'),
    workerId: WORKER_ID,
    ...overrides,
  };
}

function workerAuth(requestBuilder) {
  return requestBuilder
    .set('Authorization', `Bearer ${WORKER_SECRET}`)
    .set(WORKER_ID_HEADER, WORKER_ID);
}

function artifacts() {
  return [
    { logicalName: 'slide-01.png', mimeType: 'image/png', byteCount: 100, sha256: PNG_A },
    { logicalName: 'slide-02.png', mimeType: 'image/png', byteCount: 110, sha256: PNG_B },
    { logicalName: 'carousel.zip', mimeType: 'application/zip', byteCount: 200, sha256: ZIP },
  ];
}

describe('pivot compute worker artifact routes', () => {
  let mongo;
  let app;
  let req;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'carousel-artifact-route-secret';
    mongo = await createMongoMemoryConnection({ withGlobalDb: true });
    req = { globalDb: mongo.globalConnection };
    await ensurePivotComputeJobIndexes(req, { force: true });
    const secretHash = bcrypt.hashSync(WORKER_SECRET, 4);
    app = express();
    app.use((incomingReq, _res, next) => {
      incomingReq.globalDb = mongo.globalConnection;
      next();
    });
    app.use('/worker/pivot/compute/v1', createPivotComputeWorkerRouter({
      verifyWorkerCredential: createWorkerCredentialVerifier([
        { workerId: WORKER_ID, secretHash },
      ]),
      now: () => FIXED_NOW,
    }));
  });

  afterEach(async () => {
    await mongo.reset();
    await ensurePivotComputeJobIndexes(req, { force: true });
    storage.headExportObject.mockReset();
  });

  afterAll(async () => {
    await mongo.cleanup();
  });

  it('returns presigned uploads and an idempotent verified manifest', async () => {
    const requestFixture = loadFixture('job-request-carousel-valid.json');
    await createComputeJob(req, {
      externalJobId: requestFixture.jobId,
      kind: requestFixture.kind,
      cityKey: requestFixture.cityKey,
      contractVersion: requestFixture.contractVersion,
      contextVersion: requestFixture.contextVersion,
      createIdempotencyKey: requestFixture.idempotencyKey,
      requestedAt: requestFixture.requestedAt,
      origin: { type: 'admin' },
      options: requestFixture.options,
    });

    const claim = await workerAuth(request(app)
      .post('/worker/pivot/compute/v1/jobs/claim'))
      .send({ kind: 'carousel-export', cityKey: 'iowacity', capability: workerCapability() });
    expect(claim.status).toBe(200);
    const leaseToken = claim.body.lease.leaseToken;
    const job = claim.body.job;

    await workerAuth(request(app)
      .post(`/worker/pivot/compute/v1/jobs/${job.externalJobId}/start`))
      .send({ leaseToken, capability: workerCapability() });

    const grantToken = jwt.sign({
      purpose: UPLOAD_PURPOSE,
      grantId: 'grant:route-test-001',
      tenantKey: job.tenantKey,
      cityKey: job.cityKey,
      jobId: job.externalJobId,
      attemptId: claim.body.lease.attemptId,
      deckId: requestFixture.options.deckId,
      deckRevision: requestFixture.options.deckRevision,
    }, process.env.JWT_SECRET, { expiresIn: 600 });

    const init = await workerAuth(request(app)
      .post(`/worker/pivot/compute/v1/jobs/${job.externalJobId}/artifacts/init`))
      .send({
        leaseToken,
        capability: workerCapability(),
        grantToken,
        slideCount: 2,
        artifacts: artifacts(),
      });
    expect(init.status).toBe(200);
    expect(init.body.prefix).toBe(`pivot-exports/iowacity/${job.externalJobId}/1/`);
    expect(init.body.uploads).toHaveLength(3);

    storage.headExportObject.mockImplementation(async (objectKey) => {
      const entry = artifacts().find((artifact) => objectKey.endsWith(artifact.logicalName));
      return {
        ContentLength: entry.byteCount,
        ContentType: entry.mimeType,
        ChecksumSHA256: sha256HexToS3Checksum(entry.sha256),
      };
    });

    const finalizeBody = {
      leaseToken,
      capability: workerCapability(),
      grantToken,
      artifacts: artifacts().map((artifact, index) => ({
        ...artifact,
        artifactId: init.body.uploads[index].artifactId,
        slideNumber: artifact.logicalName.endsWith('.zip') ? null : index + 1,
      })),
    };
    const first = await workerAuth(request(app)
      .post(`/worker/pivot/compute/v1/jobs/${job.externalJobId}/artifacts/finalize`))
      .send(finalizeBody);
    expect(first.status).toBe(200);
    expect(first.body.finalized).toBe(true);

    const duplicate = await workerAuth(request(app)
      .post(`/worker/pivot/compute/v1/jobs/${job.externalJobId}/artifacts/finalize`))
      .send(finalizeBody);
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.artifacts).toEqual(first.body.artifacts);
  });

  it('rejects artifact init without an active lease', async () => {
    const response = await workerAuth(request(app)
      .post('/worker/pivot/compute/v1/jobs/job:missing/artifacts/init'))
      .send({
        leaseToken: 'lease:missing',
        capability: workerCapability(),
        grantToken: 'not-a-grant',
        slideCount: 1,
        artifacts: [artifacts()[0]],
      });
    expect(response.status).toBe(404);
  });
});
