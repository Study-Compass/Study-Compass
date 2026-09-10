const express = require('express');
const request = require('supertest');

jest.mock('../../middlewares/verifyToken', () => ({
  verifyToken: (req, _res, next) => {
    req.user = {
      globalUserId: '507f191e810c19729de860ea',
      email: 'admin@example.com',
      platformRoles: ['platform_admin'],
    };
    next();
  },
}));

jest.mock('../../middlewares/requirePlatformAdmin', () => ({
  requirePlatformAdmin: (_req, _res, next) => next(),
}));

jest.mock('../../services/pivotComputeResultApplyService', () => ({
  previewStoredComputeJob: jest.fn(),
  previewManualComputeResult: jest.fn(),
  applyStoredComputeJob: jest.fn(),
}));

jest.mock('../../services/pivotComputeAdminService', () => ({
  createAdminComputeJob: jest.fn(),
  listAdminComputeJobs: jest.fn(),
  getAdminComputeJob: jest.fn(),
  submitManualComputeResult: jest.fn(),
  cancelAdminComputeJob: jest.fn(),
  retryAdminComputeJob: jest.fn(),
  rejectUnknownFields: jest.fn(),
  handleAdminServiceError: jest.fn((res, error) => res.status(error.status || 500).json({
    error: error.message,
    code: error.code || 'COMPUTE_JOB_ADMIN_ERROR',
    ...(error.applyResult ? { result: error.applyResult } : {}),
  })),
}));

const {
  previewStoredComputeJob,
  previewManualComputeResult,
  applyStoredComputeJob,
} = require('../../services/pivotComputeResultApplyService');
const {
  createAdminComputeJob,
  listAdminComputeJobs,
  getAdminComputeJob,
  submitManualComputeResult,
  cancelAdminComputeJob,
  retryAdminComputeJob,
  rejectUnknownFields,
} = require('../../services/pivotComputeAdminService');
const pivotAdminComputeJobsRoutes = require('../../routes/pivotAdminComputeJobsRoutes');
const { loadFixture } = require('../../utilities/pivotAdminComputeJobContract');

