const mongoose = require('mongoose');
const {
  COMPUTE_JOB_ATTEMPT_STATUSES,
} = require('../utilities/pivotComputeJobTransitions');
const { EXECUTION_OUTCOMES, COMPUTE_JOB_KINDS, CONTRACT_VERSION } = require('../utilities/pivotAdminComputeJobContract');

const PIVOT_COMPUTE_JOB_ATTEMPT_INDEX_NAMES = Object.freeze([
  'pivot_compute_job_attempt_job_attempt_unique',
  'pivot_compute_job_attempt_lease_token_unique',
  'pivot_compute_job_attempt_job_createdAt',
]);

const attemptFailureSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, maxlength: 64 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    details: {
      type: [String],
      default: undefined,
      validate: [
        (values) => !values || (
          values.length <= 12 && values.every((value) => String(value).length <= 240)
        ),
        'failure details exceed safe bounds',
      ],
    },
    retryable: { type: Boolean, default: false },
  },
  { _id: false },
);

const pivotComputeJobAttemptSchema = new mongoose.Schema(
  {
    computeJobId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'PivotComputeJob',
    },
    externalJobId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    status: {
      type: String,
      required: true,
      enum: COMPUTE_JOB_ATTEMPT_STATUSES,
      default: 'leased',
    },
    workerId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    leaseToken: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    leasedAt: { type: Date, required: true },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    lastHeartbeatAt: { type: Date, default: null },
    leaseExpiresAt: { type: Date, required: true },
    capability: {
      contractVersion: { type: String, enum: [CONTRACT_VERSION], default: null },
      implementationRevision: { type: String, default: null, trim: true, maxlength: 128 },
      supportedContractVersions: { type: [String], default: undefined },
      supportedKinds: { type: [String], enum: COMPUTE_JOB_KINDS, default: undefined },
    },
    artifactUploads: {
      grantId: { type: String, default: null, trim: true, maxlength: 128 },
      prefix: { type: String, default: null, trim: true, maxlength: 512 },
      slideCount: { type: Number, default: null, min: 1, max: 20 },
      initializedAt: { type: Date, default: null },
      finalizedAt: { type: Date, default: null },
      cleanedAt: { type: Date, default: null },
      artifacts: {
        type: [{
          artifactId: { type: String, required: true, trim: true, maxlength: 128 },
          logicalName: { type: String, required: true, trim: true, maxlength: 128 },
          objectKey: { type: String, required: true, trim: true, maxlength: 512 },
          mimeType: { type: String, required: true, trim: true, maxlength: 64 },
          byteCount: { type: Number, required: true, min: 1 },
          sha256: { type: String, required: true, trim: true, maxlength: 64 },
          slideNumber: { type: Number, default: null, min: 1, max: 20 },
          status: { type: String, enum: ['pending', 'verified'], default: 'pending' },
          verifiedAt: { type: Date, default: null },
        }],
        default: undefined,
      },
    },
    resultIdempotencyKey: {
      type: String,
      default: null,
      trim: true,
      maxlength: 128,
    },
    terminalOutcome: {
      type: String,
      enum: EXECUTION_OUTCOMES,
      default: null,
    },
    failure: { type: attemptFailureSchema, default: null },
  },
  { timestamps: true, autoIndex: false },
);

pivotComputeJobAttemptSchema.index(
  { externalJobId: 1, attemptNumber: 1 },
  { unique: true, name: PIVOT_COMPUTE_JOB_ATTEMPT_INDEX_NAMES[0] },
);
pivotComputeJobAttemptSchema.index(
  { leaseToken: 1 },
  { unique: true, name: PIVOT_COMPUTE_JOB_ATTEMPT_INDEX_NAMES[1] },
);
pivotComputeJobAttemptSchema.index(
  { computeJobId: 1, createdAt: -1 },
  { name: PIVOT_COMPUTE_JOB_ATTEMPT_INDEX_NAMES[2] },
);

module.exports = pivotComputeJobAttemptSchema;
module.exports.PIVOT_COMPUTE_JOB_ATTEMPT_INDEX_NAMES = PIVOT_COMPUTE_JOB_ATTEMPT_INDEX_NAMES;
