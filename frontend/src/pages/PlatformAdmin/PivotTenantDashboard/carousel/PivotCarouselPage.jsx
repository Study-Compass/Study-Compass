/**
 * Carousel — the "sorry u missed it" Instagram deck, per tenant.
 *
 * A light table of repeatable 4:5 frames in the Just Go zine register: the
 * avant-garde end of the design language, spent loudly because a social post
 * is not a surface anyone has to operate.
 *
 * This page owns the deck: loading it, holding the working draft, and saving.
 * PivotCarouselEditor owns the editing, and the frames own the rendering. A
 * slot write goes draft → PATCH → reload, so what you see after a save is what
 * the server actually stored rather than what the browser hoped it stored.
 *
 * Platform-admin only, reached from the tenant dashboard.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authenticatedRequest } from '../../../../hooks/useFetch';
import { useNotification } from '../../../../NotificationContext';
import PivotTenantPage from '../PivotTenantPage';
import PivotCarouselEditor from './PivotCarouselEditor';
import useCarouselExport from './useCarouselExport';
import { ZINE_DEMO_DECK } from './zineDemoDeck';
import { frameClass, resolveDeck } from './zineDeck';
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

function EditionTools({
  edition,
  onEdition,
  showIssueNumber,
  onShowIssueNumber,
  inkPlate,
  onInkPlate,
}) {
  return (
    <div className="jgz__controls">
      <div className="jgz__switch" role="group" aria-label="Edition">
        {EDITIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={edition === option.key}
            onClick={() => onEdition(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="jgz__ink">
        <input
          type="checkbox"
          checked={showIssueNumber}
          onChange={(event) => onShowIssueNumber(event.target.checked)}
        />
        <span>issue no.</span>
      </label>
      {/* Only newsprint has an ink plate, so the control appears with it. */}
      {edition === 'paper' ? (
        <label className="jgz__ink">
          <input
            type="checkbox"
            checked={inkPlate}
            onChange={(event) => onInkPlate(event.target.checked)}
          />
          <span>ink plate</span>
        </label>
      ) : null}
    </div>
  );
}

