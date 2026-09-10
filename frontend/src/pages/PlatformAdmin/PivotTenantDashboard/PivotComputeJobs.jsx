import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetch, authenticatedRequest } from '../../../hooks/useFetch';
import PivotTenantPage from './PivotTenantPage';
import {
  COMPUTE_JOB_KINDS,
  COMPUTE_JOB_STATUSES,
  formatAge,
  formatComputeJobKind,
  formatComputeJobOrigin,
  formatComputeJobStatus,
  formatFailure,
  formatProgress,
  formatTimestamp,
  hasActiveComputeJobs,
  isActiveComputeJob,
  redactSensitiveFields,
  resolveScheduleOccurrenceId,
  resolveWorkerId,
  summarizeStoredResult,
} from './pivotComputeJobsFormat';
import './PivotTenantPage.scss';
import './PivotComputeJobs.scss';
import PivotComputeJobReview from './PivotComputeJobReview';
import { ComputeJobCreateForm, ComputeJobDetailActions } from './ComputeJobActions';

const NO_FETCH_CACHE = { enabled: false };
const LIST_POLL_MS = 5000;
const DETAIL_POLL_MS = 5000;
const MAX_ATTEMPTS_SHOWN = 20;

/**
 * `/platform-admin/pivot/:tenantKey?page=10`
 * Appended after Weekly drop — do not insert earlier pages.
 */
export const PIVOT_TENANT_COMPUTE_JOBS_PAGE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...COMPUTE_JOB_STATUSES.map((status) => ({
    value: status,
    label: formatComputeJobStatus(status).label,
  })),
];

const KIND_FILTER_OPTIONS = [
  { value: 'all', label: 'All kinds' },
  ...COMPUTE_JOB_KINDS.map((kind) => ({
    value: kind,
    label: formatComputeJobKind(kind),
  })),
];

function ComputeJobStatusPill({ status }) {
  const { label, pillClass } = formatComputeJobStatus(status);
  return (
    <span className={`pivot-lab__pill${pillClass ? ` ${pillClass}` : ''}`}>
      {label}
    </span>
  );
}

function AttemptStatusPill({ status }) {
  const normalized = String(status || '').replace(/-/g, ' ');
  const label = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '—';
  return <span className="pivot-lab__pill pivot-lab__pill--muted">{label}</span>;
}

