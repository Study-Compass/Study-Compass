jest.mock('../../services/getGlobalModelService', () => jest.fn());
jest.mock('../../connectionsManager', () => ({
  connectToDatabase: jest.fn(),
  connectToGlobalDatabase: jest.fn(),
}));
jest.mock('../../services/pivotIngestPublishService', () => ({
  resolvePivotTenant: jest.fn(),
}));
jest.mock('../../services/pivotIngestPreviewService', () => ({
  GENERIC_SITE_PROVIDER: 'generic-site',
}));
jest.mock('../../services/pivotSiteScrapeService', () => ({
  isSiteScrapeConfigured: jest.fn(() => true),
}));
jest.mock('../../services/pivotCurationRunService', () => ({
  executeCurationRun: jest.fn(),
  resolveRunBatchWeek: jest.fn(() => ({ batchWeek: '2026-W37' })),
  summarizeIngest: (stats = {}) => ({
    written: stats.upserted || 0,
    refreshed: stats.updated || 0,
    added: Math.max((stats.upserted || 0) - (stats.updated || 0), 0),
    skipped: stats.skipped || 0,
    failed: stats.failed || 0,
    phrase: stats.upserted ? `${stats.upserted} new` : 'nothing new',
  }),
  emptyStats: () => ({
    discovered: 0,
    upserted: 0,
    skipped: 0,
    failed: 0,
    updated: 0,
    byBatchWeek: null,
    message: null,
  }),
}));
jest.mock('../../services/pivotDiscoveryRunRecorder', () => ({
  createDiscoveryRun: jest.fn(),
  serializeDiscoveryRun: jest.fn((doc) => doc),
  findOrchestrationRun: jest.fn(),
  findLatestOrchestrationRun: jest.fn(),
  refuseIfPipelineBusy: jest.fn().mockResolvedValue(null),
  nullRecorder: () => ({
    runId: null,
    enabled: false,
    step() {},
    setPhase() {},
    bumpCounters() {},
    finish: async () => {},
    flush: async () => {},
  }),
}));
jest.mock('../../utilities/pivotLogger', () => ({ logPivot: jest.fn() }));

const getGlobalModels = require('../../services/getGlobalModelService');
const { nullRecorder } = require('../../services/pivotDiscoveryRunRecorder');
const {
  validateExecutionResult,
  collectForbiddenImportableViolations,
} = require('../../utilities/pivotAdminComputeJobContract');
const {
  executeOffloadedCityCurationRefresh,
} = require('../../services/pivotOffloadedCurationRefreshService');

