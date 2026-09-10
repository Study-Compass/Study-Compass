const { COMPUTE_JOB_KINDS } = require('./pivotAdminComputeJobContract');

const COMPUTE_JOB_STATUSES = Object.freeze([
  'pending',
  'leased',
  'running',
  'review-required',
  'applying',
  'completed',
  'retryable',
  'failed',
  'cancelled',
  'expired',
]);

const COMPUTE_JOB_ORIGIN_TYPES = Object.freeze(['admin', 'schedule', 'manual-upload']);

const COMPUTE_JOB_ATTEMPT_STATUSES = Object.freeze([
  'leased',
  'running',
  'completed',
  'failed',
  'expired',
  'cancelled',
]);

const TERMINAL_COMPUTE_JOB_STATUSES = Object.freeze(
  COMPUTE_JOB_STATUSES.filter((status) => ![
    'pending',
    'leased',
    'running',
    'review-required',
    'applying',
    'retryable',
  ].includes(status)),
);

const TERMINAL_COMPUTE_JOB_STATUS_SET = new Set(TERMINAL_COMPUTE_JOB_STATUSES);

const ACTIVE_LEASE_STATUSES = Object.freeze(['leased', 'running']);

const ALLOWED_COMPUTE_JOB_TRANSITIONS = Object.freeze({
  pending: ['leased', 'cancelled', 'expired'],
  leased: ['running', 'pending', 'cancelled', 'expired'],
  running: ['review-required', 'completed', 'failed', 'retryable', 'cancelled', 'expired'],
  'review-required': ['applying', 'cancelled'],
  applying: ['completed', 'review-required', 'failed'],
  retryable: ['pending', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
  expired: [],
});

function isComputeJobKind(value) {
  return COMPUTE_JOB_KINDS.includes(value);
}

function isComputeJobStatus(value) {
  return COMPUTE_JOB_STATUSES.includes(value);
}

function isTerminalComputeJobStatus(status) {
  return TERMINAL_COMPUTE_JOB_STATUS_SET.has(status);
}

function canTransitionComputeJob(fromStatus, toStatus) {
  if (!isComputeJobStatus(fromStatus) || !isComputeJobStatus(toStatus)) {
    return false;
  }
  if (fromStatus === toStatus) {
    return true;
  }
  return (ALLOWED_COMPUTE_JOB_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

function assertComputeJobTransition(fromStatus, toStatus) {
  if (!canTransitionComputeJob(fromStatus, toStatus)) {
    const error = new Error(`Illegal compute job transition: ${fromStatus} -> ${toStatus}`);
    error.code = 'ILLEGAL_COMPUTE_JOB_TRANSITION';
    error.fromStatus = fromStatus;
    error.toStatus = toStatus;
    throw error;
  }
}

function resolveResultSubmissionStatus({ outcome, retryable = false, requiresReview = true }) {
  if (outcome === 'cancelled') {
    return 'cancelled';
  }
  if (outcome === 'failed') {
    return retryable ? 'retryable' : 'failed';
  }
  if (outcome === 'completed') {
    return requiresReview ? 'review-required' : 'completed';
  }
  const error = new Error(`Unsupported compute result outcome: ${outcome}`);
  error.code = 'UNSUPPORTED_COMPUTE_RESULT_OUTCOME';
  throw error;
}

module.exports = {
  COMPUTE_JOB_STATUSES,
  COMPUTE_JOB_ORIGIN_TYPES,
  COMPUTE_JOB_ATTEMPT_STATUSES,
  TERMINAL_COMPUTE_JOB_STATUSES,
  TERMINAL_COMPUTE_JOB_STATUS_SET,
  ACTIVE_LEASE_STATUSES,
  ALLOWED_COMPUTE_JOB_TRANSITIONS,
  isComputeJobKind,
  isComputeJobStatus,
  isTerminalComputeJobStatus,
  canTransitionComputeJob,
  assertComputeJobTransition,
  resolveResultSubmissionStatus,
};
