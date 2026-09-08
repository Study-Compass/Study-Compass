const { nullRecorder } = require('./pivotDiscoveryRunRecorder');
const { executeCurationBatchCore, isCrawlable } = require('./pivotCurationBatchService');
const { GENERIC_SITE_PROVIDER } = require('./pivotIngestPreviewService');
const {
  createRefreshProposalCollector,
  createArtifactCurationRefreshSinks,
  contextJobToRuntime,
} = require('./pivotCurationRefreshSinks');
const {
  CONTRACT_VERSION,
  validateContextSnapshot,
  validateExecutionResult,
  collectForbiddenImportableViolations,
  isStaleContextPreview,
} = require('../utilities/pivotAdminComputeJobContract');
const { resolveImplementationRevision, isoTimestamp } = require('../utilities/pivotComputeContextVersion');

const REFRESH_RESULT_LIMITS = Object.freeze({
  maxJobOutcomes: 100,
  maxEvents: 5000,
});

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sortRefreshProposals(collector) {
  collector.jobOutcomes.sort((left, right) => left.jobId.localeCompare(right.jobId));
  collector.events.sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl));
}

function buildRefreshExecutionResult({
  contextSnapshot,
  jobId,
  scheduleOccurrenceId,
  idempotencyKey,
  implementationRevision,
  completedAt,
  outcome,
  collector,
  summary,
  failure,
}) {
  sortRefreshProposals(collector);
  return {
    contractVersion: CONTRACT_VERSION,
    jobId,
    scheduleOccurrenceId: scheduleOccurrenceId ?? null,
    kind: 'city-curation-refresh',
    cityKey: contextSnapshot.cityKey,
    implementationRevision,
    basedOnContextVersion: contextSnapshot.contextVersion,
    completedAt,
    outcome,
    idempotencyKey,
    ...(failure ? { failure } : {}),
    proposals: {
      jobOutcomes: collector.jobOutcomes.slice(0, REFRESH_RESULT_LIMITS.maxJobOutcomes),
      events: collector.events.slice(0, REFRESH_RESULT_LIMITS.maxEvents),
    },
    summary,
  };
}

function summarizeRefreshRun(coreResult, collector) {
  const jobsFailed = collector.jobOutcomes.filter((row) => row.outcome === 'failed').length;
  const eventsProposed = collector.events.length;
  return {
    jobsRun: coreResult?.jobsRun || 0,
    jobsFailed,
    eventsProposed,
    eventsRefreshed: eventsProposed,
  };
}

function createProgressRecorder(baseRecorder) {
  if (!baseRecorder) return nullRecorder();
  return {
    runId: baseRecorder.runId || null,
    enabled: baseRecorder.enabled !== false,
    step: (...args) => baseRecorder.step?.(...args),
    setPhase: (...args) => baseRecorder.setPhase?.(...args),
    bumpCounters: (...args) => baseRecorder.bumpCounters?.(...args),
    finish: (...args) => baseRecorder.finish?.(...args),
    flush: (...args) => baseRecorder.flush?.(...args),
  };
}

function jobsReadyFromContext(contextSnapshot, runOptions = {}) {
  let jobs = (contextSnapshot.jobs || []).map((job) => ({
    ...contextJobToRuntime({ ...job, cityKey: contextSnapshot.cityKey }),
    _id: job.jobId,
  })).filter(isCrawlable);

  const requested = Array.isArray(runOptions.jobIds)
    ? runOptions.jobIds.map((id) => trimString(id)).filter(Boolean)
    : null;
  if (requested?.length) {
    const allowed = new Set(requested);
    jobs = jobs.filter((job) => allowed.has(String(job._id)));
  }

  if (contextSnapshot.providerCapabilities?.firecrawlConfigured === false) {
    const skippedGenericSite = jobs.filter((job) => job.provider === GENERIC_SITE_PROVIDER).length;
    jobs = jobs.filter((job) => job.provider !== GENERIC_SITE_PROVIDER);
    return { jobs, skippedGenericSite };
  }

  return { jobs, skippedGenericSite: 0 };
}

/**
 * Run city-curation-refresh against a portable context snapshot and return
 * importable proposals without mutating authoritative production data.
 */
