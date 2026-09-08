import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PivotComputeJobs, { PIVOT_TENANT_COMPUTE_JOBS_PAGE } from './PivotComputeJobs';

const mockUseFetch = jest.fn();
const mockAuthenticatedRequest = jest.fn();

jest.mock('../../../hooks/useFetch', () => ({
  useFetch: (...args) => mockUseFetch(...args),
  authenticatedRequest: (...args) => mockAuthenticatedRequest(...args),
}));

jest.mock('./PivotTenantPage', () => ({
  __esModule: true,
  default: ({ title, tenantKey, cityDisplayName, subtitle, children }) => (
    <div data-testid="pivot-tenant-page">
      <h1>{title}</h1>
      <p data-testid="compute-jobs-city">{cityDisplayName}</p>
      <p data-testid="compute-jobs-tenant">{tenantKey}</p>
      {subtitle ? <p data-testid="compute-jobs-subtitle">{subtitle}</p> : null}
      {children}
    </div>
  ),
}));

jest.mock('./PivotComputeJobReview', () => ({
  __esModule: true,
  default: () => <div data-testid="compute-job-review-stub" />,
  ComputeResultPreviewPanel: ({ preview }) => (
    <div data-testid="compute-result-preview">{preview.jobId}</div>
  ),
}));

const mockAddNotification = jest.fn();

