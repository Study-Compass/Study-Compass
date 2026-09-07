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
import { resolveSlide, sampleSlideFor } from './zineDeck';
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

  test('a dynamic slot with no stored value shows its placeholder', () => {
    const entry = slides.find((s) => s.slide.type === 'card');
    const stripped = {
      ...entry.slide,
      events: [{ ...entry.slide.events[0], values: {} }],
    };
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

/**
 * The rule the editor hangs off: a field carrying a `voice` key is static house
 * copy, edited in the voice panel and never typable on the slide. This is the
 * guard for it — the split is easy to lose one binding at a time.
 */
describe('static copy is not editable on the slide', () => {
  const editable = (type, slide, props) => {
    const ctx = {
      editing: true,
      slide: { ...slide, issue: ZINE_DEMO_DECK.issue },
      onChange: () => {},
    };
    const Frame = FRAMES[type];
    const { container } = render(
      <ZineEditProvider value={ctx}>
        <Frame {...props} />
      </ZineEditProvider>,
    );
    return [...container.querySelectorAll('.jgz-editable')].map((el) =>
      el.getAttribute('aria-label'),
    );
  };

  test('the back cover has nothing typable at all', () => {
    const entry = slides.find((s) => s.slide.type === 'back');
    expect(editable('back', entry.slide, entry.resolved.props)).toEqual([]);
  });

  test('the receipt has nothing typable but the city it is addressed to', () => {
    const entry = slides.find((s) => s.slide.type === 'receipt');
    expect(editable('receipt', entry.slide, entry.resolved.props)).toEqual(['issue.city']);
  });

  test('no frame exposes a slot the manifest marks as voice copy', () => {
    const VOICE_KEYS = [
      'values.tagline', 'values.title', 'values.slug', 'values.cut',
      'values.insteadLabel', 'values.footer', 'values.stamp',
      'values.kicker', 'values.line', 'values.sub', 'values.url',
    ];
    for (const { slide, resolved } of slides) {
      const labels = editable(slide.type, slide, resolved.props);
      // The wall's kicker is dynamic and shares a name with the back cover's
      // static one, so it is excluded by type rather than by key.
      const forbidden = slide.type === 'wall'
        ? VOICE_KEYS.filter((k) => k !== 'values.kicker')
        : VOICE_KEYS;
      expect(labels.filter((l) => forbidden.includes(l))).toEqual([]);
    }
  });

  test('dynamic slots are still typable', () => {
    const entry = slides.find((s) => s.slide.type === 'dispatch');
    const labels = editable('dispatch', entry.slide, entry.resolved.props);
    expect(labels).toEqual(expect.arrayContaining([
      'events.0.snapshot.name',
      'events.0.values.scene',
      'events.0.values.instead',
    ]));
  });
});

/**
 * Static copy resolves down three layers. The city layer is the one the panel
 * writes, so if the resolver stopped consulting it the panel would appear to
 * save and the slides would silently ignore it.
 */
describe('the voice layers', () => {
  const MANIFEST = {
    types: {
      back: {
        fields: [
          { key: 'kicker', voice: 'zine.back.kicker', shipped: 'shipped kicker' },
          { key: 'line', voice: 'zine.back.line', shipped: 'shipped line' },
          { key: 'sub', voice: 'zine.back.sub', shipped: 'shipped sub' },
          { key: 'url', voice: 'zine.back.url', shipped: 'shipped url' },
        ],
        events: { min: 0, max: 0 },
      },
    },
  };

  const backSlide = { type: 'back', values: {}, options: {}, events: [] };
  const resolve = (deck, city) =>
    resolveSlide(deck, backSlide, 0, MANIFEST, city).props.values;

  test('falls back to what the manifest shipped', () => {
    expect(resolve({ slides: [backSlide] }, {}).kicker).toBe('shipped kicker');
  });

  test('the city voice wins over shipped', () => {
    const values = resolve({ slides: [backSlide] }, { 'zine.back.kicker': 'oakland kicker' });
    expect(values.kicker).toBe('oakland kicker');
    expect(values.line).toBe('shipped line');
  });

  test('a deck override wins over the city', () => {
    const deck = { slides: [backSlide], voice: { entries: { 'zine.back.kicker': 'deck kicker' } } };
    expect(resolve(deck, { 'zine.back.kicker': 'oakland kicker' }).kicker).toBe('deck kicker');
  });

  test('an empty override does not shadow the layer beneath it', () => {
    const deck = { slides: [backSlide], voice: { entries: { 'zine.back.kicker': '   ' } } };
    expect(resolve(deck, { 'zine.back.kicker': 'oakland kicker' }).kicker).toBe('oakland kicker');
  });
});

/**
 * The add-slide previews render the real components, so a template that throws
 * on placeholder data takes the whole picker down rather than showing a gap.
 */
describe('add-slide previews', () => {
  const MANIFEST = {
    addable: ['wall', 'card', 'notice', 'dispatch', 'receipt'],
    types: {
      wall: { label: 'the wall', blurb: 'b', events: { min: 3, max: 4 }, fields: [] },
      card: { label: 'the card', blurb: 'b', events: { exactly: 1 }, fields: [] },
      notice: {
        label: 'the notice', blurb: 'b', events: { exactly: 1 }, fields: [],
        options: [{ key: 'knockoutShape', default: 0 }],
      },
      dispatch: { label: 'the dispatch', blurb: 'b', events: { exactly: 1 }, fields: [] },
      receipt: { label: 'the receipt', blurb: 'b', events: 'derived', fields: [] },
    },
  };

  test.each(MANIFEST.addable)('%s previews without a React complaint', (type) => {
    const slide = sampleSlideFor(type, MANIFEST);
    const deck = { issue: { number: '000', city: 'oakland' }, slides: [slide] };
    const resolved = resolveSlide(deck, slide, 0, MANIFEST, {});
    const Frame = FRAMES[type];
    const complaints = withStrictConsole(() => {
      render(<Frame {...resolved.props} />);
    });
    expect(complaints).toEqual([]);
  });

  test('a preview fills every event slot the type takes', () => {
    expect(sampleSlideFor('wall', MANIFEST).events).toHaveLength(4);
    expect(sampleSlideFor('dispatch', MANIFEST).events).toHaveLength(1);
    expect(sampleSlideFor('receipt', MANIFEST).events).toHaveLength(0);
  });

  test('option defaults are applied so a preview is not a broken variant', () => {
    expect(sampleSlideFor('notice', MANIFEST).options).toEqual({ knockoutShape: 0 });
  });
});

/**
 * The edit affordance tints every slot, so a slide under it is not the slide.
 * With editing off, a frame must render exactly as it prints.
 */
describe('the edit toggle', () => {
  test('nothing is tinted or typable when editing is off', () => {
    const entry = slides.find((s) => s.slide.type === 'dispatch');
    const ctx = {
      editing: false,
      slide: { ...entry.slide, issue: ZINE_DEMO_DECK.issue },
      onChange: () => {},
    };
    const { container } = render(
      <ZineEditProvider value={ctx}>
        <ZineDispatch {...entry.resolved.props} />
      </ZineEditProvider>,
    );
    expect(container.querySelectorAll('.jgz-editable')).toHaveLength(0);
    expect(container.querySelectorAll('[contenteditable]')).toHaveLength(0);
    expect(container.querySelector('.jgz-rowdrop')).toBeNull();
  });

  test('the same slide with editing on is typable', () => {
    const entry = slides.find((s) => s.slide.type === 'dispatch');
    const ctx = {
      editing: true,
      slide: { ...entry.slide, issue: ZINE_DEMO_DECK.issue },
      onChange: () => {},
    };
    const { container } = render(
      <ZineEditProvider value={ctx}>
        <ZineDispatch {...entry.resolved.props} />
      </ZineEditProvider>,
    );
    expect(container.querySelectorAll('.jgz-editable').length).toBeGreaterThan(0);
  });

  /*
   * The invariant that makes an edit toggle honest: turning it on may tint and
   * outline, but it may not change a single character. A field bound to part of
   * a composed string breaks this — it shows the whole string when reading and
   * only its own slice when editing.
   */
  test.each(slides.map((s, i) => [`${i} ${s.slide.type}`, s]))(
    'slide %s reads identically with editing on and off',
    (_name, { slide, resolved }) => {
      const text = (editing) => {
        const ctx = {
          editing,
          slide: { ...slide, issue: ZINE_DEMO_DECK.issue },
          onChange: () => {},
        };
        const Frame = FRAMES[slide.type];
        const { container } = render(
          <ZineEditProvider value={ctx}>
            <Frame {...resolved.props} />
          </ZineEditProvider>,
        );
        // Controls the editor adds are chrome, not copy; the slide's own words
        // are what must not move.
        container.querySelectorAll('[data-editor-chrome]').forEach((el) => el.remove());
        return container.textContent;
      };
      expect(text(true)).toBe(text(false));
    },
  );
});
