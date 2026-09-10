const { ACTIVE_LEASE_STATUSES } = require('../utilities/pivotComputeJobTransitions');
const { normalizeLeaseCapability } = require('./pivotComputeJobStore');

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildLeaseBinding(job, attempt = null) {
  if (!job?.lease) return null;
  return {
    jobId: job.externalJobId,
    workerId: job.lease.workerId,
    attemptId: job.lease.attemptId,
    attemptNumber: job.lease.attemptNumber,
    leaseToken: job.lease.token,
    expiresAt: job.lease.expiresAt,
    capability: job.lease.capability ?? null,
    attemptLeaseToken: attempt?.leaseToken ?? job.lease.token,
  };
}

function assertLeaseBinding({
  job,
  attempt = null,
  workerId,
  leaseToken,
  capability = null,
  now = new Date(),
  requireActive = true,
} = {}) {
  if (!job) {
    const error = new Error('Compute job not found');
    error.code = 'COMPUTE_JOB_NOT_FOUND';
    throw error;
  }
  const normalizedWorkerId = trimString(workerId);
  const normalizedLeaseToken = trimString(leaseToken);
  if (!job.lease || job.lease.token !== normalizedLeaseToken) {
    const error = new Error('Compute job lease token mismatch');
    error.code = 'COMPUTE_JOB_LEASE_MISMATCH';
    throw error;
  }
  if (job.lease.workerId !== normalizedWorkerId) {
    const error = new Error('Compute job worker mismatch');
    error.code = 'COMPUTE_JOB_WORKER_MISMATCH';
    throw error;
  }
  if (requireActive && !ACTIVE_LEASE_STATUSES.includes(job.status)) {
    const error = new Error(`Compute job lease is not active: ${job.status}`);
    error.code = 'COMPUTE_JOB_LEASE_INACTIVE';
    throw error;
  }
  if (requireActive && job.lease.expiresAt <= now) {
    const error = new Error('Compute job lease expired');
    error.code = 'COMPUTE_JOB_LEASE_EXPIRED';
    throw error;
  }
  if (attempt && attempt.leaseToken !== normalizedLeaseToken) {
    const error = new Error('Compute job attempt lease mismatch');
    error.code = 'COMPUTE_JOB_ATTEMPT_LEASE_MISMATCH';
    throw error;
  }
  if (capability) {
    const bound = normalizeLeaseCapability(job.lease.capability);
    const incoming = normalizeLeaseCapability(capability);
    if (
      !bound
      || bound.implementationRevision !== incoming?.implementationRevision
      || bound.contractVersion !== incoming?.contractVersion
    ) {
      const error = new Error('Compute job lease capability mismatch');
      error.code = 'COMPUTE_JOB_LEASE_CAPABILITY_MISMATCH';
      throw error;
    }
  }
  return buildLeaseBinding(job, attempt);
}

function createWorkerContextAuthorizer({
  workerId,
  externalJobId,
  cityKey,
  kind,
  scheduleOccurrenceId = null,
}) {
  return async ({ jobId, cityKey: requestedCityKey, kind: requestedKind, scheduleOccurrenceId: requestedOccurrenceId }) => {
    if (trimString(jobId) !== trimString(externalJobId)) {
      return {
        error: 'Worker is not authorized for this compute job',
        status: 403,
        code: 'COMPUTE_WORKER_JOB_FORBIDDEN',
      };
    }
    if (trimString(requestedCityKey).toLowerCase() !== trimString(cityKey).toLowerCase()) {
      return {
        error: 'Worker is not authorized for this city context',
        status: 403,
        code: 'COMPUTE_WORKER_CITY_FORBIDDEN',
      };
    }
    if (trimString(requestedKind) !== trimString(kind)) {
      return {
        error: 'Worker is not authorized for this compute job kind',
        status: 403,
        code: 'COMPUTE_WORKER_KIND_FORBIDDEN',
      };
    }
    if (
      scheduleOccurrenceId
      && trimString(requestedOccurrenceId) !== trimString(scheduleOccurrenceId)
    ) {
      return {
        error: 'Worker is not authorized for this schedule occurrence',
        status: 403,
        code: 'COMPUTE_WORKER_SCHEDULE_FORBIDDEN',
      };
    }
    if (!workerId) {
      return {
        error: 'Worker authorization missing',
        status: 403,
        code: 'COMPUTE_WORKER_UNAUTHORIZED',
      };
    }
    return null;
  };
}

function buildJobObservation(job) {
  return {
    externalJobId: job.externalJobId,
    status: job.status,
    cancelRequested: Boolean(job.cancelRequested),
    contextVersion: job.contextVersion,
    lease: job.lease
      ? {
        expiresAt: job.lease.expiresAt,
        workerId: job.lease.workerId,
        attemptNumber: job.lease.attemptNumber,
      }
      : null,
  };
}

module.exports = {
  buildLeaseBinding,
  assertLeaseBinding,
  createWorkerContextAuthorizer,
  buildJobObservation,
};
