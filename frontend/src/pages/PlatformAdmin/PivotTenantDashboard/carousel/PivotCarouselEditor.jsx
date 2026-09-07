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

/** Fixed types cannot be added, removed or moved — they open and close the deck. */
function isFixed(manifest, type) {
  return Boolean(manifest?.types?.[type]?.fixed);
}

function typeLabel(manifest, type) {
  return manifest?.types?.[type]?.label || type;
}

function SlideThumb({ deck, slide, index, manifest, frames, selected, onSelect }) {
  const resolved = useMemo(
    () => resolveSlide(deck, slide, index, manifest),
    [deck, slide, index, manifest],
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
  frames,
  dirty,
  saving,
  onDeckChange,
  onSave,
}) {
  const [selected, setSelected] = useState(0);
  const [adding, setAdding] = useState(false);

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

  return (
    <div className="jgz-editor">
      <div className="jgz-editor__bar">
        <p className="jgz-editor__title">{deck.title}</p>
        <div className="jgz-editor__bar-actions">
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
              {Frame ? <Frame {...resolveSlide(deck, slide, index, manifest).props} /> : null}
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
    </div>
  );
}
