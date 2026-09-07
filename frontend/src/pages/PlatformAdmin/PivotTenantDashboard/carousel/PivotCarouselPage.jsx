/**
 * Carousel — the "sorry u missed it" Instagram deck, per tenant.
 *
 * A light table of repeatable 4:5 frames in the Just Go zine register: the
 * avant-garde end of the design language, spent loudly because a social post
 * is not a surface anyone has to operate.
 *
 * Phase 02 reads and renders decks; it does not edit them. What it proves is
 * the data model — the same templates rendering from a saved document exactly
 * as they rendered from hard-coded demo records. The editor is phase 03, and
 * lands on top of this without the frames changing again.
 *
 * Platform-admin only, reached from the tenant dashboard.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../../../hooks/useFetch';
import { useNotification } from '../../../../NotificationContext';
import PivotTenantPage from '../PivotTenantPage';
import { ZINE_DEMO_DECK } from './zineDemoDeck';
import { resolveDeck } from './zineDeck';
import {
  ZineBack,
  ZineCard,
  ZineCover,
  ZineDispatch,
  ZineNotice,
  ZineReceipt,
  ZineSheet,
} from './zineFrames';
import './PivotCarouselPage.scss';

/**
 * The rendering half of a slide type. The data half is the manifest in
 * backend/constants/zineSlideTypes.js; the two are joined by the type key
 * alone, so adding a template touches one entry in each and nothing else.
 */
const FRAME_COMPONENTS = {
  cover: ZineCover,
  wall: ZineSheet,
  card: ZineCard,
  notice: ZineNotice,
  dispatch: ZineDispatch,
  receipt: ZineReceipt,
  back: ZineBack,
};

const EDITIONS = [
  { key: 'night', label: 'night press' },
  { key: 'paper', label: 'newsprint' },
];

function decksPath(tenantKey) {
  return `/admin/pivot/tenants/${encodeURIComponent(tenantKey)}/carousels`;
}

export default function PivotCarouselPage({ tenantKey, cityDisplayName }) {
  const { addNotification } = useNotification();

  const [decks, setDecks] = useState([]);
  const [deck, setDeck] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [edition, setEdition] = useState('night');

  /** Load the deck list, then open the most recently touched one. */
  const load = useCallback(async () => {
    if (!tenantKey) return;
    setLoading(true);

    const list = await authenticatedRequest(decksPath(tenantKey));
    const rows = list.data?.success ? list.data.data?.decks || [] : [];
    setDecks(rows);

    if (!rows.length) {
      setDeck(null);
      setManifest(null);
      setLoading(false);
      return;
    }

    const full = await authenticatedRequest(`${decksPath(tenantKey)}/${rows[0]._id}`);
    if (full.data?.success) {
      setDeck(full.data.data.deck);
      setManifest(full.data.data.manifest);
      setEdition(full.data.data.deck.edition || 'night');
    }
    setLoading(false);
  }, [tenantKey]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Seed the reference issue. It POSTs the demo deck the frontend already
   * holds, so the round trip is the proof: what comes back from Mongo has to
   * render identically to what went in.
   */
  const seedReference = useCallback(async () => {
    setSeeding(true);
    const result = await authenticatedRequest(decksPath(tenantKey), {
      method: 'POST',
      data: { ...ZINE_DEMO_DECK, title: `${ZINE_DEMO_DECK.title} (reference)` },
    });
    setSeeding(false);

    if (!result.data?.success) {
      addNotification({
        title: 'Could not save the reference issue',
        message: result.data?.message || 'The request failed.',
        type: 'error',
      });
      return;
    }

    const notes = result.data.data.notes || [];
    addNotification({
      title: 'Reference issue saved',
      message: notes.length
        ? `Saved, but ${notes.length} value(s) did not fit their template: ${notes[0]}`
        : 'Saved with nothing trimmed — every slot fit its template.',
      type: notes.length ? 'warning' : 'success',
    });
    load();
  }, [tenantKey, addNotification, load]);

  /** What renders: the saved deck, or the local reference until one is saved. */
  const source = deck || ZINE_DEMO_DECK;
  const resolved = useMemo(
    () => resolveDeck({ ...source, edition }, manifest),
    [source, edition, manifest],
  );

  const unsaved = !deck;

  return (
    <PivotTenantPage
      title="Carousel"
      tenantKey={tenantKey}
      cityDisplayName={cityDisplayName}
      actions={
        <div className="jgz__controls">
          <div className="jgz__switch" role="group" aria-label="Edition">
            {EDITIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={edition === option.key}
                onClick={() => setEdition(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="jgz__note">4:5 · 1080×1350</span>
        </div>
      }
    >
      <div className="jgz">
        <div className="jgz__bar">
          <p className="jgz__standfirst">
            {loading
              ? 'loading decks…'
              : `${source.title} — ${resolved.slides.length} slides. every frame reports on an event that already happened, so the argument for the app is the reader’s own absence rather than a feature list.`}
          </p>

          <div className="jgz__state">
            {unsaved ? (
              <>
                <span className="jgz__flag">not saved</span>
                <button
                  type="button"
                  className="jgz__action"
                  onClick={seedReference}
                  disabled={seeding || loading}
                >
                  {seeding ? 'saving…' : 'save reference issue'}
                </button>
              </>
            ) : (
              <span className="jgz__flag jgz__flag--saved">
                saved · {decks.length} deck{decks.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        <ul className="jgz__sheet">
          {resolved.slides.map((slide, index) => {
            const Frame = FRAME_COMPONENTS[slide.type];
            if (!Frame) return null;
            return (
              <li className="jgz__slot" key={slide.id}>
                <div className={`jgz-frame jgz-frame--${edition}`}>
                  <Frame {...slide.props} />
                </div>
                <p className="jgz__slot-caption">
                  <b>
                    {String(index + 1).padStart(2, '0')} · {slide.type}
                  </b>
                  <span>
                    {slide.props.events.length
                      ? `${slide.props.events.length} event${slide.props.events.length === 1 ? '' : 's'}`
                      : 'derived'}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </PivotTenantPage>
  );
}
