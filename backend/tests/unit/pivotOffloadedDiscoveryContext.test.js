jest.mock('../../services/getGlobalModelService', () => jest.fn());
jest.mock('../../services/pivotIngestPublishService', () => ({
  resolvePivotTenant: jest.fn(),
}));
jest.mock('../../services/pivotSiteScrapeService', () => ({
  isSiteScrapeConfigured: jest.fn(() => true),
}));

const getGlobalModels = require('../../services/getGlobalModelService');
const { resolvePivotTenant } = require('../../services/pivotIngestPublishService');
const { isSiteScrapeConfigured } = require('../../services/pivotSiteScrapeService');
const {
  CONTRACT_VERSION,
  validateContextSnapshot,
  collectForbiddenImportableViolations,
  isStaleContextPreview,
} = require('../../utilities/pivotAdminComputeJobContract');
const {
  DISCOVERY_CONTEXT_LIMITS,
  serializeDiscoveryConfig,
  serializeSourceIdentity,
  serializeCurationJobIdentity,
  serializeOrganizerIdentity,
  buildDiscoveryContextFingerprint,
  buildCityDiscoveryContextSnapshot,
} = require('../../services/pivotOffloadedDiscoveryContextService');

describe('pivotOffloadedDiscoveryContextService (Phase 2, Step 2.1)', () => {
  const tenantKey = 'iowacity';
  const jobId = 'job:discovery-iowacity-001';
  const sourceId = '507f1f77bcf86cd799439010';
  const curationJobId = '507f1f77bcf86cd799439011';
  const organizerId = '507f1f77bcf86cd799439013';
  const now = new Date('2026-09-08T20:00:00.000Z');

  let PivotCitySource;
  let PivotCurationJob;
  let PivotOrganizer;

  const tenant = {
    tenantKey,
    name: 'Iowa City',
    location: 'Iowa City, IA',
    pivotDropTimezone: 'America/Chicago',
    pivotDiscovery: {
      flow: 'native-then-firecrawl',
      lumaSlug: 'iowa-city',
      partifulSlug: null,
    },
  };

  const sourceRow = {
    _id: sourceId,
    tenantKey,
    host: 'luma.com',
    url: 'https://luma.com/iowa-city',
    label: 'Luma Iowa City',
    provider: 'luma',
    status: 'qualified',
    enabled: true,
    seedTags: ['community'],
    rejectedReason: null,
    updatedAt: now,
  };

  const rejectedSourceRow = {
    _id: '507f1f77bcf86cd799439014',
    tenantKey,
    host: 'example-no-events.edu',
    url: 'https://example-no-events.edu/calendar',
    label: 'Empty Calendar',
    provider: 'generic-site',
    status: 'rejected',
    enabled: true,
    seedTags: ['community'],
    rejectedReason: 'no-events',
    updatedAt: now,
  };

  const jobRow = {
    _id: curationJobId,
    tenantKey,
    label: 'Luma Iowa City',
    url: 'https://luma.com/iowa-city',
    provider: 'luma',
    enabled: true,
    defaultTags: ['community'],
    defaultBatchWeekStrategy: 'next-drop',
    updatedAt: now,
  };

  const organizerRow = {
    _id: organizerId,
    tenantKey,
    normalizedName: 'night owl cinema',
    aliases: [{ name: 'Night Owl Cinema', normalized: 'night owl cinema' }],
    status: 'active',
    updatedAt: now,
  };

  function mockFind(model, rows) {
    return jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(rows),
        }),
      }),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    resolvePivotTenant.mockResolvedValue({ tenant });
    isSiteScrapeConfigured.mockReturnValue(true);

    PivotCitySource = { find: mockFind(PivotCitySource, [sourceRow, rejectedSourceRow]) };
    PivotCurationJob = { find: mockFind(PivotCurationJob, [jobRow]) };
    PivotOrganizer = { find: mockFind(PivotOrganizer, [organizerRow]) };

    getGlobalModels.mockImplementation((_req, ...names) => {
      const all = { PivotCitySource, PivotCurationJob, PivotOrganizer };
      const out = {};
      for (const name of names) {
        if (all[name]) out[name] = all[name];
      }
      return out;
    });
  });

  function authorizeOk() {
    return jest.fn().mockResolvedValue(null);
  }

  async function buildSnapshot(overrides = {}) {
    return buildCityDiscoveryContextSnapshot(
      { globalDb: {} },
      {
        tenantKey,
        jobId,
        now,
        authorize: authorizeOk(),
        ...overrides,
      },
    );
  }

  it('requires worker authorization and rejects unauthenticated callers', async () => {
    const result = await buildCityDiscoveryContextSnapshot(
      { globalDb: {} },
      { tenantKey, jobId },
    );

    expect(result.error).toMatch(/worker authorization/i);
    expect(result.status).toBe(403);
    expect(result.code).toBe('DISCOVERY_CONTEXT_UNAUTHORIZED');
    expect(resolvePivotTenant).not.toHaveBeenCalled();
  });

  it('builds a contract-valid discovery context snapshot', async () => {
    const result = await buildSnapshot({ implementationRevision: 'meridian-backend@2026.09.08' });
    expect(result.data?.snapshot).toBeDefined();

    const snapshot = result.data.snapshot;
    expect(validateContextSnapshot(snapshot)).toEqual({ valid: true });
    expect(snapshot).toMatchObject({
      contractVersion: CONTRACT_VERSION,
      jobId,
      scheduleOccurrenceId: null,
      kind: 'city-source-discovery',
      cityKey: tenantKey,
      implementationRevision: 'meridian-backend@2026.09.08',
      snapshotAt: now.toISOString(),
      tenant: {
        cityKey: tenantKey,
        name: 'Iowa City',
        location: 'Iowa City, IA',
        timezone: 'America/Chicago',
      },
      discovery: {
        flow: 'native-then-firecrawl',
        lumaSlug: 'iowa-city',
        partifulSlug: null,
        runNative: true,
        runFirecrawl: true,
      },
      providerCapabilities: {
        firecrawlConfigured: true,
        nativeProviders: ['luma', 'partiful'],
      },
    });
    expect(snapshot.contextVersion).toMatch(/^ctx:iowacity\.discovery\.[a-f0-9]{12}$/);
    expect(collectForbiddenImportableViolations(snapshot)).toEqual([]);
  });

  it('serializes source identities, rejection history, jobs, and organizers for matching', async () => {
    const result = await buildSnapshot();
    const snapshot = result.data.snapshot;

    expect(snapshot.sources).toHaveLength(2);
    expect(snapshot.sources[0]).toMatchObject({
      host: 'example-no-events.edu',
      status: 'rejected',
      rejectedReason: 'no-events',
    });
    expect(snapshot.sources[1]).toMatchObject({
      host: 'luma.com',
      status: 'qualified',
      rejectedReason: null,
      seedTags: ['community'],
    });
    expect(snapshot.sources.every((row) => row.recordVersion.startsWith('rv:src-'))).toBe(true);

    expect(snapshot.curationJobs).toEqual([
      expect.objectContaining({
        jobId: curationJobId,
        label: 'Luma Iowa City',
        provider: 'luma',
        defaultBatchWeekStrategy: 'next-drop',
      }),
    ]);

    expect(snapshot.organizers).toEqual([
      expect.objectContaining({
        organizerId,
        normalizedName: 'night owl cinema',
        aliases: ['Night Owl Cinema'],
      }),
    ]);
  });

  it('changes contextVersion when discovery configuration changes materially', () => {
    const baseSources = [serializeSourceIdentity(sourceRow)];
    const baseJobs = [serializeCurationJobIdentity(jobRow)];
    const baseOrganizers = [serializeOrganizerIdentity(organizerRow)];

    const baseDiscovery = serializeDiscoveryConfig(tenant);
    const changedDiscovery = serializeDiscoveryConfig({
      ...tenant,
      pivotDiscovery: { ...tenant.pivotDiscovery, flow: 'native-only' },
    });

    const baseVersion = buildDiscoveryContextFingerprint({
      tenantKey,
      discovery: baseDiscovery,
      sources: baseSources,
      curationJobs: baseJobs,
      organizers: baseOrganizers,
    });
    const changedVersion = buildDiscoveryContextFingerprint({
      tenantKey,
      discovery: changedDiscovery,
      sources: baseSources,
      curationJobs: baseJobs,
      organizers: baseOrganizers,
    });

    expect(baseVersion).not.toEqual(changedVersion);
  });

  it('changes contextVersion when a source record changes', async () => {
    const first = await buildSnapshot();
    const changedSource = {
      ...sourceRow,
      updatedAt: new Date('2026-09-08T21:00:00.000Z'),
      label: 'Updated Luma Label',
    };
    PivotCitySource.find = mockFind(PivotCitySource, [changedSource, rejectedSourceRow]);

    const second = await buildSnapshot();
    expect(first.data.snapshot.contextVersion).not.toBe(second.data.snapshot.contextVersion);
  });

  it('detects stale previews when production contextVersion moves forward', async () => {
    const first = await buildSnapshot();
    PivotCitySource.find = mockFind(PivotCitySource, [{
      ...sourceRow,
      updatedAt: new Date('2026-09-08T21:00:00.000Z'),
      seedTags: ['community', 'music'],
    }, rejectedSourceRow]);

    const second = await buildSnapshot();
    expect(isStaleContextPreview(
      { basedOnContextVersion: first.data.snapshot.contextVersion },
      second.data.snapshot.contextVersion,
    )).toBe(true);
  });

  it('rejects contexts that exceed row bounds', async () => {
    const tooManySources = Array.from({ length: DISCOVERY_CONTEXT_LIMITS.maxSources + 1 }, (_, index) => ({
      ...sourceRow,
      _id: `507f1f77bcf86cd7994390${String(index).padStart(2, '0')}`,
      host: `host-${index}.example.com`,
      url: `https://host-${index}.example.com/events`,
    }));
    PivotCitySource.find = mockFind(PivotCitySource, tooManySources);

    const result = await buildSnapshot();
    expect(result.status).toBe(413);
    expect(result.code).toBe('DISCOVERY_CONTEXT_TOO_LARGE');
  });

  it('omits non-https sources and secrets from the portable snapshot', async () => {
    PivotCitySource.find = mockFind(PivotCitySource, [
      sourceRow,
      rejectedSourceRow,
      {
        ...sourceRow,
        _id: '507f1f77bcf86cd799439015',
        host: 'secret.example.com',
        url: 'http://secret.example.com/events',
      },
    ]);

    const result = await buildSnapshot();
    const snapshot = result.data.snapshot;

    expect(snapshot.sources.some((row) => row.host === 'secret.example.com')).toBe(false);
    expect(JSON.stringify(snapshot)).not.toMatch(/FIRECRAWL_API_KEY|mongodb(\+srv)?:\/\//i);
    expect(collectForbiddenImportableViolations(snapshot)).toEqual([]);
  });

  it('reflects firecrawl capability without exposing credentials', async () => {
    isSiteScrapeConfigured.mockReturnValue(false);
    const result = await buildSnapshot();
    expect(result.data.snapshot.providerCapabilities).toEqual({
      firecrawlConfigured: false,
      nativeProviders: ['luma', 'partiful'],
    });
  });

  it('propagates authorization failures from the injected seam', async () => {
    const result = await buildCityDiscoveryContextSnapshot(
      { globalDb: {} },
      {
        tenantKey,
        jobId,
        authorize: jest.fn().mockResolvedValue({
          error: 'Worker lease mismatch.',
          status: 403,
          code: 'WORKER_LEASE_MISMATCH',
        }),
      },
    );

    expect(result).toEqual({
      error: 'Worker lease mismatch.',
      status: 403,
      code: 'WORKER_LEASE_MISMATCH',
    });
  });
});
