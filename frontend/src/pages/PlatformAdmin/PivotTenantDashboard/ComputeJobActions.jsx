import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../../hooks/useFetch';
import { useNotification } from '../../../NotificationContext';
import { ComputeResultPreviewPanel } from './PivotComputeJobReview';
import { formatComputeJobKind, COMPUTE_JOB_KINDS } from './pivotComputeJobsFormat';
import {
  buildAdminCreateJobRequest,
  canApplyStoredComputeJob,
  canCancelComputeJob,
  canPreviewStoredComputeJob,
  canRetryComputeJob,
  mutationFeedback,
} from './pivotComputeJobActions';

export function ComputeJobCreateForm({ tenantKey, onCreated }) {
  const { addNotification } = useNotification();
  const [kind, setKind] = useState('city-source-discovery');
  const [contextVersion, setContextVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleCreate = useCallback(async () => {
    const request = buildAdminCreateJobRequest({
      tenantKey,
      kind,
      contextVersion,
    });
    setLoading(true);
    setFeedback(null);

    const { data, error } = await authenticatedRequest('/admin/pivot/compute-jobs', {
      method: 'POST',
      data: { request },
    });

    setLoading(false);
    const result = mutationFeedback('create', data, error);
    setFeedback(result);
    if (error) return;

    addNotification({
      type: result.tone === 'success' ? 'success' : 'info',
      title: data?.created ? 'Compute job created' : 'Existing compute job',
      message: result.message,
    });
    onCreated?.(data?.job || null, { created: Boolean(data?.created) });
  }, [tenantKey, kind, contextVersion, addNotification, onCreated]);

  return (
    <section
      className="pivot-compute-jobs__create"
      aria-labelledby="compute-job-create-heading"
      data-testid="compute-job-create"
    >
      <h3 id="compute-job-create-heading" className="pivot-compute-jobs__controls-title">
        Request compute job
      </h3>
      <p className="pivot-lab__section-hint">
        Enqueue bounded discovery or refresh work for this city. Schedule configuration stays on the Mini.
      </p>
      <div className="pivot-compute-jobs__create-fields">
        <label className="pivot-compute-jobs__filter">
          <span>Kind</span>
          <select
            aria-label="Create job kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            disabled={loading}
          >
            {COMPUTE_JOB_KINDS.map((option) => (
              <option key={option} value={option}>{formatComputeJobKind(option)}</option>
            ))}
          </select>
        </label>
        <label className="pivot-compute-jobs__filter pivot-compute-jobs__create-context">
          <span>Context version (optional)</span>
          <input
            type="text"
            aria-label="Context version"
            value={contextVersion}
            onChange={(event) => setContextVersion(event.target.value)}
            placeholder="ctx:city.discovery.v3"
            disabled={loading}
          />
        </label>
        <button
          type="button"
          className="linear-btn"
          onClick={handleCreate}
          disabled={loading || !tenantKey}
        >
          {loading ? 'Creating…' : 'Create job'}
        </button>
      </div>
      {feedback ? (
        <p
          className={feedback.tone === 'error' ? 'pivot-lab__error' : 'pivot-lab__section-hint'}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}

export function ComputeJobDetailActions({
  job,
  onJobUpdated,
}) {
  const { addNotification } = useNotification();
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [applyConfirmed, setApplyConfirmed] = useState(false);

  const externalJobId = job?.externalJobId || '';
  const showPreview = canPreviewStoredComputeJob(job);
  const showCancel = canCancelComputeJob(job);
  const showRetry = canRetryComputeJob(job);
  const showApply = canApplyStoredComputeJob(job, preview);

  const resetPreview = useCallback(() => {
    setPreview(null);
    setApplyConfirmed(false);
  }, []);

  useEffect(() => {
    resetPreview();
  }, [job?.externalJobId, job?.status, resetPreview]);

  const runMutation = useCallback(async (action, request) => {
    setActionLoading(action);
    setActionFeedback(null);
    const { data, error } = await request();
    setActionLoading(null);
    const feedback = mutationFeedback(action, data, error);
    setActionFeedback(feedback);
    if (error) return null;
    addNotification({
      type: feedback.tone === 'error' ? 'error' : (feedback.tone === 'success' ? 'success' : 'info'),
      title: action.charAt(0).toUpperCase() + action.slice(1),
      message: feedback.message,
    });
    onJobUpdated?.(data?.job || job, { action, duplicate: Boolean(data?.duplicate) });
    return data;
  }, [addNotification, onJobUpdated, job]);

  const handlePreview = useCallback(async () => {
    if (!showPreview || !externalJobId) return;
    setPreviewLoading(true);
    setActionFeedback(null);
    setPreview(null);
    setApplyConfirmed(false);

    const { data, error } = await authenticatedRequest(
      `/admin/pivot/compute-jobs/${encodeURIComponent(externalJobId)}/preview`,
      { method: 'POST', data: {} },
    );

    setPreviewLoading(false);
    if (error) {
      setActionFeedback({ tone: 'error', message: error });
      return;
    }
    setPreview(data?.preview || null);
  }, [showPreview, externalJobId]);

  const handleCancel = useCallback(async () => {
    if (!showCancel || !externalJobId) return;
    await runMutation('cancel', () => authenticatedRequest(
      `/admin/pivot/compute-jobs/${encodeURIComponent(externalJobId)}/cancel`,
      { method: 'POST', data: {} },
    ));
    resetPreview();
  }, [showCancel, externalJobId, runMutation, resetPreview]);

  const handleRetry = useCallback(async () => {
    if (!showRetry || !externalJobId) return;
    await runMutation('retry', () => authenticatedRequest(
      `/admin/pivot/compute-jobs/${encodeURIComponent(externalJobId)}/retry`,
      {
        method: 'POST',
        data: { contextVersion: job?.contextVersion || undefined },
      },
    ));
    resetPreview();
  }, [showRetry, externalJobId, job?.contextVersion, runMutation, resetPreview]);

  const handleApply = useCallback(async () => {
    if (!showApply || !applyConfirmed || !preview || !externalJobId) return;
    const data = await runMutation('apply', () => authenticatedRequest(
      `/admin/pivot/compute-jobs/${encodeURIComponent(externalJobId)}/apply`,
      {
        method: 'POST',
        data: {
          idempotencyKey: `apply:${preview.jobId}`,
          preview,
        },
      },
    ));
    if (data) resetPreview();
  }, [showApply, applyConfirmed, preview, externalJobId, runMutation, resetPreview]);

  const controls = useMemo(() => {
    const items = [];
    if (showPreview) items.push('preview');
    if (showCancel) items.push('cancel');
    if (showRetry) items.push('retry');
    return items;
  }, [showPreview, showCancel, showRetry]);

  if (!job || controls.length === 0) {
    return null;
  }

  return (
    <section
      className="pivot-compute-jobs__controls"
      aria-label="Job actions"
      data-testid="compute-job-detail-actions"
    >
      <h3 className="pivot-compute-jobs__controls-title">Job actions</h3>
      <p className="pivot-lab__section-hint">
        Actions follow server state for this job. A duplicate response means production already recorded the outcome.
      </p>

      <div className="pivot-compute-jobs__controls-row">
        {showPreview ? (
          <button
            type="button"
            className="linear-btn linear-btn--secondary"
            onClick={handlePreview}
            disabled={previewLoading || Boolean(actionLoading)}
          >
            {previewLoading ? 'Previewing…' : 'Preview stored result'}
          </button>
        ) : null}
        {showCancel ? (
          <button
            type="button"
            className="linear-btn linear-btn--secondary"
            onClick={handleCancel}
            disabled={Boolean(actionLoading)}
          >
            {actionLoading === 'cancel' ? 'Cancelling…' : 'Cancel job'}
          </button>
        ) : null}
        {showRetry ? (
          <button
            type="button"
            className="linear-btn linear-btn--secondary"
            onClick={handleRetry}
            disabled={Boolean(actionLoading)}
          >
            {actionLoading === 'retry' ? 'Retrying…' : 'Retry job'}
          </button>
        ) : null}
      </div>

      {actionFeedback ? (
        <p
          className={actionFeedback.tone === 'error' ? 'pivot-lab__error' : 'pivot-lab__section-hint'}
          role={actionFeedback.tone === 'error' ? 'alert' : 'status'}
          data-testid="compute-job-action-feedback"
        >
          {actionFeedback.message}
        </p>
      ) : null}

      {preview ? (
        <>
          <ComputeResultPreviewPanel preview={preview} parsedResult={null} />
          {showApply ? (
            <div className="pivot-compute-review__apply-panel" data-testid="compute-stored-apply-panel">
              <h4 className="pivot-compute-review__apply-title">Apply stored result</h4>
              <label className="pivot-compute-review__confirm">
                <input
                  type="checkbox"
                  checked={applyConfirmed}
                  onChange={(event) => setApplyConfirmed(event.target.checked)}
                  disabled={actionLoading === 'apply'}
                />
                <span>
                  I reviewed the stored preview and confirm applying production mutations for
                  {' '}
                  {preview.jobId}.
                </span>
              </label>
              <button
                type="button"
                className="linear-btn"
                onClick={handleApply}
                disabled={!applyConfirmed || actionLoading === 'apply'}
              >
                {actionLoading === 'apply' ? 'Applying…' : 'Apply stored preview'}
              </button>
            </div>
          ) : (
            <p className="pivot-compute-review__blocked" role="status">
              Apply is unavailable until blocking preview issues are resolved.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
