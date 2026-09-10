import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PivotComputeJobReview, { ComputeResultPreviewPanel } from './PivotComputeJobReview';

const mockAuthenticatedRequest = jest.fn();
const mockAddNotification = jest.fn();

jest.mock('../../../hooks/useFetch', () => ({
  authenticatedRequest: (...args) => mockAuthenticatedRequest(...args),
}));

jest.mock('../../../NotificationContext', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

const VALID_RESULT = {
  contractVersion: '1',
  jobId: 'job:discovery-iowacity-001',
  scheduleOccurrenceId: null,
  kind: 'city-source-discovery',
  cityKey: 'iowacity',
  implementationRevision: 'relay-worker@2026.09.08',
  basedOnContextVersion: 'ctx:iowacity.discovery.v3',
  completedAt: '2026-09-08T20:45:00.000Z',
  outcome: 'completed',
  idempotencyKey: 'idem:discovery-iowacity-001',
  proposals: {
    sources: [],
    curationJobs: [],
    events: [],
  },
  summary: {
    searched: 8,
    qualified: 1,
    rejected: 2,
    eventsProposed: 1,
  },
};

const VALID_PREVIEW = {
  contractVersion: '1',
  jobId: 'job:discovery-iowacity-001',
  scheduleOccurrenceId: null,
  kind: 'city-source-discovery',
  cityKey: 'iowacity',
  implementationRevision: 'meridian-backend@2026.09.08',
  contextVersion: 'ctx:iowacity.discovery.v3',
  basedOnContextVersion: 'ctx:iowacity.discovery.v3',
  previewedAt: '2026-09-08T21:00:00.000Z',
  applyAllowed: true,
  blockingReasons: [],
  rows: [
    {
      entityType: 'source',
      action: 'create',
      key: 'host:example-theatre.org',
      basedOnRecordVersion: null,
      currentRecordVersion: null,
      message: null,
      evidence: {
        host: 'example-theatre.org',
        sourceUrl: 'https://example-theatre.org/events/show-1',
      },
    },
    {
      entityType: 'event',
      action: 'unchanged',
      key: 'sourceUrl:https://example-theatre.org/events/show-1',
      basedOnRecordVersion: 'rv:event-1',
      currentRecordVersion: 'rv:event-1',
      message: null,
      evidence: { sourceUrl: 'https://example-theatre.org/events/show-1' },
    },
  ],
  summary: {
    creates: 1,
    updates: 0,
    unchanged: 1,
    conflicts: 0,
    rejected: 0,
    stale: 0,
  },
};

function mockPreviewAndSubmit() {
  mockAuthenticatedRequest.mockImplementation((url) => {
    if (url === '/admin/pivot/compute-jobs/manual-preview') {
      return Promise.resolve({ data: { preview: VALID_PREVIEW } });
    }
    if (url === '/admin/pivot/compute-jobs/manual-submit') {
      return Promise.resolve({
        data: {
          job: { externalJobId: VALID_RESULT.jobId, status: 'review-required' },
          created: true,
          duplicate: false,
        },
      });
    }
    if (url === `/admin/pivot/compute-jobs/${encodeURIComponent(VALID_RESULT.jobId)}/apply`) {
      return Promise.resolve({
        data: {
          job: { externalJobId: VALID_RESULT.jobId, status: 'completed' },
          duplicate: false,
        },
      });
    }
    return Promise.resolve({ data: null });
  });
}

const STALE_PREVIEW = {
  ...VALID_PREVIEW,
  jobId: 'job:refresh-iowacity-stale',
  kind: 'city-curation-refresh',
  applyAllowed: false,
  blockingReasons: [
    {
      code: 'STALE_CONTEXT',
      message: 'Result was computed against ctx:iowacity.refresh.v6 but production is now ctx:iowacity.refresh.v7.',
    },
  ],
  rows: [
    {
      entityType: 'event',
      action: 'stale',
      key: 'sourceUrl:https://luma.com/iowa-city/event-abc',
      basedOnRecordVersion: 'rv:event-luma-abc',
      currentRecordVersion: 'rv:event-luma-abc-v2',
      message: 'Event changed after the worker started.',
      evidence: {
        sourceUrl: 'https://luma.com/iowa-city/event-abc',
        jobId: '507f1f77bcf86cd799439011',
      },
    },
  ],
  summary: {
    creates: 0,
    updates: 0,
    unchanged: 0,
    conflicts: 0,
    rejected: 0,
    stale: 1,
  },
};

function renderReview(props = {}) {
  return render(
    <PivotComputeJobReview tenantKey="iowacity" {...props} />,
  );
}

describe('PivotComputeJobReview', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedRequest.mockReset();
  });

  it('renders upload controls and client validation errors', () => {
    renderReview();

    expect(screen.getByRole('heading', { name: 'Manual result review' })).toBeInTheDocument();
    expect(screen.getByLabelText('Paste compute result JSON')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview changes' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Paste compute result JSON'), {
      target: { value: JSON.stringify({ ...VALID_RESULT, cityKey: 'nyc' }) },
    });

    expect(screen.getByTestId('compute-review-client-errors')).toHaveTextContent(/City mismatch/i);
    expect(screen.getByRole('button', { name: 'Preview changes' })).toBeDisabled();
  });

  it('rejects failed outcomes and forbidden diagnostic fields locally', () => {
    renderReview();

    fireEvent.change(screen.getByLabelText('Paste compute result JSON'), {
      target: {
        value: JSON.stringify({
          ...VALID_RESULT,
          outcome: 'failed',
          failure: { code: 'SITE_SCRAPE_NOT_CONFIGURED', message: 'Not configured.' },
        }),
      },
    });
    expect(screen.getByTestId('compute-review-client-errors')).toHaveTextContent(/Only completed results/i);

    fireEvent.change(screen.getByLabelText('Paste compute result JSON'), {
      target: { value: JSON.stringify({ ...VALID_RESULT, logs: ['step 1'] }) },
    });
    expect(screen.getByTestId('compute-review-client-errors')).toHaveTextContent(/diagnostic fields/i);
  });

  it('previews manual JSON and renders application rows, evidence, and summaries', async () => {
    mockPreviewAndSubmit();
    renderReview();

    fireEvent.change(screen.getByLabelText('Paste compute result JSON'), {
      target: { value: JSON.stringify(VALID_RESULT) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));

    const preview = await screen.findByTestId('compute-result-preview');
    expect(mockAuthenticatedRequest).toHaveBeenCalledWith('/admin/pivot/compute-jobs/manual-preview', {
      method: 'POST',
      data: { result: VALID_RESULT },
    });
    expect(within(preview).getByText('Worker diagnostic summary')).toBeInTheDocument();
    expect(within(preview).getByText('Application preview summary')).toBeInTheDocument();
    expect(within(preview).getByText('Create')).toBeInTheDocument();
    expect(within(preview).getAllByText('Unchanged').length).toBeGreaterThan(0);
    expect(within(preview).getByText('host:example-theatre.org')).toBeInTheDocument();
    expect(within(preview).getAllByText(/example-theatre.org\/events\/show-1/).length).toBeGreaterThan(0);
  });

  it('prioritizes production impact and exceptions while collapsing raw rows', () => {
    const review = {
      executionSummary: { jobsRun: 28, jobsFailed: 1, eventsProposed: 474, eventsRefreshed: 40 },
      impact: {
        eventCreates: 434,
        eventUpdates: 40,
        publishedEventUpdates: 3,
        stagedEventUpdates: 37,
        unchangedEvents: 0,
        sourceMutations: 0,
        curationJobMutations: 0,
      },
      sourceHealth: { completed: 27, failed: 1, skipped: 0, outcomes: [] },
      eventWindow: {
        earliestStart: '2026-09-09T20:00:00.000Z',
        latestStart: '2026-10-01T20:00:00.000Z',
      },
      timezone: 'America/Chicago',
      attentionTotal: 2,
      curationQuality: {
        eventCount: 474,
        metadataComplete: 430,
        eventsMissingMetadata: 44,
        needsRichData: 32,
        resolvedBatchWeek: '2026-W37',
        batchWeeks: [{ batchWeek: '2026-W37', count: 474 }],
        tagBreakdown: [{ tag: 'community', count: 210 }, { tag: 'music', count: 88 }],
        missingMetadata: [
          { key: 'untagged', label: 'No tags', count: 12 },
          { key: 'missing-host', label: 'Missing host', count: 7 },
          { key: 'missing-description', label: 'Missing description', count: 32 },
          { key: 'missing-image', label: 'Missing image', count: 19 },
        ],
      },
      warningGroups: [
        {
          code: 'PUBLISHED_EVENT_UPDATE',
          severity: 'high',
          title: 'Published events changing',
          message: 'Applying will immediately change events that are already visible in the feed.',
          count: 3,
          samples: [{ title: 'Community Meetup', sourceUrl: 'https://luma.com/event-1' }],
        },
        {
          code: 'HIGH_VOLUME_SOURCE',
          severity: 'attention',
          title: 'High-volume sources',
          message: 'These sources produced an unusually large set of mutations.',
          count: 1,
          samples: [{ title: 'Sample dance night', sourceUrl: 'https://luma.com/sample-dance-night' }],
        },
      ],
      attention: [
        {
          code: 'PUBLISHED_EVENT_UPDATE',
          severity: 'high',
          key: 'sourceUrl:https://luma.com/event-1',
          title: 'Community Meetup',
          sourceUrl: 'https://luma.com/event-1',
          jobLabel: 'Luma',
          provider: 'luma',
          ingestStatus: 'published',
          message: 'Applying this row changes an event that is already visible in the feed.',
          changes: [{ field: 'start_time', before: 'September 9', after: 'September 10' }],
        },
        {
          code: 'HIGH_VOLUME_SOURCE',
          severity: 'attention',
          key: 'group:luma',
          title: 'Luma',
          provider: 'luma',
          message: '474 event mutations came from this curation job.',
          changes: [],
          samples: [{
            title: 'Sample dance night',
            action: 'create',
            start: '2026-09-12T01:00:00.000Z',
            sourceUrl: 'https://luma.com/sample-dance-night',
          }],
        },
      ],
      groups: [{
        key: 'luma',
        label: 'Luma',
        provider: 'luma',
        creates: 434,
        updates: 40,
        unchanged: 0,
        attention: 1,
        samples: [{ title: 'Sample dance night' }],
      }],
    };

    render(<ComputeResultPreviewPanel preview={VALID_PREVIEW} parsedResult={null} review={review} />);

    const risk = screen.getByTestId('compute-risk-review');
    expect(risk).toHaveTextContent('What will change in production');
    expect(risk).toHaveTextContent('Published events affected');
    expect(risk).toHaveTextContent('Curation quality');
    expect(risk).toHaveTextContent('2026-W37');
    expect(risk).toHaveTextContent('Tag breakdown');
    expect(risk).toHaveTextContent('community');
    expect(risk).toHaveTextContent('Missing host');
    expect(risk).toHaveTextContent('Aggregate warnings');
    expect(risk).toHaveTextContent('Published events changing');
    expect(risk).toHaveTextContent('3 affected');
    expect(risk).toHaveTextContent('Community Meetup');
    expect(risk).toHaveTextContent('Failed jobs');
    expect(risk).toHaveTextContent('health signals only');
    expect(risk).toHaveTextContent('America/Chicago');
    expect(risk).toHaveTextContent('HIGH_VOLUME_SOURCE');
    expect(risk).toHaveTextContent('Sample dance night');
    expect(risk).toHaveTextContent('final duplicate checks');
    expect(screen.getByText(`Raw mutation rows (${VALID_PREVIEW.rows.length})`)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Preview rows', hidden: true })).not.toBeVisible();
  });

  it('shows stale blocking reasons without offering apply', async () => {
    mockAuthenticatedRequest.mockResolvedValue({ data: { preview: STALE_PREVIEW } });
    renderReview();

    fireEvent.change(screen.getByLabelText('Paste compute result JSON'), {
      target: { value: JSON.stringify({ ...VALID_RESULT, kind: 'city-curation-refresh' }) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));

    const preview = await screen.findByTestId('compute-result-preview');
    expect(within(preview).getByText(/STALE_CONTEXT/i)).toBeInTheDocument();
    expect(within(preview).getAllByText('Stale').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Apply preview to production' })).not.toBeInTheDocument();
    expect(screen.getByText(/Apply is unavailable until blocking preview issues are resolved/i)).toBeInTheDocument();
  });

  it('submits for review separately from apply', async () => {
    mockPreviewAndSubmit();
    renderReview();
    fireEvent.change(screen.getByLabelText('Paste compute result JSON'), {
      target: { value: JSON.stringify(VALID_RESULT) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
    await screen.findByTestId('compute-result-preview');

    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));

    await waitFor(() => {
      expect(mockAuthenticatedRequest).toHaveBeenCalledWith('/admin/pivot/compute-jobs/manual-submit', {
        method: 'POST',
        data: { result: VALID_RESULT },
      });
    });
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Submitted for review',
      }));
    });
    expect(mockAuthenticatedRequest).not.toHaveBeenCalledWith(
      expect.stringContaining('/apply'),
      expect.anything(),
    );
  });

  it('requires explicit confirmation before apply and submits then applies', async () => {
    mockPreviewAndSubmit();
    renderReview();
    fireEvent.change(screen.getByLabelText('Paste compute result JSON'), {
      target: { value: JSON.stringify(VALID_RESULT) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
    await screen.findByTestId('compute-result-preview');

    const applyButton = screen.getByRole('button', { name: 'Apply preview to production' });
    expect(applyButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockAuthenticatedRequest).toHaveBeenCalledWith(
        `/admin/pivot/compute-jobs/${encodeURIComponent(VALID_RESULT.jobId)}/apply`,
        {
          method: 'POST',
          data: {
            idempotencyKey: `apply:${VALID_RESULT.jobId}`,
            preview: VALID_PREVIEW,
          },
        },
      );
    });
  });

  it('surfaces server validation errors safely', async () => {
    mockAuthenticatedRequest.mockResolvedValue({
      error: 'Invalid compute execution result: unknown field logs',
    });
    renderReview();

    fireEvent.change(screen.getByLabelText('Paste compute result JSON'), {
      target: { value: JSON.stringify(VALID_RESULT) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));

    expect(await screen.findByText(/Invalid compute execution result/i)).toBeInTheDocument();
    expect(screen.queryByTestId('compute-result-preview')).not.toBeInTheDocument();
  });

  it('reports duplicate apply outcomes without implying a fresh mutation', async () => {
    mockAuthenticatedRequest.mockImplementation((url) => {
      if (url === '/admin/pivot/compute-jobs/manual-preview') {
        return Promise.resolve({ data: { preview: VALID_PREVIEW } });
      }
      if (url === '/admin/pivot/compute-jobs/manual-submit') {
        return Promise.resolve({
          data: {
            job: { externalJobId: VALID_RESULT.jobId, status: 'review-required' },
            created: false,
            duplicate: true,
          },
        });
      }
      if (url.includes('/apply')) {
        return Promise.resolve({
          data: { job: { externalJobId: VALID_RESULT.jobId, status: 'completed' }, duplicate: true },
        });
      }
      return Promise.resolve({ data: null });
    });

    renderReview();
    fireEvent.change(screen.getByLabelText('Paste compute result JSON'), {
      target: { value: JSON.stringify(VALID_RESULT) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
    await screen.findByTestId('compute-result-preview');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Apply preview to production' }));

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
        type: 'info',
        message: expect.stringMatching(/already recorded/i),
      }));
    });
  });
});

describe('ComputeResultPreviewPanel', () => {
  it('renders a bounded preview panel directly', () => {
    render(
      <ComputeResultPreviewPanel preview={VALID_PREVIEW} parsedResult={VALID_RESULT} />,
    );
    expect(screen.getByText('Creates')).toBeInTheDocument();
    expect(screen.getByText('Searched')).toBeInTheDocument();
  });
});