export default function PivotCarouselPage({ tenantKey, cityDisplayName }) {
  const { addNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const requestedDeckId = searchParams.get('deckId');

  const [deck, setDeck] = useState(null);
  const [draft, setDraft] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [cityVoice, setCityVoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edition, setEdition] = useState('night');
  const [inkPlate, setInkPlate] = useState(true);
  const [showIssueNumber, setShowIssueNumber] = useState(true);
  const [focused, setFocused] = useState(false);

  const toggleFocus = useCallback(() => setFocused((on) => !on), []);

  const editionTools = (
    <EditionTools
      edition={edition}
      onEdition={setEdition}
      showIssueNumber={showIssueNumber}
      onShowIssueNumber={setShowIssueNumber}
      inkPlate={inkPlate}
      onInkPlate={setInkPlate}
    />
  );

  /** Load the deck list, then open the most recently touched one. */
  const load = useCallback(async () => {
    if (!tenantKey) return;
    setLoading(true);

    const list = await authenticatedRequest(decksPath(tenantKey));
    const rows = list.data?.success ? list.data.data?.decks || [] : [];

    if (!rows.length) {
      setDeck(null);
      setDraft(null);
      setManifest(null);
      setCityVoice(null);
      setFocused(false);
      setLoading(false);
      return;
    }

    const match = requestedDeckId
      ? rows.find((row) => String(row._id) === requestedDeckId)
      : null;
    const target = match || rows[0];
    const full = await authenticatedRequest(`${decksPath(tenantKey)}/${target._id}`);
    if (full.data?.success) {
      setDeck(full.data.data.deck);
      setDraft(full.data.data.deck);
      setManifest(full.data.data.manifest);
      setCityVoice(full.data.data.cityVoice || {});
      setEdition(full.data.data.deck.edition || 'night');
      setInkPlate(full.data.data.deck.inkPlate !== false);
      setShowIssueNumber(full.data.data.deck.showIssueNumber !== false);
    }
    setLoading(false);
  }, [tenantKey, requestedDeckId]);

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

  const saveDeck = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    const result = await authenticatedRequest(`${decksPath(tenantKey)}/${draft._id}`, {
      method: 'PATCH',
      data: {
        title: draft.title,
        edition,
        inkPlate,
        showIssueNumber,
        issue: draft.issue,
        voice: draft.voice,
        slides: draft.slides,
      },
    });
    setSaving(false);

    if (!result.data?.success) {
      addNotification({
        title: 'Could not save the deck',
        message: result.data?.message || 'The request failed.',
        type: 'error',
      });
      return;
    }

    // Take the server's copy back, not the draft: a value the manifest trimmed
    // has to show trimmed, or the next save silently reverts it.
    const saved = result.data.data.deck;
    const notes = result.data.data.notes || [];
    setDeck(saved);
    setDraft(saved);
    addNotification({
      title: 'Deck saved',
      message: notes.length ? `${notes.length} value(s) trimmed to fit: ${notes[0]}` : 'All slots fit.',
      type: notes.length ? 'warning' : 'success',
    });
    // inkPlate is in the payload, so it has to be in the deps: without it this
    // callback closes over the value from the render before the toggle and
    // saves the setting you just changed away from.
  }, [draft, edition, inkPlate, showIssueNumber, tenantKey, addNotification]);

  /**
   * An image upload writes straight through to the server rather than into the
   * draft: the file cannot live in a JSON deck, and the reply carries the saved
   * deck back with the override already on it.
   */
  const setSlotImage = useCallback(
    async (slideId, slotIndex, file) => {
      if (!draft?._id) return;
      const form = new FormData();
      form.append('image', file);
      form.append('slotIndex', String(slotIndex));

      const result = await authenticatedRequest(
        `${decksPath(tenantKey)}/${draft._id}/slides/${slideId}/image`,
        { method: 'POST', data: form },
      );

      if (!result.data?.success) {
        addNotification({
          title: 'Could not set the photo',
          message: result.data?.message || 'The upload failed.',
          type: 'error',
        });
        return;
      }
      const saved = result.data.data.deck;
      setDeck(saved);
      setDraft(saved);
      addNotification({ title: 'Photo set', message: 'The slide uses it now.', type: 'success' });
    },
    [draft, tenantKey, addNotification],
  );

  const dirty = useMemo(
    () => Boolean(
      draft && deck && (
        JSON.stringify(draft) !== JSON.stringify(deck)
        || edition !== deck.edition
        || inkPlate !== (deck.inkPlate !== false)
        || showIssueNumber !== (deck.showIssueNumber !== false)
      ),
    ),
    [draft, deck, edition, inkPlate, showIssueNumber],
  );

  const exportState = useCarouselExport({ tenantKey, deck, dirty });

  const createDeck = useCallback(async () => {
    setSeeding(true);
    const result = await authenticatedRequest(decksPath(tenantKey), {
      method: 'POST',
      data: { title: `issue — ${cityDisplayName || tenantKey}`, issue: { city: cityDisplayName || tenantKey } },
    });
    setSeeding(false);
    if (result.data?.success) {
      load();
    } else {
      addNotification({
        title: 'Could not create the deck',
        message: result.data?.message || 'The request failed.',
        type: 'error',
      });
    }
  }, [tenantKey, cityDisplayName, addNotification, load]);

  /** Renders the reference issue read-only until a deck exists to edit. */
  const preview = useMemo(
    () => resolveDeck({ ...ZINE_DEMO_DECK, edition, inkPlate, showIssueNumber }, manifest, cityVoice),
    [edition, inkPlate, showIssueNumber, manifest, cityVoice],
  );

  return (
    <PivotTenantPage
      className={`pivot-carousel-page${focused ? ' is-carousel-focused' : ''}`}
      title="Carousel"
      tenantKey={tenantKey}
      cityDisplayName={cityDisplayName}
      actions={draft && manifest ? null : (
        <>
          {editionTools}
          <span className="jgz__note">4:5 · 1080×1350</span>
        </>
      )}
    >
      <div className="jgz">
        {draft && manifest ? (
          <PivotCarouselEditor
            deck={{ ...draft, edition, inkPlate, showIssueNumber }}
            manifest={manifest}
            cityVoice={cityVoice}
            frames={FRAME_COMPONENTS}
            dirty={dirty}
            saving={saving}
            tenantKey={tenantKey}
            cityDisplayName={cityDisplayName}
            onDeckChange={setDraft}
            onSave={saveDeck}
            onSlotImage={setSlotImage}
            onVoiceSaved={load}
            exportState={exportState}
            tools={editionTools}
            focused={focused}
            onToggleFocus={toggleFocus}
          />
        ) : (
          <>
            <div className="jgz__bar">
              <p className="jgz__standfirst">
                {loading
                  ? 'loading decks…'
                  : 'no deck for this city yet. start an empty one, or save the reference issue to see the templates fully dressed and edit from there.'}
              </p>

              <div className="jgz__state">
                <span className="jgz__flag">nothing saved</span>
                <button
                  type="button"
                  className="jgz__action"
                  onClick={createDeck}
                  disabled={seeding || loading}
                >
                  new deck
                </button>
                <button
                  type="button"
                  className="jgz__action"
                  onClick={seedReference}
                  disabled={seeding || loading}
                >
                  {seeding ? 'saving…' : 'save reference issue'}
                </button>
              </div>
            </div>

            <ul className="jgz__sheet">
              {preview.slides.map((slide, index) => {
                const Frame = FRAME_COMPONENTS[slide.type];
                if (!Frame) return null;
                return (
                  <li className="jgz__slot" key={slide.id}>
                    <div className={frameClass({ edition, inkPlate })}>
                      <Frame {...slide.props} />
                    </div>
                    <p className="jgz__slot-caption">
                      <b>{String(index + 1).padStart(2, '0')} · {slide.type}</b>
                      <span>reference</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </PivotTenantPage>
  );
}
