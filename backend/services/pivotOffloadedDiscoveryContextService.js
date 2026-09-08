const getGlobalModels = require('./getGlobalModelService');
const { resolvePivotTenant } = require('./pivotIngestPublishService');
const { resolvePivotDiscoveryConfig } = require('../utilities/pivotDiscoveryConfig');
const { isSiteScrapeConfigured } = require('./pivotSiteScrapeService');
const { activeOrganizerFilter } = require('../schemas/pivotOrganizer');
const { REJECTION_REASONS } = require('../schemas/pivotCitySource');
const {
  discoveryContextVersion,
  recordVersion,
  resolveImplementationRevision,
  isoTimestamp,
} = require('../utilities/pivotComputeContextVersion');
const {
  CONTRACT_VERSION,
  validateContextSnapshot,
  collectForbiddenImportableViolations,
} = require('../utilities/pivotAdminComputeJobContract');

const DISCOVERY_CONTEXT_LIMITS = Object.freeze({
  maxSources: 500,
  maxCurationJobs: 200,
  maxOrganizers: 1000,
  maxContextBytes: 2 * 1024 * 1024,
});

const ALLOWED_REJECTION_REASONS = new Set(REJECTION_REASONS);
const NATIVE_PROVIDERS = Object.freeze(['luma', 'partiful']);

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sortedUniqueStrings(values, maxItems) {
  const seen = new Set();
  const out = [];
  for (const raw of values || []) {
    const value = trimString(raw);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
    if (out.length >= maxItems) break;
  }
  return out.sort((left, right) => left.localeCompare(right));
}

