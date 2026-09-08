const mongoose = require('mongoose');
const {
  classifyVersionedProposal,
  summarizePreviewRows,
  validateComputeExecutionResult,
  previewComputeResult,
  applyComputeResult,
  applyStoredComputeJob,
} = require('../../services/pivotComputeResultApplyService');
const {
  createComputeJob,
  submitComputeJobResult,
  claimNextPendingJob,
  startComputeJob,
  findJobByExternalId,
} = require('../../services/pivotComputeJobStore');
const { ensurePivotComputeJobIndexes } = require('../../services/ensurePivotComputeJobIndexes');
const { loadFixture } = require('../../utilities/pivotAdminComputeJobContract');
const { recordVersion } = require('../../utilities/pivotComputeContextVersion');
const { createMongoMemoryConnection, getOrCreateModel } = require('../helpers/mongoMemory');
const pivotCitySourceSchema = require('../../schemas/pivotCitySource');
const pivotCurationJobSchema = require('../../schemas/pivotCurationJob');
const eventSchema = require('../../events/schemas/event');
const tenantConfigSchema = require('../../schemas/tenantConfig');

jest.mock('../../services/pivotIngestPublishService', () => ({
  resolvePivotTenant: jest.fn(),
  publishIngestEvent: jest.fn(),
}));

jest.mock('../../services/pivotSourceDiscoveryService', () => ({
  persistOutcome: jest.fn(),
}));

jest.mock('../../services/pivotCurationJobService', () => ({
  createCurationJob: jest.fn(),
  updateCurationJob: jest.fn(),
}));

jest.mock('../../services/pivotOffloadedCurationRefreshContextService', () => ({
  serializeRefreshJobIdentity: (row) => {
    const jobId = String(row?._id || '');
    const label = typeof row?.label === 'string' ? row.label.trim() : '';
    const provider = typeof row?.provider === 'string' ? row.provider.trim() : '';
    if (!/^[0-9a-f]{24}$/.test(jobId) || !label) return null;
    if (!['partiful', 'luma', 'generic-site'].includes(provider)) return null;
    return {
      recordVersion: `rv:job:${jobId}`,
      jobId,
      label,
      provider,
      url: row.url || null,
      enabled: row.enabled !== false,
      defaultTags: row.defaultTags || [],
    };
  },
}));

const { resolvePivotTenant, publishIngestEvent } = require('../../services/pivotIngestPublishService');
const { persistOutcome } = require('../../services/pivotSourceDiscoveryService');
const { createCurationJob, updateCurationJob } = require('../../services/pivotCurationJobService');

function tenantConfigRow(cityKey = 'iowacity') {
  return {
    tenantKey: cityKey,
    name: 'Iowa City',
    location: 'Iowa City, IA',
    pivotDropTimezone: 'America/Chicago',
    pivotCatalogOrgId: new mongoose.Types.ObjectId(),
    pivotDiscovery: { flow: 'native-then-firecrawl' },
  };
}

