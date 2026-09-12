import {
  buildAdminCreateJobRequest,
  canApplyStoredComputeJob,
  canCancelComputeJob,
  canPreviewStoredComputeJob,
  canRetryComputeJob,
  mutationFeedback,
} from './pivotComputeJobActions';

describe('pivotComputeJobActions', () => {
  it('derives action availability from job status', () => {
    expect(canCancelComputeJob({ status: 'pending' })).toBe(true);
    expect(canCancelComputeJob({ status: 'running' })).toBe(true);
    expect(canCancelComputeJob({ status: 'completed' })).toBe(false);
    expect(canRetryComputeJob({ status: 'retryable' })).toBe(true);
    expect(canRetryComputeJob({ status: 'failed' })).toBe(false);
    expect(canPreviewStoredComputeJob({
      status: 'review-required',
      result: { hasEmbeddedResult: true },
    })).toBe(true);
    expect(canPreviewStoredComputeJob({ status: 'review-required', result: null })).toBe(false);
    expect(canPreviewStoredComputeJob({
      kind: 'carousel-export',
      status: 'review-required',
      result: { hasEmbeddedResult: true },
    })).toBe(false);
    expect(canApplyStoredComputeJob({
      kind: 'carousel-export',
      externalJobId: 'job:carousel-iowacity-001',
      status: 'review-required',
    }, { jobId: 'job:carousel-iowacity-001', applyAllowed: true })).toBe(false);
  });

  it('allows apply only for matching review-required previews', () => {
    const job = { externalJobId: 'job:refresh-iowacity-001', status: 'review-required' };
    const preview = { jobId: 'job:refresh-iowacity-001', applyAllowed: true };
    expect(canApplyStoredComputeJob(job, preview)).toBe(true);
    expect(canApplyStoredComputeJob(job, { ...preview, applyAllowed: false })).toBe(false);
  });

  it('builds bounded admin create requests', () => {
    const request = buildAdminCreateJobRequest({
      tenantKey: 'iowacity',
      kind: 'city-curation-refresh',
    });
    expect(request.cityKey).toBe('iowacity');
    expect(request.kind).toBe('city-curation-refresh');
    expect(request.options).toEqual({ forceBatchWeek: false });
  });

  it('preserves bounded discovery controls and refresh subsets', () => {
    const discovery = buildAdminCreateJobRequest({
      tenantKey: 'iowacity',
      kind: 'city-source-discovery',
      options: {
        tags: ['music', 'markets'],
        maxQueries: 4,
        maxCandidates: 12,
        minEvents: 3,
        createJobs: false,
        recheckRejected: true,
        flow: 'native-only',
        lumaSlug: 'iowa-city',
        partifulSlug: 'iowa-city-events',
      },
    });
    expect(discovery.options).toEqual({
      tags: ['music', 'markets'],
      maxQueries: 4,
      maxCandidates: 12,
      minEvents: 3,
      createJobs: false,
      recheckRejected: true,
      flow: 'native-only',
      lumaSlug: 'iowa-city',
      partifulSlug: 'iowa-city-events',
    });

    const refresh = buildAdminCreateJobRequest({
      tenantKey: 'iowacity',
      kind: 'city-curation-refresh',
      options: {
        batchWeek: '2026-W37',
        forceBatchWeek: true,
        jobIds: ['507f1f77bcf86cd799439011', 'invalid'],
      },
    });
    expect(refresh.options).toEqual({
      batchWeek: '2026-W37',
      forceBatchWeek: true,
      jobIds: ['507f1f77bcf86cd799439011'],
    });
  });

  it('describes duplicate mutation outcomes without implying fresh success', () => {
    expect(mutationFeedback('cancel', { duplicate: true }).tone).toBe('info');
    expect(mutationFeedback('apply', { duplicate: true }).message).toMatch(/already recorded/i);
    expect(mutationFeedback('create', null, 'Permission denied').tone).toBe('error');
  });
});