describe('pivotAdminComputeJobs routes outcomes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/admin/pivot/compute-jobs', pivotAdminComputeJobsRoutes);
  });

  beforeEach(() => {
    previewStoredComputeJob.mockReset();
    previewManualComputeResult.mockReset();
    applyStoredComputeJob.mockReset();
    createAdminComputeJob.mockReset();
    listAdminComputeJobs.mockReset();
    getAdminComputeJob.mockReset();
    submitManualComputeResult.mockReset();
    cancelAdminComputeJob.mockReset();
    retryAdminComputeJob.mockReset();
    rejectUnknownFields.mockReset();
    rejectUnknownFields.mockImplementation(() => {});
  });

  it('lists compute jobs for platform admins', async () => {
    listAdminComputeJobs.mockResolvedValue({
      jobs: [{ externalJobId: 'job:discovery-iowacity-001', status: 'pending' }],
      nextCursor: null,
    });

    const response = await request(app)
      .get('/admin/pivot/compute-jobs')
      .query({ cityKey: 'iowacity', status: 'pending' });

    expect(response.status).toBe(200);
    expect(response.body.jobs).toHaveLength(1);
    expect(listAdminComputeJobs).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ cityKey: 'iowacity', status: 'pending' }),
    );
  });

  it('creates a bounded admin compute job', async () => {
    const jobRequest = loadFixture('job-request-discovery-valid.json');
    createAdminComputeJob.mockResolvedValue({
      job: { externalJobId: jobRequest.jobId, status: 'pending' },
      created: true,
    });

    const response = await request(app)
      .post('/admin/pivot/compute-jobs')
      .send({ request: jobRequest });

    expect(response.status).toBe(201);
    expect(response.body.created).toBe(true);
    expect(createAdminComputeJob).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        request: jobRequest,
        actor: 'admin@example.com',
      }),
    );
  });

  it('returns an existing admin compute job on duplicate create idempotency', async () => {
    const jobRequest = loadFixture('job-request-discovery-valid.json');
    createAdminComputeJob.mockResolvedValue({
      job: { externalJobId: jobRequest.jobId, status: 'pending' },
      created: false,
    });

    const response = await request(app)
      .post('/admin/pivot/compute-jobs')
      .send({ request: jobRequest });

    expect(response.status).toBe(200);
    expect(response.body.created).toBe(false);
  });

  it('returns compute job detail with attempts', async () => {
    getAdminComputeJob.mockResolvedValue({
      job: { externalJobId: 'job:discovery-iowacity-001', status: 'review-required' },
      attempts: [{ attemptNumber: 1, status: 'completed' }],
    });

    const response = await request(app)
      .get('/admin/pivot/compute-jobs/job:discovery-iowacity-001');

    expect(response.status).toBe(200);
    expect(response.body.attempts).toHaveLength(1);
  });

  it('previews a stored compute job result for platform admins', async () => {
    const preview = loadFixture('result-preview-valid.json');
    previewStoredComputeJob.mockResolvedValue({
      job: { externalJobId: preview.jobId, status: 'review-required' },
      preview,
    });

    const response = await request(app)
      .post('/admin/pivot/compute-jobs/job:discovery-iowacity-001/preview')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.preview.applyAllowed).toBe(true);
    expect(previewStoredComputeJob).toHaveBeenCalledWith(
      expect.anything(),
      'job:discovery-iowacity-001',
      expect.objectContaining({ currentContextVersion: undefined }),
    );
  });

  it('previews uploaded manual JSON without mutating production', async () => {
    const preview = loadFixture('result-preview-stale.json');
    previewManualComputeResult.mockResolvedValue(preview);

    const response = await request(app)
      .post('/admin/pivot/compute-jobs/manual-preview')
      .send({ result: loadFixture('result-refresh-valid-completed.json') });

    expect(response.status).toBe(200);
    expect(response.body.preview.applyAllowed).toBe(false);
    expect(response.body.preview.blockingReasons[0].code).toBe('STALE_CONTEXT');
  });

  it('submits manual JSON for review without applying production mutations', async () => {
    const result = loadFixture('result-discovery-valid-completed.json');
    submitManualComputeResult.mockResolvedValue({
      job: { externalJobId: result.jobId, status: 'review-required' },
      created: true,
      duplicate: false,
    });

    const response = await request(app)
      .post('/admin/pivot/compute-jobs/manual-submit')
      .send({ result });

    expect(response.status).toBe(201);
    expect(response.body.job.status).toBe('review-required');
    expect(submitManualComputeResult).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        result,
        actor: 'admin@example.com',
      }),
    );
  });

  it('applies an accepted preview through the admin route', async () => {
    const preview = loadFixture('result-preview-valid.json');
    applyStoredComputeJob.mockResolvedValue({
      job: { externalJobId: preview.jobId, status: 'completed' },
      duplicate: false,
      summary: preview.summary,
    });

    const response = await request(app)
      .post('/admin/pivot/compute-jobs/job:discovery-iowacity-001/apply')
      .send({
        idempotencyKey: 'apply:discovery-iowacity-001',
        preview,
      });

    expect(response.status).toBe(200);
    expect(response.body.job.status).toBe('completed');
    expect(applyStoredComputeJob).toHaveBeenCalledWith(
      expect.anything(),
      'job:discovery-iowacity-001',
      expect.objectContaining({
        idempotencyKey: 'apply:discovery-iowacity-001',
        preview,
        actor: 'admin@example.com',
      }),
    );
  });

  it('cancels pending or leased compute jobs', async () => {
    cancelAdminComputeJob.mockResolvedValue({
      job: { externalJobId: 'job:discovery-iowacity-001', status: 'cancelled' },
      duplicate: false,
    });

    const response = await request(app)
      .post('/admin/pivot/compute-jobs/job:discovery-iowacity-001/cancel')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.job.status).toBe('cancelled');
    expect(cancelAdminComputeJob).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        externalJobId: 'job:discovery-iowacity-001',
        actor: 'admin@example.com',
      }),
    );
  });

  it('retries only eligible compute job failures', async () => {
    retryAdminComputeJob.mockResolvedValue({
      job: { externalJobId: 'job:refresh-iowacity-001', status: 'pending' },
      duplicate: false,
    });

    const response = await request(app)
      .post('/admin/pivot/compute-jobs/job:refresh-iowacity-001/retry')
      .send({ contextVersion: 'ctx:iowacity.refresh.v8' });

    expect(response.status).toBe(200);
    expect(response.body.job.status).toBe('pending');
    expect(retryAdminComputeJob).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        externalJobId: 'job:refresh-iowacity-001',
        contextVersion: 'ctx:iowacity.refresh.v8',
      }),
    );
  });

  it('returns actionable errors when apply is blocked', async () => {
    const error = new Error('Preview does not allow apply.');
    error.code = 'PREVIEW_APPLY_BLOCKED';
    error.status = 409;
    applyStoredComputeJob.mockRejectedValue(error);

    const response = await request(app)
      .post('/admin/pivot/compute-jobs/job:refresh-iowacity-stale/apply')
      .send({
        idempotencyKey: 'apply:stale-001',
        preview: loadFixture('result-preview-stale.json'),
      });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('PREVIEW_APPLY_BLOCKED');
  });

  it('returns a structured apply result when validation rejects production writes', async () => {
    const error = new Error('1 event proposal cannot be applied. Missing required fields: hostName, location.');
    error.code = 'COMPUTE_APPLY_VALIDATION_FAILED';
    error.status = 422;
    error.applyResult = {
      outcome: 'rejected',
      job: { externalJobId: 'job:refresh-iowacity-invalid', status: 'review-required' },
      summary: { creates: 0, updates: 0, unchanged: 0, rejected: 0 },
      failedRow: { entityType: 'event', key: 'sourceUrl:https://example.com/event' },
      validationIssues: [{
        entityType: 'event',
        key: 'sourceUrl:https://example.com/event',
        title: 'Incomplete event',
        missingFields: ['hostName', 'location'],
      }],
    };
    applyStoredComputeJob.mockRejectedValue(error);

    const response = await request(app)
      .post('/admin/pivot/compute-jobs/job:refresh-iowacity-invalid/apply')
      .send({
        idempotencyKey: 'apply:invalid-001',
        preview: loadFixture('result-preview-valid.json'),
      });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      code: 'COMPUTE_APPLY_VALIDATION_FAILED',
      result: {
        outcome: 'rejected',
        job: { status: 'review-required' },
        summary: { creates: 0, updates: 0 },
        validationIssues: [expect.objectContaining({ missingFields: ['hostName', 'location'] })],
      },
    });
  });

  it('returns actionable errors when retry is not allowed', async () => {
    const error = new Error('Compute job cannot be retried from status completed');
    error.code = 'COMPUTE_JOB_NOT_RETRYABLE';
    error.status = 409;
    retryAdminComputeJob.mockRejectedValue(error);

    const response = await request(app)
      .post('/admin/pivot/compute-jobs/job:discovery-iowacity-001/retry')
      .send({});

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('COMPUTE_JOB_NOT_RETRYABLE');
  });
});
