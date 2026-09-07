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
import { resolveSlide, slideGaps } from './zineDeck';
import PivotCarouselVoicePanel from './PivotCarouselVoicePanel';
import PivotCarouselEventPicker from './PivotCarouselEventPicker';

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
        <span className={`jgz-frame jgz-frame--${deck.edition}`} aria-hidden="true">
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
}) {
  const [selected, setSelected] = useState(0);
  const [adding, setAdding] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
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
      editing: true,
      slide: { ...slide, issue: deck.issue },
      onChange: handleFieldChange,
    }),
    [slide, deck.issue, handleFieldChange],
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
            <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
              + add slide
            </button>
            {adding ? (
              <ul className="jgz-strip__menu">
                {manifest.addable.map((type) => (
                  <li key={type}>
                    <button type="button" onClick={() => addSlide(type)}>
                      <b>{typeLabel(manifest, type)}</b>
                      <span>{manifest.types[type].blurb}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="jgz-editor__canvas">
          <div className={`jgz-frame jgz-frame--${deck.edition}`}>
            <ZineEditProvider value={editContext}>
              {Frame ? <Frame {...resolveSlide(deck, slide, index, manifest, cityVoice).props} /> : null}
            </ZineEditProvider>
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
