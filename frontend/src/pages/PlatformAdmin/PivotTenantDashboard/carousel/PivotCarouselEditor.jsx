/**
 * The carousel editor.
 *
 * Slides on the left, the selected one at working size on the right, and every
 * control derived from the manifest the server sent with the deck. Nothing here
 * names a slide type: the add menu, the slot caps, the event slot counts and
 * the completeness check all read the manifest, which is what makes a new
 * template an entry in that file plus a component in zineFrames.jsx.
 *
 * Text is edited on the slide itself rather than in a side panel, so what you
 * type is laid out in the geometry it will print in.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ZineEditProvider, writePath } from './zineField';
import { frameClass, resolveSlide, slideGaps } from './zineDeck';
import PivotCarouselVoicePanel from './PivotCarouselVoicePanel';
import PivotCarouselEventPicker from './PivotCarouselEventPicker';
import PivotCarouselAddSlide from './PivotCarouselAddSlide';

/** Fixed types cannot be added, removed or moved — they open and close the deck. */
function isFixed(manifest, type) {
  return Boolean(manifest?.types?.[type]?.fixed);
}

function typeLabel(manifest, type) {
  return manifest?.types?.[type]?.label || type;
}

function SlideThumb({ deck, slide, index, manifest, cityVoice, frames, selected, onSelect }) {
  const resolved = useMemo(
    () => resolveSlide(deck, slide, index, manifest, cityVoice),
    [deck, slide, index, manifest, cityVoice],
  );
  const Frame = frames[slide.type];
  const gaps = slideGaps(slide, manifest);

  return (
    <li className="jgz-strip__item">
      <button
        type="button"
        className={`jgz-strip__button${selected ? ' is-selected' : ''}`}
        aria-current={selected}
        onClick={() => onSelect(index)}
      >
        <span className={frameClass(deck)} aria-hidden="true">
          {Frame ? <Frame {...resolved.props} /> : null}
        </span>
        <span className="jgz-strip__caption">
          <b>{String(index + 1).padStart(2, '0')}</b>
          <span>{typeLabel(manifest, slide.type)}</span>
          {gaps.length ? <em className="jgz-strip__gap">{gaps.length}</em> : null}
        </span>
      </button>
    </li>
  );
}

