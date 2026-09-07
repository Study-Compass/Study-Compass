/**
 * Render every frame, read-only and editing, against the reference deck.
 *
 * These templates are only ever judged by eye, which means a rendering fault
 * reaches a person before it reaches a test. This is the cheap floor: if a
 * frame throws, or React refuses a child, or a slot goes missing, it fails
 * here instead of in the admin panel.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ZINE_DEMO_DECK } from './zineDemoDeck';
import { resolveSlide } from './zineDeck';
import { ZineEditProvider } from './zineField';
import {
  ZineBack,
  ZineCard,
  ZineCover,
  ZineDispatch,
  ZineNotice,
  ZineReceipt,
  ZineSheet,
} from './zineFrames';

const FRAMES = {
  cover: ZineCover,
  wall: ZineSheet,
  card: ZineCard,
  notice: ZineNotice,
  dispatch: ZineDispatch,
  receipt: ZineReceipt,
  back: ZineBack,
};

/** React logs invalid children through console.error rather than throwing. */
function withStrictConsole(fn) {
  const original = console.error;
  const seen = [];
  console.error = (...args) => seen.push(args.join(' '));
  try {
    fn();
  } finally {
    console.error = original;
  }
  return seen;
}

const slides = ZINE_DEMO_DECK.slides.map((slide, i) => ({
  slide,
  index: i,
  resolved: resolveSlide(ZINE_DEMO_DECK, slide, i, null),
}));

describe('every frame renders read-only', () => {
  test.each(slides.map((s, i) => [`${i} ${s.slide.type}`, s]))(
    'slide %s renders without a React complaint',
    (_name, { resolved }) => {
      const Frame = FRAMES[resolved.type];
      const complaints = withStrictConsole(() => {
        render(<Frame {...resolved.props} />);
      });
      expect(complaints).toEqual([]);
    },
  );

  test('the deck covers every frame in the registry', () => {
    const used = new Set(slides.map((s) => s.slide.type));
    expect([...Object.keys(FRAMES)].filter((t) => !used.has(t))).toEqual([]);
  });
});

describe('every frame renders in the editor', () => {
  test.each(slides.map((s, i) => [`${i} ${s.slide.type}`, s]))(
    'slide %s renders editable without a React complaint',
    (_name, { slide, resolved }) => {
      const ctx = {
        editing: true,
        slide: { ...slide, issue: ZINE_DEMO_DECK.issue },
        onChange: () => {},
      };
      const Frame = FRAMES[resolved.type];
      const complaints = withStrictConsole(() => {
        render(
          <ZineEditProvider value={ctx}>
            <Frame {...resolved.props} />
          </ZineEditProvider>,
        );
      });
      expect(complaints).toEqual([]);
    },
  );
});

describe('slot bindings', () => {
  test('the dispatch exposes its run of show as editable rows', () => {
    const entry = slides.find((s) => s.slide.type === 'dispatch');
    const ctx = {
      editing: true,
      slide: { ...entry.slide, issue: ZINE_DEMO_DECK.issue },
      onChange: () => {},
    };
    render(
      <ZineEditProvider value={ctx}>
        <ZineDispatch {...entry.resolved.props} />
      </ZineEditProvider>,
    );
    expect(screen.getByLabelText('events.0.values.runOfShow.0.t')).toBeTruthy();
    expect(screen.getByLabelText('events.0.values.scene')).toBeTruthy();
  });

  test('read-only rows render their text and no delete control', () => {
    const entry = slides.find((s) => s.slide.type === 'dispatch');
    const { container } = render(<ZineDispatch {...entry.resolved.props} />);
    const first = entry.resolved.props.events[0].runOfShow[0];
    expect(container.textContent).toContain(first.what);
    expect(container.querySelector('.jgz-rowdrop')).toBeNull();
  });

  test('a slot with no stored value shows its placeholder, not the default', () => {
    const entry = slides.find((s) => s.slide.type === 'card');
    const stripped = { ...entry.slide, values: {} };
    const ctx = {
      editing: true,
      slide: { ...stripped, issue: ZINE_DEMO_DECK.issue },
      onChange: () => {},
    };
    const { container } = render(
      <ZineEditProvider value={ctx}>
        <ZineCard {...entry.resolved.props} />
      </ZineEditProvider>,
    );
    expect(container.querySelector('.jgz-editable--empty')).toBeTruthy();
  });
});