function ensureHttpsUrl(rawUrl) {
  const url = trimString(rawUrl);
  if (!url || !/^https:\/\//i.test(url)) return null;
  return url;
}

function serializeDiscoveryConfig(tenant, overrides = {}) {
  const discovery = resolvePivotDiscoveryConfig(tenant, overrides);
  return {
    flow: discovery.flow,
    lumaSlug: discovery.lumaSlug ?? null,
    partifulSlug: discovery.partifulSlug ?? null,
    runNative: discovery.runNative,
    runFirecrawl: discovery.runFirecrawl,
  };
}

function serializeSourceIdentity(row) {
  const doc = row?.toObject ? row.toObject() : row;
  const host = trimString(doc?.host).toLowerCase().replace(/^www\./, '');
  const url = ensureHttpsUrl(doc?.url);
  const provider = trimString(doc?.provider);
  const status = doc?.status === 'rejected' ? 'rejected' : 'qualified';
  if (!host || !url || !['partiful', 'luma', 'generic-site'].includes(provider)) {
    return null;
  }

  let rejectedReason = doc?.rejectedReason || null;
  if (rejectedReason && !ALLOWED_REJECTION_REASONS.has(rejectedReason)) {
    rejectedReason = null;
  }
  if (status !== 'rejected') rejectedReason = null;

  const seedTags = sortedUniqueStrings(doc?.seedTags, 16);
  const material = {
    id: String(doc?._id || ''),
    host,
    url,
    label: trimString(doc?.label) || null,
    provider,
    status,
    enabled: doc?.enabled !== false,
    seedTags,
    rejectedReason,
    updatedAt: isoTimestamp(doc?.updatedAt),
  };

  return {
    recordVersion: recordVersion('src', material),
    host,
    url,
    label: material.label,
    provider,
    status,
    enabled: material.enabled,
    seedTags,
    rejectedReason,
  };
}

function serializeCurationJobIdentity(row) {
  const doc = row?.toObject ? row.toObject() : row;
  const jobId = String(doc?._id || '');
  const label = trimString(doc?.label);
  const provider = trimString(doc?.provider);
  if (!/^[0-9a-f]{24}$/.test(jobId) || !label) return null;
  if (!['partiful', 'luma', 'generic-site', 'manual-json'].includes(provider)) return null;

  const url = doc?.url ? ensureHttpsUrl(doc.url) : null;
  const defaultTags = sortedUniqueStrings(doc?.defaultTags, 16);
  const defaultBatchWeekStrategy = ['explicit', 'next-drop', 'current-iso'].includes(doc?.defaultBatchWeekStrategy)
    ? doc.defaultBatchWeekStrategy
    : 'next-drop';
  const material = {
    id: jobId,
    label,
    url,
    provider,
    enabled: doc?.enabled !== false,
    defaultTags,
    defaultBatchWeekStrategy,
    updatedAt: isoTimestamp(doc?.updatedAt),
  };

  return {
    recordVersion: recordVersion('job', material),
    jobId,
    label,
    url,
    provider,
    enabled: material.enabled,
    defaultTags,
    defaultBatchWeekStrategy,
  };
}

function serializeOrganizerIdentity(row) {
  const doc = row?.toObject ? row.toObject() : row;
  const organizerId = String(doc?._id || '');
  const normalizedName = trimString(doc?.normalizedName);
  if (!/^[0-9a-f]{24}$/.test(organizerId) || !normalizedName) return null;

  const aliases = sortedUniqueStrings(
    (doc?.aliases || []).map((alias) => alias?.name || alias?.normalized),
    32,
  );
  const material = {
    id: organizerId,
    normalizedName,
    aliases,
    updatedAt: isoTimestamp(doc?.updatedAt),
  };

  return {
    recordVersion: recordVersion('org', material),
    organizerId,
    normalizedName,
    aliases,
  };
}

function buildDiscoveryContextFingerprint({
  tenantKey,
  discovery,
  sources,
  curationJobs,
  organizers,
}) {
  return {
    tenantKey,
    discovery,
    sources: sources.map((row) => row.recordVersion).sort(),
    curationJobs: curationJobs.map((row) => row.recordVersion).sort(),
    organizers: organizers.map((row) => row.recordVersion).sort(),
  };
}

function measureContextBytes(snapshot) {
  return Buffer.byteLength(JSON.stringify(snapshot), 'utf8');
}

async function authorizeDiscoveryContextAccess(req, options = {}) {
  if (typeof options.authorize === 'function') {
    const authResult = await options.authorize({
      req,
      kind: 'city-source-discovery',
      cityKey: options.cityKey,
      jobId: options.jobId,
      scheduleOccurrenceId: options.scheduleOccurrenceId ?? null,
    });
    if (authResult?.error) return authResult;
    return null;
  }

  return {
    error: 'Discovery context access requires worker authorization.',
    status: 403,
    code: 'DISCOVERY_CONTEXT_UNAUTHORIZED',
  };
}

async function loadDiscoveryContextRows(req, tenantKey) {
  const { PivotCitySource, PivotCurationJob, PivotOrganizer } = getGlobalModels(
    req,
    'PivotCitySource',
    'PivotCurationJob',
    'PivotOrganizer',
  );

  const [sourceRows, jobRows, organizerRows] = await Promise.all([
    PivotCitySource.find({ tenantKey })
      .sort({ host: 1 })
      .limit(DISCOVERY_CONTEXT_LIMITS.maxSources + 1)
      .lean(),
    PivotCurationJob.find({ tenantKey })
      .sort({ createdAt: 1 })
      .limit(DISCOVERY_CONTEXT_LIMITS.maxCurationJobs + 1)
      .lean(),
    PivotOrganizer.find(activeOrganizerFilter(tenantKey))
      .sort({ normalizedName: 1 })
      .limit(DISCOVERY_CONTEXT_LIMITS.maxOrganizers + 1)
      .lean(),
  ]);

  return { sourceRows, jobRows, organizerRows };
}

function buildTenantSummary(tenant) {
  const cityKey = tenant.tenantKey;
  const name = trimString(tenant.name) || cityKey;
  return {
    cityKey,
    name,
    location: trimString(tenant.location) || name,
    timezone: trimString(tenant.pivotDropTimezone) || 'UTC',
  };
}

function buildProviderCapabilities() {
  return {
    firecrawlConfigured: isSiteScrapeConfigured(),
    nativeProviders: [...NATIVE_PROVIDERS],
  };
}

/**
 * Build a bounded, importable discovery context snapshot for offloaded workers.
 *
 * Authorization is enforced through `options.authorize` until the dedicated
 * worker-auth seam lands in Phase 3.
 */
async function buildCityDiscoveryContextSnapshot(req, options = {}) {
  const authError = await authorizeDiscoveryContextAccess(req, options);
  if (authError) return authError;

  const tenantKey = trimString(options.tenantKey || options.cityKey).toLowerCase();
  if (!tenantKey) {
    return {
      error: 'tenantKey is required.',
      status: 400,
      code: 'TENANT_KEY_REQUIRED',
    };
  }

  const jobId = trimString(options.jobId);
  if (!jobId) {
    return {
      error: 'jobId is required.',
      status: 400,
      code: 'JOB_ID_REQUIRED',
    };
  }

  const tenantResult = await resolvePivotTenant(req, tenantKey);
  if (tenantResult.error) return tenantResult;

  const tenant = tenantResult.tenant;
  const discovery = serializeDiscoveryConfig(tenant, options.discoveryOverrides || {});
  const { sourceRows, jobRows, organizerRows } = await loadDiscoveryContextRows(req, tenantKey);

  if (sourceRows.length > DISCOVERY_CONTEXT_LIMITS.maxSources) {
    return {
      error: `Discovery context exceeds source limit (${DISCOVERY_CONTEXT_LIMITS.maxSources}).`,
      status: 413,
      code: 'DISCOVERY_CONTEXT_TOO_LARGE',
    };
  }
  if (jobRows.length > DISCOVERY_CONTEXT_LIMITS.maxCurationJobs) {
    return {
      error: `Discovery context exceeds curation job limit (${DISCOVERY_CONTEXT_LIMITS.maxCurationJobs}).`,
      status: 413,
      code: 'DISCOVERY_CONTEXT_TOO_LARGE',
    };
  }
  if (organizerRows.length > DISCOVERY_CONTEXT_LIMITS.maxOrganizers) {
    return {
      error: `Discovery context exceeds organizer limit (${DISCOVERY_CONTEXT_LIMITS.maxOrganizers}).`,
      status: 413,
      code: 'DISCOVERY_CONTEXT_TOO_LARGE',
    };
  }

  const sources = sourceRows
    .map(serializeSourceIdentity)
    .filter(Boolean)
    .sort((left, right) => left.host.localeCompare(right.host));
  const curationJobs = jobRows
    .map(serializeCurationJobIdentity)
    .filter(Boolean)
    .sort((left, right) => left.jobId.localeCompare(right.jobId));
  const organizers = organizerRows
    .map(serializeOrganizerIdentity)
    .filter(Boolean)
    .sort((left, right) => left.normalizedName.localeCompare(right.normalizedName));

  const snapshotAt = isoTimestamp(options.now) || new Date().toISOString();
  const contextVersion = discoveryContextVersion(
    tenantKey,
    buildDiscoveryContextFingerprint({
      tenantKey,
      discovery,
      sources,
      curationJobs,
      organizers,
    }),
  );

  const snapshot = {
    contractVersion: CONTRACT_VERSION,
    jobId,
    scheduleOccurrenceId: options.scheduleOccurrenceId ?? null,
    kind: 'city-source-discovery',
    cityKey: tenantKey,
    implementationRevision: options.implementationRevision || resolveImplementationRevision(),
    contextVersion,
    snapshotAt,
    tenant: buildTenantSummary(tenant),
    discovery,
    sources,
    curationJobs,
    organizers,
    providerCapabilities: buildProviderCapabilities(),
  };

  const validation = validateContextSnapshot(snapshot);
  if (!validation.valid) {
    return {
      error: 'Discovery context snapshot failed contract validation.',
      status: 500,
      code: 'DISCOVERY_CONTEXT_INVALID',
      details: validation.errors,
    };
  }

  const forbidden = collectForbiddenImportableViolations(snapshot);
  if (forbidden.length) {
    return {
      error: 'Discovery context snapshot contains forbidden fields.',
      status: 500,
      code: 'DISCOVERY_CONTEXT_FORBIDDEN',
      details: forbidden,
    };
  }

  if (measureContextBytes(snapshot) > DISCOVERY_CONTEXT_LIMITS.maxContextBytes) {
    return {
      error: `Discovery context exceeds byte limit (${DISCOVERY_CONTEXT_LIMITS.maxContextBytes}).`,
      status: 413,
      code: 'DISCOVERY_CONTEXT_TOO_LARGE',
    };
  }

  return { data: { snapshot } };
}

module.exports = {
  DISCOVERY_CONTEXT_LIMITS,
  authorizeDiscoveryContextAccess,
  serializeDiscoveryConfig,
  serializeSourceIdentity,
  serializeCurationJobIdentity,
  serializeOrganizerIdentity,
  buildDiscoveryContextFingerprint,
  buildCityDiscoveryContextSnapshot,
};