function DetailField({ label, value, mono = false }) {
  return (
    <div className="pivot-compute-jobs__detail-field">
      <dt>{label}</dt>
      <dd className={mono ? 'pivot-compute-jobs__mono' : undefined}>{value}</dd>
    </div>
  );
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MiB`;
}

function ComputeJobDetail({
  job,
  attempts,
  loading,
  error,
  nowMs,
}) {
  if (loading && !job) {
    return <p className="pivot-lab__empty">Loading job detail…</p>;
  }
  if (error) {
    return <p className="pivot-lab__error" role="alert">{error}</p>;
  }
  if (!job) {
    return null;
  }

  const resultSummary = summarizeStoredResult(job.result);
  const safeJob = redactSensitiveFields(job);
  const visibleAttempts = Array.isArray(attempts) ? attempts.slice(0, MAX_ATTEMPTS_SHOWN) : [];
  const failure = safeJob.failure;
  const canRetry = safeJob.status === 'retryable';

  return (
    <div className="pivot-compute-jobs__detail" data-testid="compute-job-detail">
      <dl className="pivot-compute-jobs__detail-grid">
        <DetailField label="Job id" value={safeJob.externalJobId} mono />
        <DetailField label="Origin" value={formatComputeJobOrigin(safeJob.origin)} />
        <DetailField label="Kind" value={formatComputeJobKind(safeJob.kind)} />
        <DetailField label="City" value={safeJob.cityKey || '—'} mono />
        <DetailField
          label="Schedule occurrence"
          value={resolveScheduleOccurrenceId(safeJob)}
          mono
        />
        <DetailField label="Worker" value={resolveWorkerId(safeJob)} mono />
        <DetailField
          label="Attempt"
          value={String(safeJob.attemptCount ?? safeJob.lease?.attemptNumber ?? 0)}
        />
        <DetailField label="Context version" value={safeJob.contextVersion || '—'} mono />
        <DetailField label="Contract version" value={safeJob.contractVersion || '—'} mono />
        <DetailField
          label="Implementation"
          value={safeJob.implementationRevision || '—'}
          mono
        />
        <DetailField
          label="Status"
          value={<ComputeJobStatusPill status={safeJob.status} />}
        />
        <DetailField label="Progress" value={formatProgress(safeJob.progress)} />
        <DetailField
          label="Age"
          value={formatAge(safeJob.requestedAt || safeJob.createdAt, nowMs)}
        />
        <DetailField label="Requested" value={formatTimestamp(safeJob.requestedAt)} />
        <DetailField label="Updated" value={formatTimestamp(safeJob.updatedAt)} />
      </dl>

      {failure ? (
        <section className="pivot-compute-jobs__failure" role="alert" aria-label="Failure and recovery">
          <div>
            <p className="pivot-compute-jobs__failure-code">{failure.code || 'JOB_FAILED'}</p>
            <p className="pivot-compute-jobs__failure-message">{failure.message || 'The job failed without a message.'}</p>
            {Array.isArray(failure.details) && failure.details.length ? (
              <ul className="pivot-compute-jobs__failure-details">
                {failure.details.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            ) : null}
          </div>
          <p className="pivot-compute-jobs__failure-recourse">
            {canRetry
              ? 'This attempt is retryable. Retry uses the same request and a fresh lease; use Run controls above to create a smaller replacement instead.'
              : 'This failure is terminal. Use Run controls above to create a corrected or smaller replacement job.'}
          </p>
        </section>
      ) : null}

      <section className="pivot-compute-jobs__detail-section" aria-label="Request options">
        <h3 className="pivot-compute-jobs__detail-heading">Request options</h3>
        <pre className="pivot-compute-jobs__json">{JSON.stringify(safeJob.options || {}, null, 2)}</pre>
      </section>

      {resultSummary ? (
        <section className="pivot-compute-jobs__detail-section" aria-label="Stored result summary">
          <h3 className="pivot-compute-jobs__detail-heading">Result summary</h3>
          <dl className="pivot-compute-jobs__detail-grid">
            <DetailField label="Mode" value={resultSummary.mode || '—'} />
            <DetailField label="Submitted" value={formatTimestamp(resultSummary.submittedAt)} />
            <DetailField
              label="Idempotency key"
              value={resultSummary.resultIdempotencyKey || '—'}
              mono
            />
            <DetailField
              label="Embedded payload"
              value={resultSummary.hasEmbeddedResult ? 'Present (not shown)' : 'Not stored inline'}
            />
            <DetailField label="Payload size" value={formatBytes(resultSummary.embeddedByteSize)} />
            {Object.entries(resultSummary.embeddedSummary || {}).map(([key, value]) => (
              <DetailField key={key} label={key.replace(/([A-Z])/g, ' $1')} value={String(value)} />
            ))}
          </dl>
        </section>
      ) : null}

      {safeJob.applicationAudit ? (
        <section className="pivot-compute-jobs__detail-section" aria-label="Application audit">
          <h3 className="pivot-compute-jobs__detail-heading">Application audit</h3>
          <dl className="pivot-compute-jobs__detail-grid">
            <DetailField label="Outcome" value={safeJob.applicationAudit.outcome || '—'} />
            <DetailField label="Applied by" value={safeJob.applicationAudit.appliedBy || '—'} />
            <DetailField label="Applied at" value={formatTimestamp(safeJob.applicationAudit.appliedAt)} />
          </dl>
        </section>
      ) : null}

      <section className="pivot-compute-jobs__detail-section" aria-label="Attempts">
        <h3 className="pivot-compute-jobs__detail-heading">Attempts</h3>
        {visibleAttempts.length === 0 ? (
          <p className="pivot-lab__empty">No attempts recorded yet.</p>
        ) : (
          <div className="pivot-lab__table-wrap">
            <table className="pivot-lab__table pivot-compute-jobs__attempts-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Status</th>
                  <th scope="col">Worker</th>
                  <th scope="col">Started</th>
                  <th scope="col">Finished</th>
                  <th scope="col">Failure</th>
                </tr>
              </thead>
              <tbody>
                {visibleAttempts.map((attempt) => {
                  const safeAttempt = redactSensitiveFields(attempt);
                  return (
                    <tr key={`${safeAttempt.attemptNumber}-${safeAttempt.id || safeAttempt.startedAt}`}>
                      <td>{safeAttempt.attemptNumber}</td>
                      <td><AttemptStatusPill status={safeAttempt.status} /></td>
                      <td className="pivot-compute-jobs__mono">{safeAttempt.workerId || '—'}</td>
                      <td>{formatTimestamp(safeAttempt.startedAt || safeAttempt.leasedAt)}</td>
                      <td>{formatTimestamp(safeAttempt.finishedAt)}</td>
                      <td>{formatFailure(safeAttempt.failure, { maxLength: 120 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {Array.isArray(attempts) && attempts.length > MAX_ATTEMPTS_SHOWN ? (
          <p className="pivot-lab__section-hint">
            Showing first {MAX_ATTEMPTS_SHOWN} of {attempts.length} attempts.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function PivotComputeJobs({ tenantKey, cityDisplayName }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [detailAttempts, setDetailAttempts] = useState([]);

  const statusFilter = searchParams.get('computeStatus') || 'all';
  const kindFilter = searchParams.get('computeKind') || 'all';
  const selectedJobId = searchParams.get('computeJobId') || '';

  const listParams = useMemo(() => {
    const params = {
      cityKey: tenantKey,
      limit: 50,
    };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (kindFilter !== 'all') params.kind = kindFilter;
    return params;
  }, [tenantKey, statusFilter, kindFilter]);

  const {
    data: listResponse,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useFetch('/admin/pivot/compute-jobs', {
    params: listParams,
    cache: NO_FETCH_CACHE,
  });

  const jobs = listResponse?.jobs || [];
  const shouldPollList = hasActiveComputeJobs(jobs);

  const updateSearchParam = useCallback((key, value) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value == null || value === '' || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      if (next.get('page') !== String(PIVOT_TENANT_COMPUTE_JOBS_PAGE)) {
        next.set('page', String(PIVOT_TENANT_COMPUTE_JOBS_PAGE));
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const selectJob = useCallback((externalJobId) => {
    updateSearchParam('computeJobId', externalJobId);
  }, [updateSearchParam]);

  const clearSelection = useCallback(() => {
    updateSearchParam('computeJobId', null);
  }, [updateSearchParam]);

  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    if (!selectedJobId) {
      setDetailJob(null);
      setDetailAttempts([]);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    if (!silent) {
      setDetailLoading(true);
      setDetailError(null);
    }

    const { data, error } = await authenticatedRequest(
      `/admin/pivot/compute-jobs/${encodeURIComponent(selectedJobId)}`,
    );

    if (error) {
      setDetailError(typeof error === 'string' ? error : 'Could not load compute job detail.');
      setDetailJob(null);
      setDetailAttempts([]);
      setDetailLoading(false);
      return;
    }

    setDetailJob(data?.job || null);
    setDetailAttempts(Array.isArray(data?.attempts) ? data.attempts : []);
    setDetailError(null);
    setDetailLoading(false);
  }, [selectedJobId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!shouldPollList) return undefined;
    const timer = window.setInterval(() => {
      refetchList({ silent: true });
    }, LIST_POLL_MS);
    return () => window.clearInterval(timer);
  }, [shouldPollList, refetchList]);

  useEffect(() => {
    if (!selectedJobId || !isActiveComputeJob(detailJob)) return undefined;
    const timer = window.setInterval(() => {
      loadDetail({ silent: true });
    }, DETAIL_POLL_MS);
    return () => window.clearInterval(timer);
  }, [selectedJobId, detailJob, loadDetail]);

  const selectedListJob = useMemo(
    () => jobs.find((job) => job.externalJobId === selectedJobId) || null,
    [jobs, selectedJobId],
  );

  return (
    <PivotTenantPage
      title="Compute jobs"
      tenantKey={tenantKey}
      cityDisplayName={cityDisplayName}
      subtitle="Offloaded discovery and curation refresh work for this city."
      className="pivot-compute-jobs"
    >
      <section className="linear-section pivot-lab__section" aria-labelledby="compute-jobs-list">
        <div className="pivot-lab__section-head">
          <div>
            <h2 id="compute-jobs-list" className="linear-section__title">Jobs</h2>
            <p className="pivot-lab__section-hint">
              Production-requested, scheduled, and manual-upload compute jobs. Worker credentials and
              private diagnostics are never shown here.
            </p>
          </div>
        </div>

        <ComputeJobCreateForm
          tenantKey={tenantKey}
          onCreated={(job) => {
            refetchList({ silent: true });
            if (job?.externalJobId) selectJob(job.externalJobId);
          }}
        />

        <div className="pivot-compute-jobs__filters">
          <label className="pivot-compute-jobs__filter">
            <span>Status</span>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => updateSearchParam('computeStatus', event.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="pivot-compute-jobs__filter">
            <span>Kind</span>
            <select
              aria-label="Filter by kind"
              value={kindFilter}
              onChange={(event) => updateSearchParam('computeKind', event.target.value)}
            >
              {KIND_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {selectedJobId ? (
            <button
              type="button"
              className="linear-btn linear-btn--secondary pivot-compute-jobs__clear"
              onClick={clearSelection}
            >
              Clear selection
            </button>
          ) : null}
        </div>

        {listError ? (
          <p className="pivot-lab__error" role="alert">{listError}</p>
        ) : null}

        {listLoading && jobs.length === 0 ? (
          <p className="pivot-lab__empty">Loading compute jobs…</p>
        ) : null}

        {!listLoading && jobs.length === 0 && !listError ? (
          <p className="pivot-lab__empty">No compute jobs match these filters.</p>
        ) : null}

        {jobs.length > 0 ? (
          <div className="pivot-lab__table-wrap">
            <table className="pivot-lab__table pivot-compute-jobs__table" aria-label="Compute jobs">
              <thead>
                <tr>
                  <th scope="col">Origin</th>
                  <th scope="col">Kind</th>
                  <th scope="col">City</th>
                  <th scope="col">Schedule occurrence</th>
                  <th scope="col">Worker</th>
                  <th scope="col">Attempt</th>
                  <th scope="col">Context version</th>
                  <th scope="col">Status</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Age</th>
                  <th scope="col">Failure</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const isSelected = job.externalJobId === selectedJobId;
                  return (
                    <tr
                      key={job.externalJobId}
                      className={isSelected ? 'is-selected' : undefined}
                    >
                      <td>
                        <button
                          type="button"
                          className="pivot-compute-jobs__row-button"
                          onClick={() => selectJob(job.externalJobId)}
                          aria-pressed={isSelected}
                        >
                          {formatComputeJobOrigin(job.origin)}
                        </button>
                      </td>
                      <td>{formatComputeJobKind(job.kind)}</td>
                      <td className="pivot-compute-jobs__mono">{job.cityKey}</td>
                      <td className="pivot-compute-jobs__mono">
                        {resolveScheduleOccurrenceId(job)}
                      </td>
                      <td className="pivot-compute-jobs__mono">{resolveWorkerId(job)}</td>
                      <td>{job.attemptCount ?? job.lease?.attemptNumber ?? 0}</td>
                      <td className="pivot-compute-jobs__mono">{job.contextVersion || '—'}</td>
                      <td><ComputeJobStatusPill status={job.status} /></td>
                      <td>{formatProgress(job.progress)}</td>
                      <td>{formatAge(job.requestedAt || job.createdAt, nowMs)}</td>
                      <td>{formatFailure(job.failure, { maxLength: 80 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {shouldPollList ? (
          <p className="pivot-lab__section-hint">Refreshing while jobs are active…</p>
        ) : null}
      </section>

      {selectedJobId ? (
        <section
          className="linear-section pivot-lab__section"
          aria-labelledby="compute-job-detail-heading"
        >
          <div className="pivot-lab__section-head">
            <div>
              <h2 id="compute-job-detail-heading" className="linear-section__title">Job detail</h2>
              <p className="pivot-lab__section-hint">
                {selectedListJob
                  ? `${formatComputeJobKind(selectedListJob.kind)} · ${selectedJobId}`
                  : selectedJobId}
              </p>
            </div>
          </div>
          <ComputeJobDetail
            job={detailJob}
            attempts={detailAttempts}
            loading={detailLoading}
            error={detailError}
            nowMs={nowMs}
          />
          <ComputeJobDetailActions
            job={detailJob}
            onJobUpdated={() => {
              refetchList({ silent: true });
              loadDetail({ silent: true });
            }}
          />
        </section>
      ) : null}

      <PivotComputeJobReview
        tenantKey={tenantKey}
        onSubmitted={() => refetchList({ silent: true })}
        onApplied={() => {
          refetchList({ silent: true });
          if (selectedJobId) loadDetail({ silent: true });
        }}
      />
    </PivotTenantPage>
  );
}

export default PivotComputeJobs;
