import React, { useCallback, useMemo, useRef, useState } from 'react';
import { authenticatedRequest } from '../../../hooks/useFetch';
import { useNotification } from '../../../NotificationContext';
import {
  formatComputeJobKind,
  formatTimestamp,
} from './pivotComputeJobsFormat';
import {
  formatEvidence,
  formatExecutionSummary,
  formatPreviewAction,
  formatPreviewEntityType,
  formatPreviewSummary,
  MAX_UPLOAD_BYTES,
  previewAllowsApply,
  previewBlockingMessage,
  validateParsedResult,
  validateUploadedResultText,
  visiblePreviewRows,
} from './pivotComputeJobReviewFormat';

function PreviewActionPill({ action }) {
  const { label, pillClass } = formatPreviewAction(action);
  return (
    <span className={`pivot-lab__pill${pillClass ? ` ${pillClass}` : ''}`}>
      {label}
    </span>
  );
}

function SummaryGrid({ title, entries }) {
  if (!entries.length) return null;
  return (
    <div className="pivot-compute-review__summary-block">
      <h4 className="pivot-compute-review__summary-title">{title}</h4>
      <dl className="pivot-compute-review__summary-grid">
        {entries.map(([label, value]) => (
          <div key={label} className="pivot-compute-review__summary-item">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function formatReviewValue(value) {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ') || '—';
  return String(value);
}

function formatReviewTimestamp(value, timeZone) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  try {
    return parsed.toLocaleString([], timeZone ? { timeZone, timeZoneName: 'short' } : undefined);
  } catch {
    return formatTimestamp(value);
  }
}

function PreviewRowsTable({ rows }) {
  return (
    <div className="pivot-lab__table-wrap">
      <table className="pivot-lab__table pivot-compute-review__rows-table" aria-label="Preview rows">
        <thead>
          <tr>
            <th scope="col">Entity</th>
            <th scope="col">Action</th>
            <th scope="col">Key</th>
            <th scope="col">Based on</th>
            <th scope="col">Current</th>
            <th scope="col">Message</th>
            <th scope="col">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.entityType}:${row.key}:${row.action}`}>
              <td>{formatPreviewEntityType(row.entityType)}</td>
              <td><PreviewActionPill action={row.action} /></td>
              <td className="pivot-compute-jobs__mono">{row.key}</td>
              <td className="pivot-compute-jobs__mono">{row.basedOnRecordVersion || '—'}</td>
              <td className="pivot-compute-jobs__mono">{row.currentRecordVersion || '—'}</td>
              <td>{row.message || '—'}</td>
              <td>{formatEvidence(row.evidence)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExceptionDrivenReview({ review }) {
  const impact = review?.impact || {};
  const sourceHealth = review?.sourceHealth || {};
  const attention = Array.isArray(review?.attention) ? review.attention : [];
  const groups = Array.isArray(review?.groups) ? review.groups : [];
  const visibleAttention = attention.slice(0, 100);

  return (
    <div className="pivot-compute-review__risk-review" data-testid="compute-risk-review">
      <SummaryGrid
        title="What will change in production"
        entries={[
          ['New staged events', impact.eventCreates ?? 0],
          ['Existing event updates', impact.eventUpdates ?? 0],
          ['Published events affected', impact.publishedEventUpdates ?? 0],
          ['Staged/draft events affected', impact.stagedEventUpdates ?? 0],
          ['Source changes', impact.sourceMutations ?? 0],
          ['Curation job changes', impact.curationJobMutations ?? 0],
        ]}
      />

      <SummaryGrid
        title="Curation run health"
        entries={[
          ['Completed jobs', sourceHealth.completed ?? 0],
          ['Failed jobs', sourceHealth.failed ?? 0],
          ['Skipped jobs', sourceHealth.skipped ?? 0],
          ['Events unchanged', impact.unchangedEvents ?? 0],
        ]}
      />

      <div className="pivot-compute-review__window">
        <strong>Event window</strong>
        <span>
          {review?.eventWindow?.earliestStart
            ? [
              formatReviewTimestamp(review.eventWindow.earliestStart, review.timezone),
              formatReviewTimestamp(review.eventWindow.latestStart, review.timezone),
            ].join(' → ')
            : 'No event dates proposed'}
          {review?.timezone ? ` · ${review.timezone}` : ''}
        </span>
      </div>

      <section className="pivot-compute-review__attention" aria-label="Needs attention">
        <div className="pivot-compute-review__section-heading">
          <h4>Needs attention</h4>
          <span className="pivot-lab__pill pivot-lab__pill--warn">
            {review?.attentionTotal ?? attention.length}
          </span>
        </div>
        {visibleAttention.length === 0 ? (
          <p className="pivot-compute-review__ready">
            No published-event changes, incomplete sources, temporal anomalies, stale rows, or conflicts detected.
          </p>
        ) : (
          <div className="pivot-compute-review__attention-list">
            {visibleAttention.map((item, index) => (
              <article
                key={`${item.code}:${item.key}:${index}`}
                className={`pivot-compute-review__attention-card is-${item.severity || 'attention'}`}
              >
                <div className="pivot-compute-review__attention-header">
                  <div>
                    <span className="pivot-compute-review__risk-code">{item.code}</span>
                    <h5>{item.title}</h5>
                  </div>
                  <span className="pivot-lab__pill pivot-lab__pill--warn">
                    {item.ingestStatus || item.provider || 'review'}
                  </span>
                </div>
                <p>{item.message}</p>
                <p className="pivot-lab__section-hint">
                  {[item.jobLabel, item.sourceUrl].filter(Boolean).join(' · ')}
                </p>
                {item.changes?.length ? (
                  <dl className="pivot-compute-review__changes">
                    {item.changes.map((change) => (
                      <div key={change.field}>
                        <dt>{change.field}</dt>
                        <dd>
                          <span>{formatReviewValue(change.before)}</span>
                          <span aria-hidden="true">→</span>
                          <strong>{formatReviewValue(change.after)}</strong>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {item.samples?.length ? (
                  <ul className="pivot-compute-review__samples" aria-label={`${item.title} sample events`}>
                    {item.samples.map((sample) => (
                      <li key={sample.sourceUrl}>
                        <strong>{sample.title}</strong>
                        <span>
                          {sample.action || 'proposed'}
                          {' · '}
                          {formatReviewTimestamp(sample.start, review.timezone)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        )}
        {(review?.attentionTotal ?? 0) > visibleAttention.length ? (
          <p className="pivot-lab__section-hint">
            Showing the first {visibleAttention.length} of {review.attentionTotal} attention items.
          </p>
        ) : null}
      </section>

      <details className="pivot-compute-review__routine">
        <summary>Routine changes by curation job ({groups.length})</summary>
        {groups.length ? (
          <div className="pivot-lab__table-wrap">
            <table className="pivot-lab__table" aria-label="Routine changes by curation job">
              <thead>
                <tr>
                  <th scope="col">Curation job</th>
                  <th scope="col">Provider</th>
                  <th scope="col">New</th>
                  <th scope="col">Updates</th>
                  <th scope="col">Unchanged</th>
                  <th scope="col">Attention</th>
                  <th scope="col">Sample</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.key}>
                    <td>{group.label}</td>
                    <td>{group.provider || '—'}</td>
                    <td>{group.creates}</td>
                    <td>{group.updates}</td>
                    <td>{group.unchanged}</td>
                    <td>{group.attention}</td>
                    <td>{group.samples?.map((sample) => sample.title).join(' · ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="pivot-lab__empty">No event groups returned.</p>}
      </details>

      <p className="pivot-lab__section-hint">
        Refresh curation-job outcomes are health signals only; applying this result does not modify those job records.
      </p>
      <p className="pivot-lab__section-hint">
        Proposed creates use exact source URLs in this preview. Production ingest performs its final duplicate
        checks during apply, so a create can still resolve to an existing event or fail validation.
      </p>
      {impact.publishedEventUpdates > 0 ? (
        <p className="pivot-compute-review__blocked" role="alert">
          Applying will immediately change {impact.publishedEventUpdates} published event{impact.publishedEventUpdates === 1 ? '' : 's'}.
        </p>
      ) : null}
    </div>
  );
}

export function ComputeResultPreviewPanel({ preview, parsedResult, review = null }) {
  const { rows, total, truncated } = visiblePreviewRows(preview);

  return (
    <div className="pivot-compute-review__preview" data-testid="compute-result-preview">
      <div className="pivot-compute-review__preview-meta">
        <p className="pivot-compute-review__preview-heading">
          {formatComputeJobKind(preview.kind)} · {preview.jobId}
        </p>
        <p className="pivot-lab__section-hint">
          Context {preview.basedOnContextVersion} → production {preview.contextVersion}
          {' · '}
          Previewed {formatTimestamp(preview.previewedAt)}
        </p>
      </div>

      <SummaryGrid
        title="Worker diagnostic summary"
        entries={formatExecutionSummary(parsedResult || (
          review ? { kind: preview.kind, summary: review.executionSummary } : null
        ))}
      />
      <SummaryGrid
        title={review ? 'Safety checks' : 'Application preview summary'}
        entries={review
          ? [
            ['Conflicts', preview.summary?.conflicts ?? 0],
            ['Stale', preview.summary?.stale ?? 0],
            ['Rejected', preview.summary?.rejected ?? 0],
          ]
          : formatPreviewSummary(preview.summary)}
      />

      {!preview.applyAllowed ? (
        <p className="pivot-compute-review__blocked" role="alert">
          {previewBlockingMessage(preview)}
        </p>
      ) : (
        <p className="pivot-compute-review__ready">
          Preview is eligible for explicit apply confirmation.
        </p>
      )}

      {review ? <ExceptionDrivenReview review={review} /> : null}

      {rows.length === 0 ? (
        <p className="pivot-lab__empty">No preview rows returned.</p>
      ) : review ? (
        <details className="pivot-compute-review__raw-rows">
          <summary>Raw mutation rows ({total})</summary>
          <PreviewRowsTable rows={rows} />
        </details>
      ) : (
        <PreviewRowsTable rows={rows} />
      )}

      {truncated ? (
        <p className="pivot-lab__section-hint">
          Showing first {rows.length} of {total} preview rows.
        </p>
      ) : null}
    </div>
  );
}

function PivotComputeJobReview({ tenantKey, onSubmitted, onApplied }) {
  const { addNotification } = useNotification();
  const fileInputRef = useRef(null);
  const [jsonText, setJsonText] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [clientErrors, setClientErrors] = useState([]);
  const [serverError, setServerError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [submittedJobId, setSubmittedJobId] = useState(null);
  const [applyConfirmed, setApplyConfirmed] = useState(false);

  const syncValidation = useCallback((text, resultOverride = null) => {
    const validated = validateUploadedResultText(text, { tenantKey });
    setParsedResult(validated.result);
    setClientErrors(validated.errors);
    return validated;
  }, [tenantKey]);

  const handleTextChange = useCallback((event) => {
    const nextText = event.target.value;
    setJsonText(nextText);
    setServerError(null);
    setPreview(null);
    setSubmittedJobId(null);
    setApplyConfirmed(false);
    syncValidation(nextText);
  }, [syncValidation]);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setJsonText('');
      setParsedResult(null);
      setPreview(null);
      setSubmittedJobId(null);
      setApplyConfirmed(false);
      setClientErrors([`File exceeds the ${MAX_UPLOAD_BYTES} byte upload limit.`]);
      setServerError(null);
      return;
    }

    try {
      const text = await file.text();
      setJsonText(text);
      setServerError(null);
      setPreview(null);
      setSubmittedJobId(null);
      setApplyConfirmed(false);
      syncValidation(text);
    } catch (_error) {
      setClientErrors(['Could not read the selected file.']);
    }
  }, [syncValidation]);

  const canPreview = useMemo(
    () => Boolean(parsedResult) && clientErrors.length === 0,
    [parsedResult, clientErrors],
  );

  const handlePreview = useCallback(async () => {
    const validated = syncValidation(jsonText);
    if (!validated.result || validated.errors.length) return;

    setPreviewLoading(true);
    setServerError(null);
    setPreview(null);
    setSubmittedJobId(null);
    setApplyConfirmed(false);

    const { data, error } = await authenticatedRequest('/admin/pivot/compute-jobs/manual-preview', {
      method: 'POST',
      data: { result: validated.result },
    });

    setPreviewLoading(false);
    if (error) {
      setServerError(error);
      return;
    }
    setPreview(data?.preview || null);
  }, [jsonText, syncValidation]);

  const handleSubmitForReview = useCallback(async () => {
    const validated = syncValidation(jsonText);
    if (!validated.result || validated.errors.length) return;

    setSubmitLoading(true);
    setServerError(null);

    const { data, error } = await authenticatedRequest('/admin/pivot/compute-jobs/manual-submit', {
      method: 'POST',
      data: { result: validated.result },
    });

    setSubmitLoading(false);
    if (error) {
      setServerError(error);
      return;
    }

    const jobId = data?.job?.externalJobId || validated.result.jobId;
    setSubmittedJobId(jobId);
    addNotification({
      type: 'success',
      title: 'Submitted for review',
      message: data?.duplicate
        ? 'Existing review job returned for this result.'
        : 'Compute result submitted for review. Production has not been mutated.',
    });
    onSubmitted?.(data?.job || null);
  }, [jsonText, syncValidation, addNotification, onSubmitted]);

  const handleApply = useCallback(async () => {
    if (!preview || !previewAllowsApply(preview) || !applyConfirmed) return;

    const validated = syncValidation(jsonText);
    if (!validated.result || validated.errors.length) return;

    setApplyLoading(true);
    setServerError(null);

    let jobId = submittedJobId || preview.jobId;
    if (!submittedJobId) {
      const submitResponse = await authenticatedRequest('/admin/pivot/compute-jobs/manual-submit', {
        method: 'POST',
        data: { result: validated.result },
      });
      if (submitResponse.error) {
        setApplyLoading(false);
        setServerError(submitResponse.error);
        return;
      }
      jobId = submitResponse.data?.job?.externalJobId || preview.jobId;
      setSubmittedJobId(jobId);
    }

    const { data, error } = await authenticatedRequest(
      `/admin/pivot/compute-jobs/${encodeURIComponent(jobId)}/apply`,
      {
        method: 'POST',
        data: {
          idempotencyKey: `apply:${preview.jobId}`,
          preview,
        },
      },
    );

    setApplyLoading(false);
    if (error) {
      setServerError(error);
      return;
    }

    addNotification({
      type: data?.duplicate ? 'info' : 'success',
      title: 'Applied',
      message: data?.duplicate
        ? 'Apply already recorded for this preview.'
        : 'Compute result applied to production.',
    });
    onApplied?.(data?.job || null);
  }, [
    preview,
    applyConfirmed,
    jsonText,
    syncValidation,
    submittedJobId,
    addNotification,
    onApplied,
  ]);

  return (
    <section
      className="linear-section pivot-lab__section pivot-compute-review"
      aria-labelledby="compute-job-review-heading"
    >
      <div className="pivot-lab__section-head">
        <div>
          <h2 id="compute-job-review-heading" className="linear-section__title">
            Manual result review
          </h2>
          <p className="pivot-lab__section-hint">
            Upload a completed worker JSON export, preview proposed changes, submit for review, or
            apply with explicit confirmation. Submission records the artifact; apply mutates production.
          </p>
        </div>
      </div>

      <div className="pivot-compute-review__upload">
        <label className="pivot-compute-review__file-label">
          <span>JSON file</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            aria-label="Upload compute result JSON"
          />
        </label>
        <label className="pivot-compute-review__textarea-label">
          <span>Pasted JSON</span>
          <textarea
            className="pivot-compute-review__textarea"
            value={jsonText}
            onChange={handleTextChange}
            rows={8}
            spellCheck={false}
            placeholder='{"contractVersion":"1","jobId":"job:...","outcome":"completed",...}'
            aria-label="Paste compute result JSON"
          />
        </label>
      </div>

      {clientErrors.length ? (
        <ul className="pivot-compute-review__errors" data-testid="compute-review-client-errors">
          {clientErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}

      {serverError ? (
        <p className="pivot-lab__error pivot-compute-review__server-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="pivot-compute-review__actions">
        <button
          type="button"
          className="linear-btn linear-btn--secondary"
          onClick={handlePreview}
          disabled={!canPreview || previewLoading || submitLoading || applyLoading}
        >
          {previewLoading ? 'Previewing…' : 'Preview changes'}
        </button>
        <button
          type="button"
          className="linear-btn linear-btn--secondary"
          onClick={handleSubmitForReview}
          disabled={!canPreview || previewLoading || submitLoading || applyLoading}
        >
          {submitLoading ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>

      {preview ? (
        <>
          <ComputeResultPreviewPanel preview={preview} parsedResult={parsedResult} />

          <div className="pivot-compute-review__apply-panel" data-testid="compute-review-apply-panel">
            <h3 className="pivot-compute-review__apply-title">Apply to production</h3>
            <p className="pivot-lab__section-hint">
              Apply uses the accepted preview envelope above. It is separate from submission and requires
              an explicit confirmation checkbox.
            </p>

            {previewAllowsApply(preview) ? (
              <>
                <label className="pivot-compute-review__confirm">
                  <input
                    type="checkbox"
                    checked={applyConfirmed}
                    onChange={(event) => setApplyConfirmed(event.target.checked)}
                    disabled={applyLoading}
                  />
                  <span>
                    I reviewed the preview and confirm applying these production mutations for
                    {' '}
                    {preview.jobId}.
                  </span>
                </label>
                <button
                  type="button"
                  className="linear-btn"
                  onClick={handleApply}
                  disabled={!applyConfirmed || applyLoading || submitLoading || previewLoading}
                >
                  {applyLoading ? 'Applying…' : 'Apply preview to production'}
                </button>
              </>
            ) : (
              <p className="pivot-compute-review__blocked" role="status">
                Apply is unavailable until blocking preview issues are resolved.
              </p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

export default PivotComputeJobReview;
