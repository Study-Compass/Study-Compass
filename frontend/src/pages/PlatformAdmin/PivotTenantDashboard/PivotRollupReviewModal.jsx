/**
 * Review a showtime roll-up before it happens.
 *
 * The manual path is permissive on purpose: two unrelated listings can be
 * rolled together, because a person looking at them may know something the
 * similarity score does not. What that permissiveness buys has to be paid for
 * here — the outcome is shown before it is applied, the survivor is chosen
 * rather than inferred, and anything that looks wrong is said out loud.
 *
 * Warnings do not block, but they have to be acknowledged. Notices are things
 * worth knowing and nothing to argue with; making those blocking would only
 * teach people to click through the ones that matter.
 */

import React, { useEffect, useState } from 'react';
import Popup from '../../../components/Popup/Popup';
import './PivotRollupReviewModal.scss';

function when(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PivotRollupReviewModal({
  isOpen,
  plan,
  loading,
  applying,
  error,
  onPickSurvivor,
  onApply,
  onClose,
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  const warnings = (plan?.warnings || []).filter((entry) => entry.level === 'warning');
  const notices = (plan?.warnings || []).filter((entry) => entry.level !== 'warning');

  // A new plan is a new decision: changing the survivor can raise or clear
  // warnings, so a tick made against the old one must not carry over.
  useEffect(() => {
    setAcknowledged(false);
  }, [plan?.survivor?._id, warnings.length]);

  if (!isOpen) return null;

  const blocked = warnings.length > 0 && !acknowledged;

  return (
    <Popup isOpen={isOpen} onClose={onClose} customClassName="pivot-rollup" disableOutsideClick>
      <div className="pivot-rollup__body">
        <header className="pivot-rollup__head">
          <h2>Roll up into showtimes</h2>
          <p>
            {plan
              ? `${plan.absorbed.length + 1} listings become one with ${plan.result.showtimes.length} showtime${plan.result.showtimes.length === 1 ? '' : 's'}.`
              : 'Working out what this would do…'}
          </p>
        </header>

        {error ? <p className="pivot-rollup__error">{error}</p> : null}

        {loading || !plan ? (
          <p className="pivot-rollup__empty">Loading…</p>
        ) : (
          <>
            <section className="pivot-rollup__section">
              <h3>Which listing survives</h3>
              <p className="pivot-rollup__hint">
                Its name and identity are kept. The others are deleted once their
                showtimes and any saved interest have moved across.
              </p>
              <ul className="pivot-rollup__candidates">
                {plan.candidates.map((candidate) => (
                  <li key={candidate._id}>
                    <label>
                      <input
                        type="radio"
                        name="rollup-survivor"
                        checked={candidate._id === plan.survivor._id}
                        onChange={() => onPickSurvivor(candidate._id)}
                        disabled={applying}
                      />
                      <span className="pivot-rollup__candidate">
                        <b>{candidate.name}</b>
                        <span>
                          {when(candidate.start_time)}
                          {candidate.location ? ` · ${candidate.location}` : ''}
                          {candidate.ingestStatus ? ` · ${candidate.ingestStatus}` : ''}
                          {candidate.showtimes > 1 ? ` · ${candidate.showtimes} showtimes` : ''}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <section className="pivot-rollup__section">
              <h3>What you get</h3>
              <dl className="pivot-rollup__result">
                <div><dt>Name</dt><dd>{plan.result.name}</dd></div>
                <div><dt>Host</dt><dd>{plan.result.host || '—'}</dd></div>
                <div><dt>Venue</dt><dd>{plan.result.location || '—'}</dd></div>
                <div><dt>Week</dt><dd>{plan.result.batchWeek || '—'}</dd></div>
                <div>
                  <dt>Showtimes</dt>
                  <dd>
                    <ul className="pivot-rollup__slots">
                      {plan.result.showtimes.map((slot) => (
                        <li key={slot.id}>{when(slot.start_time)}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                {plan.result.tags?.length ? (
                  <div><dt>Tags</dt><dd>{plan.result.tags.join(', ')}</dd></div>
                ) : null}
              </dl>
            </section>

            <section className="pivot-rollup__section">
              <h3>What is removed</h3>
              <ul className="pivot-rollup__removed">
                {plan.absorbed.map((event) => (
                  <li key={event._id}>
                    <b>{event.name}</b>
                    <span>{when(event.start_time)}</span>
                  </li>
                ))}
              </ul>
              <p className="pivot-rollup__hint">
                {plan.intents?.toMigrate
                  ? `${plan.intents.toMigrate} saved interest record${plan.intents.toMigrate === 1 ? '' : 's'} will move to the surviving listing.`
                  : 'No saved interest to move.'}
                {' '}This cannot be undone.
              </p>
            </section>

            {notices.length ? (
              <ul className="pivot-rollup__notices">
                {notices.map((entry) => <li key={entry.code}>{entry.message}</li>)}
              </ul>
            ) : null}

            {warnings.length ? (
              <section className="pivot-rollup__warnings">
                <h3>These do not look like the same listing</h3>
                <ul>
                  {warnings.map((entry) => <li key={entry.code}>{entry.message}</li>)}
                </ul>
                <label className="pivot-rollup__ack">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                    disabled={applying}
                  />
                  <span>Roll them up anyway — I have checked these are the same event.</span>
                </label>
              </section>
            ) : null}
          </>
        )}

        <footer className="pivot-rollup__actions">
          <button type="button" className="linear-btn linear-btn--secondary" onClick={onClose} disabled={applying}>
            Cancel
          </button>
          <button
            type="button"
            className="linear-btn linear-btn--primary"
            onClick={() => onApply(warnings.map((entry) => entry.code))}
            disabled={!plan || loading || applying || blocked}
            title={blocked ? 'Acknowledge the warnings first' : undefined}
          >
            {applying ? 'Rolling up…' : `Roll up ${plan ? plan.absorbed.length + 1 : ''}`.trim()}
          </button>
        </footer>
      </div>
    </Popup>
  );
}