jest.mock('../../../NotificationContext', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

const SAMPLE_JOBS = [
  {
    externalJobId: 'job:discovery-iowacity-001',
    cityKey: 'iowacity',
    kind: 'city-source-discovery',
    contextVersion: 'ctx:iowacity.discovery.v3',
    contractVersion: '1',
    implementationRevision: 'meridian-backend@2026.09.08',
    status: 'running',
    origin: { type: 'admin', requestedBy: 'admin@example.com' },
    scheduleOccurrenceId: null,
    attemptCount: 1,
    lease: {
      workerId: 'relay-mini-1',
      attemptNumber: 1,
      token: 'abcd1234secret',
    },
    progress: {
      phase: 'crawl',
      message: 'Evaluating candidates',
      counters: { candidates: 4 },
      updatedAt: '2026-09-08T20:05:00.000Z',
    },
    failure: null,
    requestedAt: '2026-09-08T20:00:00.000Z',
    createdAt: '2026-09-08T20:00:00.000Z',
    updatedAt: '2026-09-08T20:05:00.000Z',
  },
  {
    externalJobId: 'job:refresh-iowacity-001',
    cityKey: 'iowacity',
    kind: 'city-curation-refresh',
    contextVersion: 'ctx:iowacity.refresh.v8',
    contractVersion: '1',
    status: 'review-required',
    origin: {
      type: 'schedule',
      scheduleId: 'refresh-nightly',
      scheduleOccurrenceId: 'sched:refresh@2026-09-08T12:00:00.000Z',
    },
    scheduleOccurrenceId: 'sched:refresh@2026-09-08T12:00:00.000Z',
    attemptCount: 1,
    lease: null,
    progress: null,
    failure: null,
    requestedAt: '2026-09-08T12:00:00.000Z',
    createdAt: '2026-09-08T12:00:00.000Z',
    updatedAt: '2026-09-08T13:00:00.000Z',
  },
  {
    externalJobId: 'job:manual-iowacity-001',
    cityKey: 'iowacity',
    kind: 'city-source-discovery',
    contextVersion: 'ctx:iowacity.discovery.v2',
    contractVersion: '1',
    status: 'retryable',
    origin: { type: 'manual-upload', requestedBy: 'ops@example.com' },
    scheduleOccurrenceId: null,
    attemptCount: 1,
    lease: null,
    progress: null,
    failure: {
      code: 'PROVIDER_TIMEOUT',
      message: 'Firecrawl request timed out after 120s',
      retryable: true,
    },
    requestedAt: '2026-09-07T18:00:00.000Z',
    createdAt: '2026-09-07T18:00:00.000Z',
    updatedAt: '2026-09-07T18:30:00.000Z',
  },
];

function listFetchValue(overrides = {}) {
  return {
    data: { jobs: SAMPLE_JOBS, nextCursor: null },
    loading: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  };
}

function renderComputeJobs({
  fetchValue = listFetchValue(),
  path = '/platform-admin/pivot/iowacity?page=10',
  authValue,
} = {}) {
  mockUseFetch.mockReturnValue(fetchValue);
  if (authValue !== undefined) {
    mockAuthenticatedRequest.mockResolvedValue(authValue);
  }

  return render(
    <MemoryRouter initialEntries={[path]}>
      <PivotComputeJobs tenantKey="iowacity" cityDisplayName="Iowa City" />
    </MemoryRouter>,
  );
}

describe('PivotComputeJobs', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedRequest.mockReset();
    mockAddNotification.mockReset();
  });

  it('is locked to tenant-shell page 10', () => {
    expect(PIVOT_TENANT_COMPUTE_JOBS_PAGE).toBe(10);
  });

  it('lists compute jobs scoped to the tenant city with required columns', () => {
    renderComputeJobs();

    expect(screen.getByRole('heading', { name: 'Compute jobs' })).toBeInTheDocument();
    expect(screen.getByTestId('compute-jobs-city')).toHaveTextContent('Iowa City');
    expect(screen.getByRole('columnheader', { name: 'Origin' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Schedule occurrence' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Context version' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Failure' })).toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Compute jobs' });
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Admin request · admin@example.com')).toBeInTheDocument();
    expect(within(table).getAllByText('Source discovery')).toHaveLength(2);
    expect(within(table).getByText('ctx:iowacity.discovery.v3')).toBeInTheDocument();
    expect(within(table).getByText('relay-mini-1')).toBeInTheDocument();
    expect(within(table).getByText('PROVIDER_TIMEOUT: Firecrawl request timed out after 120s')).toBeInTheDocument();

    expect(mockUseFetch).toHaveBeenCalledWith(
      '/admin/pivot/compute-jobs',
      expect.objectContaining({
        params: expect.objectContaining({
          cityKey: 'iowacity',
          limit: 50,
        }),
      }),
    );
  });

  it('filters jobs by status and kind through query params', () => {
    renderComputeJobs({
      path: '/platform-admin/pivot/iowacity?page=10&computeStatus=failed&computeKind=city-curation-refresh',
    });

    expect(mockUseFetch).toHaveBeenCalledWith(
      '/admin/pivot/compute-jobs',
      expect.objectContaining({
        params: expect.objectContaining({
          cityKey: 'iowacity',
          status: 'failed',
          kind: 'city-curation-refresh',
        }),
      }),
    );
  });

  it('updates filters from the UI', () => {
    renderComputeJobs();

    fireEvent.change(screen.getByLabelText('Filter by status'), {
      target: { value: 'review-required' },
    });
    fireEvent.change(screen.getByLabelText('Filter by kind'), {
      target: { value: 'city-source-discovery' },
    });

    expect(mockUseFetch).toHaveBeenLastCalledWith(
      '/admin/pivot/compute-jobs',
      expect.objectContaining({
        params: expect.objectContaining({
          status: 'review-required',
          kind: 'city-source-discovery',
        }),
      }),
    );
  });

  it('shows a bounded detail view without credentials or embedded diagnostics', async () => {
    renderComputeJobs({
      path: '/platform-admin/pivot/iowacity?page=10&computeJobId=job:discovery-iowacity-001',
      authValue: {
        data: {
          job: {
            ...SAMPLE_JOBS[0],
            result: {
              mode: 'embedded',
              contractVersion: '1',
              submittedAt: '2026-09-08T20:10:00.000Z',
              resultIdempotencyKey: 'res:001',
              embedded: {
                proposals: [{ sourceId: 'src-1' }],
                diagnostics: { memoryMb: 512 },
              },
            },
          },
          attempts: [
            {
              id: 'attempt-1',
              attemptNumber: 1,
              status: 'running',
              workerId: 'relay-mini-1',
              leaseToken: 'super-secret-token',
              leasedAt: '2026-09-08T20:00:30.000Z',
              startedAt: '2026-09-08T20:01:00.000Z',
              finishedAt: null,
              failure: null,
            },
          ],
        },
      },
    });

    expect(await screen.findByTestId('compute-job-detail')).toBeInTheDocument();

    expect(mockAuthenticatedRequest).toHaveBeenCalledWith(
      '/admin/pivot/compute-jobs/job%3Adiscovery-iowacity-001',
    );

    const detail = screen.getByTestId('compute-job-detail');
    expect(within(detail).getByText('job:discovery-iowacity-001')).toBeInTheDocument();
    expect(within(detail).getByText('Admin request · admin@example.com')).toBeInTheDocument();
    expect(within(detail).getByText('Present (not shown)')).toBeInTheDocument();
    expect(screen.queryByText('super-secret-token')).not.toBeInTheDocument();
    expect(screen.queryByText('abcd1234secret')).not.toBeInTheDocument();
    expect(screen.queryByText(/memoryMb/i)).not.toBeInTheDocument();
    expect(within(detail).getByRole('columnheader', { name: 'Worker' })).toBeInTheDocument();
    expect(within(detail).getByText(/Evaluating candidates/)).toBeInTheDocument();
  });

  it('shows manual, scheduled, and admin-requested origins in the list', () => {
    renderComputeJobs();

    expect(screen.getByText('Admin request · admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Scheduled · refresh-nightly')).toBeInTheDocument();
    expect(screen.getByText('Manual upload · ops@example.com')).toBeInTheDocument();
    expect(screen.getByText('sched:refresh@2026-09-08T12:00:00.000Z')).toBeInTheDocument();
  });

  it('shows empty and error states safely', () => {
    const { rerender } = renderComputeJobs({
      fetchValue: listFetchValue({ data: { jobs: [], nextCursor: null } }),
    });
    expect(screen.getByText('No compute jobs match these filters.')).toBeInTheDocument();

    mockUseFetch.mockReturnValue(listFetchValue({
      data: null,
      error: 'Could not load compute jobs',
    }));
    rerender(
      <MemoryRouter initialEntries={['/platform-admin/pivot/iowacity?page=10']}>
        <PivotComputeJobs tenantKey="iowacity" cityDisplayName="Iowa City" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Could not load compute jobs')).toBeInTheDocument();
  });

  it('selects a job from the list and can clear the selection', async () => {
    mockAuthenticatedRequest.mockResolvedValue({ data: { job: SAMPLE_JOBS[2], attempts: [] } });
    renderComputeJobs();

    fireEvent.click(screen.getByRole('button', { name: 'Manual upload · ops@example.com' }));

    expect(await screen.findByRole('heading', { name: 'Job detail' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByTestId('compute-job-detail')).not.toBeInTheDocument();
  });

  it('creates a bounded compute job for the tenant city', async () => {
    mockAuthenticatedRequest.mockResolvedValue({
      data: {
        created: true,
        job: { externalJobId: 'job:discovery-iowacity-new', status: 'pending' },
      },
    });
    renderComputeJobs();

    fireEvent.click(screen.getByRole('button', { name: 'Create job' }));

    await waitFor(() => {
      expect(mockAuthenticatedRequest).toHaveBeenCalledWith(
        '/admin/pivot/compute-jobs',
        expect.objectContaining({
          method: 'POST',
          data: expect.objectContaining({
            request: expect.objectContaining({
              cityKey: 'iowacity',
              kind: 'city-source-discovery',
              contractVersion: '1',
            }),
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Compute job created',
      }));
    });
  });

  it('shows state-specific detail controls for review, retryable, and running jobs', async () => {
    mockAuthenticatedRequest.mockImplementation((url) => {
      if (url.includes('job%3Arefresh-iowacity-001')) {
        return Promise.resolve({
          data: {
            job: {
              ...SAMPLE_JOBS[1],
              result: { hasEmbeddedResult: true, mode: 'embedded' },
            },
            attempts: [],
          },
        });
      }
      if (url.includes('job%3Amanual-iowacity-001')) {
        return Promise.resolve({
          data: { job: SAMPLE_JOBS[2], attempts: [] },
        });
      }
      if (url.includes('job%3Adiscovery-iowacity-001')) {
        return Promise.resolve({
          data: { job: SAMPLE_JOBS[0], attempts: [] },
        });
      }
      return Promise.resolve({ data: null });
    });

    renderComputeJobs({
      path: '/platform-admin/pivot/iowacity?page=10&computeJobId=job:refresh-iowacity-001',
    });

    expect(await screen.findByTestId('compute-job-detail')).toBeInTheDocument();
    expect(await screen.findByTestId('compute-job-detail-actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview stored result' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel job' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry job' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manual upload · ops@example.com' }));
    expect(await screen.findByTestId('compute-job-detail')).toBeInTheDocument();
    expect(await screen.findByTestId('compute-job-detail-actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry job' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Preview stored result' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Admin request · admin@example.com' }));
    expect(await screen.findByTestId('compute-job-detail')).toBeInTheDocument();
    expect(await screen.findByTestId('compute-job-detail-actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel job' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Preview stored result' })).not.toBeInTheDocument();
  });

  it('previews and applies stored results with explicit confirmation', async () => {
    const preview = {
      contractVersion: '1',
      jobId: 'job:refresh-iowacity-001',
      kind: 'city-curation-refresh',
      cityKey: 'iowacity',
      contextVersion: 'ctx:iowacity.refresh.v8',
      basedOnContextVersion: 'ctx:iowacity.refresh.v8',
      previewedAt: '2026-09-08T21:00:00.000Z',
      applyAllowed: true,
      blockingReasons: [],
      rows: [],
      summary: {
        creates: 1,
        updates: 0,
        unchanged: 0,
        conflicts: 0,
        rejected: 0,
        stale: 0,
      },
    };

    mockAuthenticatedRequest.mockImplementation((url, options = {}) => {
      if (url.includes('/preview')) {
        return Promise.resolve({ data: { preview } });
      }
      if (url.includes('/apply')) {
        return Promise.resolve({
          data: { job: { externalJobId: preview.jobId, status: 'completed' }, duplicate: false },
        });
      }
      return Promise.resolve({
        data: {
          job: {
            ...SAMPLE_JOBS[1],
            result: { hasEmbeddedResult: true, mode: 'embedded' },
          },
          attempts: [],
        },
      });
    });

    renderComputeJobs({
      path: '/platform-admin/pivot/iowacity?page=10&computeJobId=job:refresh-iowacity-001',
    });

    expect(await screen.findByRole('button', { name: 'Preview stored result' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Preview stored result' }));
    expect(await screen.findByTestId('compute-result-preview')).toHaveTextContent(preview.jobId);

    const applyButton = screen.getByRole('button', { name: 'Apply stored preview' });
    expect(applyButton).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockAuthenticatedRequest).toHaveBeenCalledWith(
        `/admin/pivot/compute-jobs/${encodeURIComponent(preview.jobId)}/apply`,
        expect.objectContaining({
          method: 'POST',
          data: expect.objectContaining({
            idempotencyKey: `apply:${preview.jobId}`,
            preview,
          }),
        }),
      );
    });
  });

  it('surfaces server action errors without implying success', async () => {
    mockAuthenticatedRequest.mockImplementation((url, options = {}) => {
      if (options.method === 'POST' && url.includes('/retry')) {
        return Promise.resolve({ error: 'Compute job cannot be retried from status completed' });
      }
      if (url.includes('job%3Amanual-iowacity-001')) {
        return Promise.resolve({ data: { job: SAMPLE_JOBS[2], attempts: [] } });
      }
      return Promise.resolve({ data: null });
    });

    renderComputeJobs({
      path: '/platform-admin/pivot/iowacity?page=10&computeJobId=job:manual-iowacity-001',
    });

    await screen.findByTestId('compute-job-detail');
    fireEvent.click(await screen.findByRole('button', { name: 'Retry job' }));
    expect(await screen.findByTestId('compute-job-action-feedback')).toHaveTextContent(/cannot be retried/i);
    expect(mockAddNotification).not.toHaveBeenCalled();
  });
});