export default function PivotCarouselEditor({
  deck,
  manifest,
  cityVoice,
  frames,
  dirty,
  saving,
  tenantKey,
  cityDisplayName,
  onDeckChange,
  onSave,
  onSlotImage,
  onVoiceSaved,
  onExport,
}) {
  const [selected, setSelected] = useState(0);
  const [adding, setAdding] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  /*
   * Off by default. The editing affordance tints every slot, so a slide under
   * it is not the slide — and the first thing this screen should show is the
   * truth about what will print.
   */
  const [editing, setEditing] = useState(false);
  const [exportLine, setExportLine] = useState(null);
  const [pickingSlot, setPickingSlot] = useState(null);

  const index = Math.min(selected, Math.max(deck.slides.length - 1, 0));
  const slide = deck.slides[index];

  /**
   * A slot write lands on the deck, not on a copy of it. Paths under `issue.`
   * belong to the whole issue rather than to this slide, which is why the read
   * surface below merges the two and this routes them back apart.
   */
  const handleFieldChange = useCallback(
    (path, value) => {
      onDeckChange((current) => {
        if (path.startsWith('issue.')) {
          return writePath(current, path, value);
        }
        const slides = [...current.slides];
        slides[index] = writePath(slides[index], path, value);
        return { ...current, slides };
      });
    },
    [onDeckChange, index],
  );

  const move = useCallback(
    (from, to) => {
      onDeckChange((current) => {
        const slides = [...current.slides];
        if (to < 1 || to > slides.length - 2) return current;
        const [moved] = slides.splice(from, 1);
        slides.splice(to, 0, moved);
        return { ...current, slides };
      });
      setSelected(to);
    },
    [onDeckChange],
  );

  const removeSlide = useCallback(
    (at) => {
      onDeckChange((current) => ({
        ...current,
        slides: current.slides.filter((_, i) => i !== at),
      }));
      setSelected((prev) => Math.max(0, prev - (at <= prev ? 1 : 0)));
    },
    [onDeckChange],
  );

  const addSlide = useCallback(
    (type) => {
      setAdding(false);
      const spec = manifest.types[type];
      const events = spec.events === 'derived'
        ? []
        : Array.from({ length: spec.events.exactly ?? spec.events.min ?? 0 }, () => ({
          eventId: null, label: null, snapshot: null, imageOverride: null, values: {},
        }));
      const options = {};
      for (const option of spec.options || []) {
        if (option.default !== undefined) options[option.key] = option.default;
      }

      onDeckChange((current) => {
        const slides = [...current.slides];
        // New slides land after the selection, never outside the fixed pair.
        const at = Math.min(Math.max(index + 1, 1), slides.length - 1);
        slides.splice(at, 0, { type, values: {}, options, events });
        setSelected(at);
        return { ...current, slides };
      });
    },
    [manifest, onDeckChange, index],
  );

  /** Per-slide options, whatever the manifest declares for this type. */
  const setOption = useCallback(
    (key, value) => {
      onDeckChange((current) => {
        const slides = [...current.slides];
        slides[index] = {
          ...slides[index],
          options: { ...(slides[index].options || {}), [key]: value },
        };
        return { ...current, slides };
      });
    },
    [onDeckChange, index],
  );

  /** Drop a picked event into a slot, keeping the slots either side intact. */
  const fillSlot = useCallback(
    (slotIndex, entry) => {
      onDeckChange((current) => {
        const slides = [...current.slides];
        const events = [...(slides[index].events || [])];
        events[slotIndex] = entry;
        slides[index] = { ...slides[index], events };
        return { ...current, slides };
      });
    },
    [onDeckChange, index],
  );

  const clearSlot = useCallback(
    (slotIndex) => {
      fillSlot(slotIndex, {
        eventId: null, label: null, snapshot: null, imageOverride: null, values: {},
      });
    },
    [fillSlot],
  );

  /** Only where the type allows more than its minimum — the wall's fourth. */
  const addSlot = useCallback(() => {
    onDeckChange((current) => {
      const slides = [...current.slides];
      const events = [...(slides[index].events || []), {
        eventId: null, label: null, snapshot: null, imageOverride: null, values: {},
      }];
      slides[index] = { ...slides[index], events };
      return { ...current, slides };
    });
  }, [onDeckChange, index]);

  const dropSlot = useCallback(
    (slotIndex) => {
      onDeckChange((current) => {
        const slides = [...current.slides];
        const events = (slides[index].events || []).filter((_, i) => i !== slotIndex);
        slides[index] = { ...slides[index], events };
        return { ...current, slides };
      });
    },
    [onDeckChange, index],
  );

  const editContext = useMemo(
    () => ({
      editing,
      slide: { ...slide, issue: deck.issue },
      onChange: handleFieldChange,
    }),
    [editing, slide, deck.issue, handleFieldChange],
  );

  if (!slide) return null;

  const Frame = frames[slide.type];
  const gaps = slideGaps(slide, manifest);
  const fixed = isFixed(manifest, slide.type);
  const spec = manifest.types[slide.type];

  // The manifest decides how many slots this type takes and whether the count
  // can vary, so the slot rail never has to know which template it is showing.
  const derived = spec.events === 'derived';
  const slotMin = derived ? 0 : (spec.events.exactly ?? spec.events.min ?? 0);
  const slotMax = derived ? 0 : (spec.events.exactly ?? spec.events.max ?? 0);
  const slots = slide.events || [];
  const acceptsUpload = String(spec.photo || '').includes('upload');

  return (
    <div className="jgz-editor">
      <div className="jgz-editor__bar">
        <p className="jgz-editor__title">{deck.title}</p>
        <div className="jgz-editor__bar-actions">
          <button
            type="button"
            className={`jgz__action${editing ? ' is-on' : ''}`}
            aria-pressed={editing}
            onClick={() => setEditing((on) => !on)}
          >
            {editing ? 'editing' : 'edit slide'}
          </button>
          <button
            type="button"
            className="jgz__action"
            onClick={() => setVoiceOpen(true)}
          >
            static copy…
          </button>
          <span className={`jgz-flag${dirty ? '' : ' jgz-flag--saved'}`}>
            {dirty ? 'unsaved changes' : 'saved'}
          </span>
          <button
            type="button"
            className="jgz__action"
            onClick={onSave}
            disabled={!dirty || saving}
          >
            {saving ? 'saving…' : 'save deck'}
          </button>
          <button
            type="button"
            className="jgz__action"
            onClick={async () => setExportLine(await onExport())}
            disabled={dirty}
            title={dirty ? 'Save first — the export renders what is stored' : undefined}
          >
            export…
          </button>
        </div>
      </div>

      <div className="jgz-editor__body">
        <div className="jgz-editor__strip">
          <ul className="jgz-strip">
            {deck.slides.map((row, i) => (
              <SlideThumb
                key={row._id || `slide-${i}`}
                deck={deck}
                slide={row}
                index={i}
                manifest={manifest}
                cityVoice={cityVoice}
                frames={frames}
                selected={i === index}
                onSelect={setSelected}
              />
            ))}
          </ul>

          <div className="jgz-strip__add">
            <button type="button" onClick={() => setAdding(true)}>
              + add slide
            </button>
          </div>
        </div>

        <div className="jgz-editor__canvas">
          <div className="jgz-editor__stage">
            <div className={frameClass(deck)}>
              <ZineEditProvider value={editContext}>
                {Frame
                  ? <Frame {...resolveSlide(deck, slide, index, manifest, cityVoice).props} />
                  : null}
              </ZineEditProvider>
            </div>
          </div>

          <div className="jgz-editor__meta">
            <p className="jgz-editor__slidename">
              {String(index + 1).padStart(2, '0')} · {typeLabel(manifest, slide.type)}
              <span>{spec.blurb}</span>
            </p>

            {gaps.length ? (
              <p className="jgz-editor__gaps">
                still empty: {gaps.join(', ')}
              </p>
            ) : (
              <p className="jgz-editor__gaps jgz-editor__gaps--ok">every slot filled</p>
            )}

            {(spec.options || []).length ? (
              <div className="jgz-editor__options">
                {spec.options.map((option) => {
                  const current = slide.options?.[option.key] ?? option.default;
                  const label = option.label || option.key;

                  if (option.kind === 'boolean') {
                    return (
                      <label key={option.key} className="jgz-editor__option">
                        <input
                          type="checkbox"
                          checked={current !== false}
                          onChange={(event) => setOption(option.key, event.target.checked)}
                        />
                        <span>{label}</span>
                      </label>
                    );
                  }

                  return (
                    <label key={option.key} className="jgz-editor__option">
                      <span>{label}</span>
                      <select
                        value={String(current)}
                        onChange={(event) => {
                          // Options are declared with their real types, so a
                          // select's string has to be put back to one.
                          const picked = option.values.find(
                            (value) => String(value) === event.target.value,
                          );
                          setOption(option.key, picked);
                        }}
                      >
                        {option.values.map((value) => (
                          <option key={String(value)} value={String(value)}>
                            {String(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            ) : null}

            {derived ? (
              <p className="jgz-editor__derived">
                counts the whole issue — no events of its own
              </p>
            ) : (
              <div className="jgz-editor__slots">
                <p className="jgz-editor__slotshead">
                  events
                  <span>
                    {slots.filter((e) => e.snapshot?.name).length} of {slotMax}
                  </span>
                </p>

                <ul>
                  {slots.map((entry, slotIndex) => (
                    <li key={`slot-${slotIndex}`} className="jgz-editor__slot">
                      <span className="jgz-editor__slotname">
                        {entry.snapshot?.name || <em>empty slot</em>}
                      </span>
                      <span className="jgz-editor__slotops">
                        <button type="button" onClick={() => setPickingSlot(slotIndex)}>
                          {entry.snapshot?.name ? 'replace' : 'pick'}
                        </button>
                        {acceptsUpload && entry.snapshot ? (
                          <label className="jgz-editor__upload">
                            {entry.imageOverride?.url ? 'photo ✓' : 'photo'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = '';
                                if (file) onSlotImage(slide._id, slotIndex, file);
                              }}
                            />
                          </label>
                        ) : null}
                        {entry.snapshot?.name ? (
                          <button type="button" onClick={() => clearSlot(slotIndex)}>clear</button>
                        ) : null}
                        {slots.length > slotMin ? (
                          <button
                            type="button"
                            className="jgz-editor__danger"
                            onClick={() => dropSlot(slotIndex)}
                          >
                            −
                          </button>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>

                {slots.length < slotMax ? (
                  <button type="button" className="jgz-editor__slotadd" onClick={addSlot}>
                    + add event slot
                  </button>
                ) : null}
              </div>
            )}

            <div className="jgz-editor__slideops">
              <button type="button" onClick={() => move(index, index - 1)} disabled={fixed || index <= 1}>
                move up
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                disabled={fixed || index >= deck.slides.length - 2}
              >
                move down
              </button>
              <button
                type="button"
                className="jgz-editor__danger"
                onClick={() => removeSlide(index)}
                disabled={fixed}
              >
                remove
              </button>
            </div>

            {fixed ? (
              <p className="jgz-editor__fixed">
                every carousel opens and closes the same way, so this one stays put
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {exportLine ? (
        <div className="jgz-export-line" role="status">
          <p>
            Run this in the repo root. The token is good for ten minutes and for
            this deck only.
          </p>
          <code>{exportLine}</code>
          <div className="jgz-export-line__ops">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(exportLine)}
            >
              copy
            </button>
            <button type="button" onClick={() => setExportLine(null)}>dismiss</button>
          </div>
        </div>
      ) : null}

      <PivotCarouselAddSlide
        open={adding}
        manifest={manifest}
        frames={frames}
        edition={deck.edition}
        inkPlate={deck.inkPlate}
        issue={deck.issue}
        cityVoice={cityVoice}
        onClose={() => setAdding(false)}
        onAdd={addSlide}
      />

      <PivotCarouselEventPicker
        tenantKey={tenantKey}
        open={pickingSlot !== null}
        slotLabel={`${typeLabel(manifest, slide.type)} · slot ${(pickingSlot ?? 0) + 1}`}
        onClose={() => setPickingSlot(null)}
        onPick={(entry) => fillSlot(pickingSlot, entry)}
      />

      <PivotCarouselVoicePanel
        tenantKey={tenantKey}
        cityDisplayName={cityDisplayName}
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSaved={onVoiceSaved}
      />
    </div>
  );
}
