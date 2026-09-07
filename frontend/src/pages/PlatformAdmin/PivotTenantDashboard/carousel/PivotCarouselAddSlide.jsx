/**
 * Pick a template by looking at it.
 *
 * A list of names asks you to remember what "the notice" is; a wall of rendered
 * frames does not. Each preview is the real component in the deck's current
 * edition, so what you choose is what you get — including whether it reads as
 * night press or newsprint, which changes the decision.
 *
 * Static copy in a preview is the city's real house voice, resolved through the
 * same layers a slide uses. The dynamic copy is plainly placeholder: a preview
 * carrying convincing listing data would be read as real.
 */

import React, { useMemo } from 'react';
import PivotCarouselPopup from './PivotCarouselPopup';
import { resolveSlide, sampleSlideFor } from './zineDeck';

export default function PivotCarouselAddSlide({
  open,
  manifest,
  frames,
  edition,
  issue,
  cityVoice,
  onClose,
  onAdd,
}) {
  const previews = useMemo(() => {
    if (!manifest) return [];
    return manifest.addable
      .map((type) => {
        const slide = sampleSlideFor(type, manifest);
        if (!slide) return null;
        const deck = { issue, edition, slides: [slide], voice: { entries: {} } };
        return {
          type,
          spec: manifest.types[type],
          resolved: resolveSlide(deck, slide, 0, manifest, cityVoice),
        };
      })
      .filter(Boolean);
  }, [manifest, issue, edition, cityVoice]);

  if (!open) return null;

  return (
    <PivotCarouselPopup open={open} onClose={onClose} className="jgz-addpopup">
      <div className="jgz-add">
        <header className="jgz-add__head">
          <h2>Add a slide</h2>
          <p>Shown in {edition === 'paper' ? 'newsprint' : 'night press'}, as it will print.</p>
        </header>

        <ul className="jgz-add__grid">
          {previews.map(({ type, spec, resolved }) => {
            const Frame = frames[type];
            if (!Frame) return null;
            return (
              <li key={type}>
                <button type="button" onClick={() => { onAdd(type); onClose(); }}>
                  <span className={`jgz-frame jgz-frame--${edition}`} aria-hidden="true">
                    <Frame {...resolved.props} />
                  </span>
                  <span className="jgz-add__caption">
                    <b>{spec.label}</b>
                    <span>{spec.blurb}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </PivotCarouselPopup>
  );
}