describe('pivotOffloadedCurationRefreshService (Phase 2, Step 2.3)', () => {
  const now = new Date('2026-09-08T06:35:00.000Z');
  const jobId = 'job:refresh-iowacity-001';
  const idempotencyKey = 'idem:refresh-iowacity-001';
  const lumaJobId = '507f1f77bcf86cd799439011';
  const theatreJobId = '507f1f77bcf86cd799439012';

  const contextSnapshot = {
    contractVersion: '1',
    jobId,
    scheduleOccurrenceId: 'sched:weekly-refresh@2026-09-08T06:00:00.000Z',
    kind: 'city-curation-refresh',
    cityKey: 'iowacity',
    implementationRevision: 'meridian-backend@2026.09.08',
    contextVersion: 'ctx:iowacity.refresh.v7',
    snapshotAt: '2026-09-08T06:00:00.000Z',
    tenant: {
      cityKey: 'iowacity',
      name: 'Iowa City',
      location: 'Iowa City, IA',
      timezone: 'America/Chicago',
    },
    batchWeek: '2026-W37',
    forceBatchWeek: false,
    jobs: [
      {
        recordVersion: 'rv:job-luma-1',
        jobId: lumaJobId,
        label: 'Luma Iowa City',
        provider: 'luma',
        url: 'https://luma.com/iowa-city',
        enabled: true,
        defaultTags: ['community'],
        linkedSourceHost: 'luma.com',
      },
      {
        recordVersion: 'rv:job-theatre-1',
        jobId: theatreJobId,
        label: 'Example Theatre',
        provider: 'generic-site',
        url: 'https://example-theatre.org/events',
        enabled: true,
        defaultTags: ['live-music'],
        linkedSourceHost: 'example-theatre.org',
      },
    ],
    sources: [],
    organizers: [],
    permittedEventFields: {
      allowOrganizerLinking: true,
      allowLocationResolution: true,
      maxEventsPerJob: null,
    },
    providerCapabilities: {
      firecrawlConfigured: true,
      nativeProviders: ['luma', 'partiful'],
    },
  };

  let PivotCurationRun;
  let PivotCurationJob;

  const previewIngestUrl = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    PivotCurationRun = {
      create: jest.fn(),
      findById: jest.fn(),
    };
    PivotCurationJob = {
      findByIdAndUpdate: jest.fn(),
    };
    getGlobalModels.mockImplementation((_req, ...names) => {
      const all = { PivotCurationRun, PivotCurationJob };
      const out = {};
      for (const name of names) {
        if (all[name]) out[name] = all[name];
      }
      return out;
    });

    previewIngestUrl.mockImplementation(async ({ url }) => {
      if (url.includes('luma.com')) {
        return {
          data: {
            mode: 'batch',
            drafts: [{
              draft: {
                name: 'Community Meetup',
                start_time: '2026-09-10T23:00:00.000Z',
                sourceUrl: 'https://luma.com/iowa-city/event-abc',
                hostName: 'Iowa City Creators',
                hostProfileUrl: 'https://luma.com/user/example',
              },
              sourceUrl: 'https://luma.com/iowa-city/event-abc',
            }],
          },
        };
      }
      return {
        data: {
          mode: 'batch',
          drafts: [{
            draft: {
              name: 'Jazz Night',
              start_time: '2026-09-12T01:00:00.000Z',
              sourceUrl: 'https://example-theatre.org/events/show-1',
              location: 'Example Theatre',
            },
            sourceUrl: 'https://example-theatre.org/events/show-1',
          }],
        },
      };
    });
  });

  async function runRefresh(overrides = {}) {
    return executeOffloadedCityCurationRefresh({
      contextSnapshot,
      jobId,
      idempotencyKey,
      now,
      implementationRevision: 'relay-worker@2026.09.08',
      progressRecorder: nullRecorder(),
      providers: { previewIngestUrl },
      ...overrides,
    });
  }

  it('returns contract-valid refresh proposals with per-job outcomes and events', async () => {
    const result = await runRefresh();
    expect(result.data?.result).toBeDefined();

    const executionResult = result.data.result;
    expect(validateExecutionResult(executionResult)).toEqual({ valid: true });
    expect(collectForbiddenImportableViolations(executionResult)).toEqual([]);
    expect(executionResult).toMatchObject({
      jobId,
      idempotencyKey,
      kind: 'city-curation-refresh',
      cityKey: 'iowacity',
      basedOnContextVersion: 'ctx:iowacity.refresh.v7',
      outcome: 'completed',
    });
    expect(executionResult.proposals.jobOutcomes).toEqual([
      expect.objectContaining({
        jobId: lumaJobId,
        outcome: 'completed',
        basedOnRecordVersion: 'rv:job-luma-1',
      }),
      expect.objectContaining({
        jobId: theatreJobId,
        outcome: 'completed',
        basedOnRecordVersion: 'rv:job-theatre-1',
      }),
    ]);
    expect(executionResult.proposals.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'upsert',
          sourceUrl: 'https://luma.com/iowa-city/event-abc',
          linkedJobId: lumaJobId,
          basedOnEventVersion: null,
        }),
        expect.objectContaining({
          action: 'upsert',
          sourceUrl: 'https://example-theatre.org/events/show-1',
          linkedJobId: theatreJobId,
        }),
      ]),
    );
    expect(executionResult.proposals.events).toHaveLength(2);
    expect(executionResult.summary).toMatchObject({
      jobsRun: 2,
      jobsFailed: 0,
      eventsProposed: 2,
      eventsRefreshed: 2,
    });
  });

  it('does not write through production repositories when extraction succeeds', async () => {
    await runRefresh();

    expect(PivotCurationRun.create).not.toHaveBeenCalled();
    expect(PivotCurationJob.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(previewIngestUrl).toHaveBeenCalledTimes(2);
  });

  it('records failed job outcomes without proposing events when preview fails', async () => {
    previewIngestUrl.mockImplementationOnce(async () => ({
      error: 'Extraction failed.',
      code: 'PREVIEW_FAILED',
    }));

    const result = await runRefresh({
      contextSnapshot: {
        ...contextSnapshot,
        jobs: [contextSnapshot.jobs[0]],
      },
    });

    expect(result.data.result.proposals.jobOutcomes).toEqual([
      expect.objectContaining({
        jobId: lumaJobId,
        outcome: 'failed',
        failure: expect.objectContaining({ code: 'PREVIEW_FAILED' }),
      }),
    ]);
    expect(result.data.result.proposals.events).toEqual([]);
    expect(PivotCurationRun.create).not.toHaveBeenCalled();
  });

  it('skips generic-site jobs when Firecrawl is unavailable in context', async () => {
    const result = await runRefresh({
      contextSnapshot: {
        ...contextSnapshot,
        providerCapabilities: {
          firecrawlConfigured: false,
          nativeProviders: ['luma', 'partiful'],
        },
        jobs: [contextSnapshot.jobs[1]],
      },
    });

    expect(result.status).toBe(503);
    expect(result.code).toBe('SITE_SCRAPE_NOT_CONFIGURED');
  });

  it('rejects stale expected context versions', async () => {
    const result = await runRefresh({
      expectedContextVersion: 'ctx:iowacity.refresh.v6',
    });

    expect(result.status).toBe(409);
    expect(result.code).toBe('REFRESH_CONTEXT_STALE');
  });

  it('uses actual worker capabilities instead of trusting production provider flags', async () => {
    const result = await runRefresh({
      contextSnapshot: {
        ...contextSnapshot,
        jobs: [contextSnapshot.jobs[1]],
      },
      workerCapabilities: {
        firecrawlConfigured: false,
        nativeProviders: ['luma', 'partiful'],
      },
    });

    expect(result.status).toBe(503);
    expect(result.code).toBe('SITE_SCRAPE_NOT_CONFIGURED');
    expect(previewIngestUrl).not.toHaveBeenCalled();
  });

  it('returns a cancelled artifact when the worker cancellation signal is set', async () => {
    const result = await runRefresh({ shouldCancel: () => true });

    expect(result.data.result.outcome).toBe('cancelled');
    expect(previewIngestUrl).not.toHaveBeenCalled();
  });
});
