import { COMPUTE_JOB_KINDS } from './pivotComputeJobsFormat';

export const CANCELLABLE_JOB_STATUSES = Object.freeze([
  'pending',
  'leased',
  'running',
  'review-required',
  'retryable',
]);

export const RETRYABLE_JOB_STATUSES = Object.freeze(['retryable']);

export const STORED_PREVIEW_STATUSES = Object.freeze(['review-required']);

export function hasStoredEmbeddedResult(job) {
  return Boolean(
    job?.result?.hasEmbeddedResult
    || job?.result?.embedded
    || job?.result?.mode === 'embedded',
  );
}

export function canCancelComputeJob(job) {
  return Boolean(job?.status && CANCELLABLE_JOB_STATUSES.includes(job.status));
}

export function canRetryComputeJob(job) {
  return Boolean(job?.status && RETRYABLE_JOB_STATUSES.includes(job.status));
}

export function canPreviewStoredComputeJob(job) {
  return Boolean(
    job?.status
    && STORED_PREVIEW_STATUSES.includes(job.status)
    && hasStoredEmbeddedResult(job),
  );
}

export function canApplyStoredComputeJob(job, preview) {
  return Boolean(
    job?.status === 'review-required'
    && preview?.applyAllowed
    && preview?.jobId === job?.externalJobId,
  );
}

export function buildAdminCreateJobRequest({
  tenantKey,
  kind,
  contextVersion = '',
  options = {},
}) {
  const normalizedKind = COMPUTE_JOB_KINDS.includes(kind) ? kind : 'city-source-discovery';
  const slug = normalizedKind === 'city-source-discovery' ? 'discovery' : 'refresh';
  const stamp = Date.now();
  const cityKey = String(tenantKey || '').trim().toLowerCase();
  const resolvedContextVersion = String(contextVersion || '').trim()
    || `ctx:${cityKey}.${slug}.admin-request`;

  return {
    contractVersion: '1',
    jobId: `job:${slug}-${cityKey}-${stamp}`,
    scheduleOccurrenceId: null,
    kind: normalizedKind,
    cityKey,
    implementationRevision: 'platform-admin-ui',
    contextVersion: resolvedContextVersion,
    requestedAt: new Date(stamp).toISOString(),
    idempotencyKey: `idem:admin-${slug}-${cityKey}-${stamp}`,
    options: normalizedKind === 'city-source-discovery'
      ? normalizeDiscoveryOptions(options)
      : normalizeRefreshOptions(options),
  };
}

function boundedInteger(value, fallback, minimum = 1, maximum = 50) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function boundedOptionalInteger(value, minimum = 1, maximum = 50) {
  if (value === '' || value == null) return undefined;
  return boundedInteger(value, undefined, minimum, maximum);
}

function normalizeStringList(values, { maximumItems, maximumLength, pattern } = {}) {
  const seen = new Set();
  const normalized = [];
  for (const value of Array.isArray(values) ? values : []) {
    const item = String(value || '').trim();
    if (!item || item.length > maximumLength || (pattern && !pattern.test(item)) || seen.has(item)) {
      continue;
    }
    seen.add(item);
    normalized.push(item);
    if (normalized.length >= maximumItems) break;
  }
  return normalized;
}

function normalizeDiscoveryOptions(options) {
  const tags = normalizeStringList(options.tags, { maximumItems: 16, maximumLength: 64 });
  const maxQueries = boundedOptionalInteger(options.maxQueries);
  return {
    ...(tags.length ? { tags } : {}),
    ...(maxQueries ? { maxQueries } : {}),
    maxCandidates: boundedInteger(options.maxCandidates, 20),
    minEvents: boundedInteger(options.minEvents, 1),
    createJobs: options.createJobs !== false,
    recheckRejected: Boolean(options.recheckRejected),
  };
}

function normalizeRefreshOptions(options) {
  const batchWeek = String(options.batchWeek || '').trim();
  const jobIds = normalizeStringList(options.jobIds, {
    maximumItems: 100,
    maximumLength: 24,
    pattern: /^[0-9a-f]{24}$/,
  });
  return {
    ...(batchWeek ? { batchWeek } : {}),
    forceBatchWeek: Boolean(options.forceBatchWeek),
    ...(jobIds.length ? { jobIds } : {}),
  };
}

export function mutationFeedback(action, data, error) {
  if (error) {
    return {
      tone: 'error',
      message: error,
    };
  }

  if (action === 'create') {
    return {
      tone: data?.created ? 'success' : 'info',
      message: data?.created
        ? 'Compute job created and queued for workers.'
        : 'Existing compute job returned for this idempotency key.',
    };
  }
  if (action === 'cancel') {
    return {
      tone: data?.duplicate ? 'info' : 'success',
      message: data?.duplicate
        ? 'Job was already cancelled.'
        : 'Compute job cancelled.',
    };
  }
  if (action === 'retry') {
    return {
      tone: data?.duplicate ? 'info' : 'success',
      message: data?.duplicate
        ? 'Job is already pending retry.'
        : 'Compute job requeued for workers.',
    };
  }
  if (action === 'apply') {
    return {
      tone: data?.duplicate ? 'info' : 'success',
      message: data?.duplicate
        ? 'Apply already recorded for this preview.'
        : 'Compute result applied to production.',
    };
  }
  return {
    tone: 'success',
    message: 'Request completed.',
  };
}