async function executeOffloadedCityCurationRefresh(options = {}) {
  const contextSnapshot = options.contextSnapshot;
  if (!contextSnapshot || contextSnapshot.kind !== 'city-curation-refresh') {
    return {
      error: 'A city-curation-refresh context snapshot is required.',
      status: 400,
      code: 'INVALID_REFRESH_CONTEXT',
    };
  }

  const contextValidation = validateContextSnapshot(contextSnapshot);
  if (!contextValidation.valid) {
    return {
      error: 'Refresh context snapshot failed contract validation.',
      status: 400,
      code: 'INVALID_REFRESH_CONTEXT',
      details: contextValidation.errors,
    };
  }

  if (
    options.expectedContextVersion &&
    isStaleContextPreview(
      { basedOnContextVersion: options.expectedContextVersion },
      contextSnapshot.contextVersion,
    )
  ) {
    return {
      error: 'Refresh context snapshot is stale.',
      status: 409,
      code: 'REFRESH_CONTEXT_STALE',
    };
  }

  const jobId = trimString(options.jobId);
  const idempotencyKey = trimString(options.idempotencyKey);
  if (!jobId || !idempotencyKey) {
    return {
      error: 'jobId and idempotencyKey are required.',
      status: 400,
      code: 'REFRESH_JOB_ID_REQUIRED',
    };
  }

  const { jobs, skippedGenericSite } = jobsReadyFromContext(
    contextSnapshot,
    options.runOptions || {},
  );
  if (!jobs.length && skippedGenericSite > 0) {
    return {
      error: 'Website scraping is not configured. Set FIRECRAWL_API_KEY to refresh generic-site jobs.',
      status: 503,
      code: 'SITE_SCRAPE_NOT_CONFIGURED',
    };
  }

  const previewIngestUrl = options.providers?.previewIngestUrl;
  if (!previewIngestUrl) {
    return {
      error: 'previewIngestUrl provider is required for offloaded refresh.',
      status: 400,
      code: 'REFRESH_PROVIDER_REQUIRED',
    };
  }

  const collector = createRefreshProposalCollector();
  const sinks = createArtifactCurationRefreshSinks(contextSnapshot, collector);
  const recorder = createProgressRecorder(options.progressRecorder);
  const completedAt = isoTimestamp(options.now) || new Date().toISOString();
  const implementationRevision = options.implementationRevision || resolveImplementationRevision();

  const coreResult = await executeCurationBatchCore(
    options.req || null,
    {
      tenantKey: contextSnapshot.cityKey,
      batchWeek: contextSnapshot.batchWeek,
      forceBatchWeek: contextSnapshot.forceBatchWeek,
      jobs,
      skippedGenericSite,
      recorder,
      record: false,
      previewIngestUrl,
      timezone: contextSnapshot.tenant.timezone,
    },
    sinks,
  );

  const outcome = coreResult.aborted?.code === 'CANCELLED'
    ? 'cancelled'
    : (coreResult.aborted ? 'failed' : 'completed');

  const result = buildRefreshExecutionResult({
    contextSnapshot,
    jobId,
    scheduleOccurrenceId: options.scheduleOccurrenceId ?? contextSnapshot.scheduleOccurrenceId ?? null,
    idempotencyKey,
    implementationRevision,
    completedAt,
    outcome,
    collector,
    summary: summarizeRefreshRun(coreResult, collector),
    failure: coreResult.aborted
      ? {
        code: coreResult.aborted.code || 'REFRESH_FAILED',
        message: coreResult.aborted.error || 'Refresh failed.',
      }
      : undefined,
  });

  const resultValidation = validateExecutionResult(result);
  if (!resultValidation.valid) {
    return {
      error: 'Refresh execution result failed contract validation.',
      status: 500,
      code: 'REFRESH_RESULT_INVALID',
      details: resultValidation.errors,
    };
  }

  const forbidden = collectForbiddenImportableViolations(result);
  if (forbidden.length) {
    return {
      error: 'Refresh execution result contains forbidden fields.',
      status: 500,
      code: 'REFRESH_RESULT_FORBIDDEN',
      details: forbidden,
    };
  }

  return {
    data: {
      result,
      run: coreResult,
    },
  };
}

module.exports = {
  REFRESH_RESULT_LIMITS,
  buildRefreshExecutionResult,
  jobsReadyFromContext,
  executeOffloadedCityCurationRefresh,
};