describe('pivotComputeResultApplyService', () => {
  let mongo;
  let req;

  beforeAll(async () => {
    mongo = await createMongoMemoryConnection({ withGlobalDb: true });
    req = {
      globalDb: mongo.globalConnection,
      db: mongo.connection,
      user: { email: 'admin@example.com' },
    };
    await ensurePivotComputeJobIndexes(req, { force: true });
  });

  beforeEach(async () => {
    await mongo.reset();
    await ensurePivotComputeJobIndexes(req, { force: true });
    resolvePivotTenant.mockResolvedValue({ tenant: tenantConfigRow() });
    publishIngestEvent.mockResolvedValue({ data: { event: { _id: 'event-1' } } });
    persistOutcome.mockResolvedValue({});
    createCurationJob.mockResolvedValue({ data: { job: { _id: 'job-1' } } });
    updateCurationJob.mockResolvedValue({ data: { job: { _id: 'job-1' } } });
  });

  afterAll(async () => {
    await mongo.cleanup();
  });

  describe('classification helpers', () => {
    it('classifies create, stale, and rejected rows deterministically', () => {
      const current = { recordVersion: 'rv:src-current' };
      expect(classifyVersionedProposal({
        entityType: 'source',
        key: 'host:example.org',
        proposalAction: 'create',
        basedOnRecordVersion: null,
        current: null,
        proposalMaterial: { host: 'example.org' },
        currentMaterial: null,
      }).action).toBe('create');

      expect(classifyVersionedProposal({
        entityType: 'source',
        key: 'host:example.org',
        proposalAction: 'update',
        basedOnRecordVersion: 'rv:src-old',
        current,
        proposalMaterial: { host: 'example.org', url: 'https://example.org/events' },
        currentMaterial: { host: 'example.org', url: 'https://example.org/old' },
      }).action).toBe('stale');

      expect(classifyVersionedProposal({
        entityType: 'source',
        key: 'host:bad.org',
        proposalAction: 'create',
        basedOnRecordVersion: null,
        current: null,
        proposalMaterial: { status: 'rejected' },
        currentMaterial: null,
        rejectedReason: 'below-threshold',
      }).action).toBe('rejected');
    });

    it('summarizes preview rows by action', () => {
      expect(summarizePreviewRows([
        { action: 'create' },
        { action: 'update' },
        { action: 'unchanged' },
        { action: 'stale' },
      ])).toEqual({
        creates: 1,
        updates: 1,
        unchanged: 1,
        conflicts: 0,
        rejected: 0,
        stale: 1,
      });
    });
  });

  describe('previewComputeResult', () => {
    it('builds an applyable discovery preview against empty production state', async () => {
      const result = loadFixture('result-discovery-valid-completed.json');
      const preview = await previewComputeResult(req, result, {
        currentContextVersion: result.basedOnContextVersion,
      });

      expect(preview.applyAllowed).toBe(true);
      expect(preview.summary.creates).toBeGreaterThan(0);
      expect(preview.rows.some((row) => row.entityType === 'source' && row.action === 'create')).toBe(true);
    });

    it('blocks apply when the result context version is stale', async () => {
      const result = loadFixture('result-discovery-valid-completed.json');
      const preview = await previewComputeResult(req, result, {
        currentContextVersion: 'ctx:iowacity.discovery.v999',
      });

      expect(preview.applyAllowed).toBe(false);
      expect(preview.blockingReasons[0].code).toBe('STALE_CONTEXT');
    });

    it('rejects unknown contract versions fail-closed', () => {
      expect(() => validateComputeExecutionResult({
        ...loadFixture('result-discovery-valid-completed.json'),
        contractVersion: '99',
      })).toThrow(/Unsupported compute contract version/);
    });

    it('rejects failed execution results for preview/apply', () => {
      expect(() => validateComputeExecutionResult(loadFixture('result-discovery-failed.json')))
        .toThrow(/Only completed compute results/);
    });

    it('marks refresh events stale when production record versions drift', async () => {
      const result = loadFixture('result-refresh-valid-completed.json');
      const sourceUrl = result.proposals.events[0].sourceUrl;
      const Event = getOrCreateModel(mongo.connection, 'Event', eventSchema, 'events');
      await Event.collection.insertOne({
        name: 'Existing Event',
        startTime: new Date('2026-09-10T23:00:00.000Z'),
        customFields: {
          pivot: {
            sourceUrl,
            batchWeek: '2026-W37',
            tags: ['community'],
          },
        },
      });

      const preview = await previewComputeResult(req, result, {
        currentContextVersion: result.basedOnContextVersion,
      });

      const eventRow = preview.rows.find((row) => row.entityType === 'event');
      expect(['update', 'unchanged', 'stale']).toContain(eventRow.action);
    });
  });

  describe('applyComputeResult', () => {
    it('applies create rows through existing source, job, and event seams without replaying discovery', async () => {
      const result = loadFixture('result-discovery-valid-completed.json');
      const preview = await previewComputeResult(req, result, {
        currentContextVersion: result.basedOnContextVersion,
      });

      const applied = await applyComputeResult(req, {
        result,
        preview,
        idempotencyKey: 'apply:discovery-001',
        actor: 'admin@example.com',
      });

      expect(applied.summary.creates).toBeGreaterThan(0);
      expect(persistOutcome).toHaveBeenCalled();
      expect(createCurationJob).toHaveBeenCalled();
      expect(publishIngestEvent).toHaveBeenCalled();
    });

    it('returns the stored outcome for duplicate apply idempotency keys', async () => {
      const externalJobId = 'job:discovery-apply-dup';
      await createComputeJob(req, {
        externalJobId,
        kind: 'city-source-discovery',
        cityKey: 'iowacity',
        contractVersion: '1',
        contextVersion: 'ctx:iowacity.discovery.v1',
        createIdempotencyKey: 'idem:create-apply-dup',
        requestedAt: new Date().toISOString(),
        origin: { type: 'admin' },
        options: {},
      });
      const claim = await claimNextPendingJob(req, {
        kind: 'city-source-discovery',
        workerId: 'worker-1',
        now: new Date(),
      });
      await startComputeJob(req, {
        externalJobId,
        leaseToken: claim.job.lease.token,
        workerId: 'worker-1',
        now: new Date(),
      });
      const result = loadFixture('result-discovery-valid-completed.json');
      result.jobId = externalJobId;
      await submitComputeJobResult(req, {
        externalJobId,
        leaseToken: claim.job.lease.token,
        workerId: 'worker-1',
        result,
        now: new Date(),
      });

      const preview = await previewComputeResult(req, result, {
        currentContextVersion: result.basedOnContextVersion,
      });

      const first = await applyStoredComputeJob(req, externalJobId, {
        idempotencyKey: 'apply:dup-001',
        preview,
        actor: 'admin@example.com',
      });
      expect(first.job.status).toBe('completed');

      const second = await applyStoredComputeJob(req, externalJobId, {
        idempotencyKey: 'apply:dup-001',
        preview,
        actor: 'admin@example.com',
      });
      expect(second.duplicate).toBe(true);
      expect(second.job.status).toBe('completed');
      expect(await findJobByExternalId(req, externalJobId)).toMatchObject({ status: 'completed' });
    });
  });
});
