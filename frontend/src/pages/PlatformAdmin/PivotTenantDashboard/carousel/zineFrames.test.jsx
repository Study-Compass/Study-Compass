/**
 * Render every frame, read-only and editing, against the reference deck.
 *
 * These templates are only ever judged by eye, which means a rendering fault
 * reaches a person before it reaches a test. This is the cheap floor: if a
 * frame throws, or React refuses a child, or a slot goes missing, it fails
 * here instead of in the admin panel.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ZINE_DEMO_DECK } from './zineDemoDeck';
import { frameClass, resolveSlide, sampleSlideFor } from './zineDeck';
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
      'values.name',
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

/**
 * A slot with a computed default. The cover line is built from the deck's own
 * records until someone writes one, so it has to behave like any other dynamic
 * field without losing that derivation the first time it is focused.
 */
describe('the cover line', () => {
  const MANIFEST = {
    types: {
      cover: {
        fields: [{ key: 'coverLine', kind: 'line', max: 72, optional: true }],
        events: { min: 0, max: 1 },
      },
    },
  };

  const coverSlide = ZINE_DEMO_DECK.slides[0];
  const deck = { ...ZINE_DEMO_DECK, slides: ZINE_DEMO_DECK.slides };

  const renderCover = (slide, onChange = () => {}) => {
    const resolved = resolveSlide({ ...deck, slides: [slide] }, slide, 0, MANIFEST, {});
    const ctx = { editing: true, slide: { ...slide, issue: deck.issue }, onChange };
    return render(
      <ZineEditProvider value={ctx}>
        <ZineCover {...resolved.props} />
      </ZineEditProvider>,
    );
  };

  test('is typable', () => {
    renderCover(coverSlide);
    expect(screen.getByLabelText('values.coverLine')).toBeTruthy();
  });

  test('editing starts from the derived line rather than from nothing', () => {
    renderCover(coverSlide);
    expect(screen.getByLabelText('values.coverLine').textContent).toMatch(/nights worth/);
  });

  test('a stored line replaces the derived one', () => {
    const slide = { ...coverSlide, values: { ...coverSlide.values, coverLine: 'a week you missed' } };
    renderCover(slide);
    expect(screen.getByLabelText('values.coverLine').textContent).toBe('a week you missed');
  });

  test('committing the derived text unchanged stores nothing, so it stays derived', () => {
    const writes = [];
    renderCover(coverSlide, (path, value) => writes.push([path, value]));
    const field = screen.getByLabelText('values.coverLine');
    fireEvent.blur(field);
    expect(writes).toEqual([['values.coverLine', '']]);
  });

  test('committing changed text stores it', () => {
    const writes = [];
    renderCover(coverSlide, (path, value) => writes.push([path, value]));
    const field = screen.getByLabelText('values.coverLine');
    field.textContent = 'six rooms you were not in';
    fireEvent.blur(field);
    expect(writes).toEqual([['values.coverLine', 'six rooms you were not in']]);
  });

  test('a derived slot is never marked empty, so it shows no placeholder', () => {
    const { container } = renderCover(coverSlide);
    expect(container.querySelector('.jgz-cover__heading.jgz-editable--empty')).toBeNull();
  });
});

/**
 * Per-slide options. The manifest declares them and the frame honours them;
 * neither the editor nor these tests should need to know what they mean.
 */
describe('slide options', () => {
  const render1 = (type, slide, props, options) => {
    const Frame = FRAMES[type];
    const { container } = render(<Frame {...props} options={options} />);
    return container;
  };

  // Substrings lie here: the first demo tag is "free" and the first demo event
  // is "free throw contest". Tags are counted as elements instead.
  const tagCount = (container) => container.querySelectorAll('.jgz-tags li').length;

  describe('the wall', () => {
    const entry = slides.find((s) => s.slide.type === 'wall');
    const first = entry.resolved.props.events[0];

    test('a posting is a name and a time by default', () => {
      const container = render1('wall', entry.slide, entry.resolved.props, {});
      expect(container.textContent).toContain(first.title);
      expect(container.textContent).toContain(first.when);
      expect(container.textContent).not.toContain(first.where);
      expect(tagCount(container)).toBe(0);
    });

    test('minimal is the same as no option at all', () => {
      const bare = render1('wall', entry.slide, entry.resolved.props, {}).textContent;
      const minimal = render1('wall', entry.slide, entry.resolved.props, { detail: 'minimal' }).textContent;
      expect(minimal).toBe(bare);
    });

    test('full brings the venue and the tags back', () => {
      const container = render1('wall', entry.slide, entry.resolved.props, { detail: 'full' });
      expect(container.textContent).toContain(first.where);
      expect(tagCount(container)).toBeGreaterThan(0);
    });
  });

  describe('the missed stamp', () => {
    test.each(['cover', 'card'])('%s shows it unless it is switched off', (type) => {
      const entry = slides.find((s) => s.slide.type === type);
      const on = render1(type, entry.slide, entry.resolved.props, {});
      const off = render1(type, entry.slide, entry.resolved.props, { stamp: false });
      expect(on.querySelectorAll('.jgz-stamp')).toHaveLength(1);
      expect(off.querySelectorAll('.jgz-stamp')).toHaveLength(0);
    });

    test('switching it off changes nothing else on the slide', () => {
      const entry = slides.find((s) => s.slide.type === 'card');
      const on = render1('card', entry.slide, entry.resolved.props, {}).textContent;
      const off = render1('card', entry.slide, entry.resolved.props, { stamp: false }).textContent;
      expect(off).toBe(on.replace('missed', ''));
    });
  });

  describe('the publication name', () => {
    test('comes from the slide values, not from the component', () => {
      const entry = slides.find((s) => s.slide.type === 'cover');
      const props = { ...entry.resolved.props, values: { ...entry.resolved.props.values, name: 'a different masthead' } };
      const text = render1('cover', entry.slide, props, {}).textContent;
      expect(text).toContain('a different masthead');
      expect(text).not.toContain('sorry u missed it');
    });
  });
});

/**
 * The ink plate is the whole visible difference of the newsprint edition, and
 * it belongs to the issue rather than to a slide — a deck with the wash on some
 * photographs and not others is not a printing decision. One helper builds the
 * class for all four places that render a frame, so a slide cannot print
 * differently from its own thumbnail.
 */
describe('the newsprint ink plate', () => {
  test('night has no ink modifier, because there is no plate to switch off', () => {
    expect(frameClass({ edition: 'night' })).toBe('jgz-frame jgz-frame--night');
    expect(frameClass({ edition: 'night', inkPlate: false })).toBe('jgz-frame jgz-frame--night');
  });

  test('newsprint carries the plate by default', () => {
    expect(frameClass({ edition: 'paper' })).toBe('jgz-frame jgz-frame--paper');
    expect(frameClass({ edition: 'paper', inkPlate: true })).toBe('jgz-frame jgz-frame--paper');
  });

  test('switching it off adds the modifier the stylesheet keys on', () => {
    expect(frameClass({ edition: 'paper', inkPlate: false }))
      .toBe('jgz-frame jgz-frame--paper jgz-frame--noink');
  });

  test('an unknown or missing edition falls back to night rather than nothing', () => {
    expect(frameClass({})).toBe('jgz-frame jgz-frame--night');
    expect(frameClass(null)).toBe('jgz-frame jgz-frame--night');
    expect(frameClass({ edition: 'letterpress' })).toBe('jgz-frame jgz-frame--night');
  });
});

/**
 * The folio's issue number.
 *
 * It belongs to the deck, so it prints on most slides and is set from any of
 * them. A deck with no number set used to print a bare "no." with a gap after
 * it on every slide — a blank value looking exactly like a bug, because it was.
 */
describe('the issue number', () => {
  const deck = (overrides) => ({
    ...ZINE_DEMO_DECK,
    ...overrides,
    issue: { ...ZINE_DEMO_DECK.issue, ...(overrides?.issue || {}) },
  });

  const resolveCover = (d) => {
    const slide = d.slides[0];
    return resolveSlide(d, slide, 0, null, {});
  };

  test('prints when the deck has one', () => {
    expect(resolveCover(deck()).props.issue.folio).toBe('no. 014');
  });

  test('prints nothing at all when the number is blank', () => {
    expect(resolveCover(deck({ issue: { number: '' } })).props.issue.folio).toBe('');
  });

  test('prints nothing when the deck is unnumbered on purpose', () => {
    expect(resolveCover(deck({ showIssueNumber: false })).props.issue.folio).toBe('');
  });

  test('a blank number leaves no stray "no." on a slide', () => {
    const d = deck({ issue: { number: '' } });
    for (const [index, slide] of d.slides.entries()) {
      const resolved = resolveSlide(d, slide, index, null, {});
      const Frame = FRAMES[slide.type];
      const { container } = render(<Frame {...resolved.props} />);
      expect(container.textContent).not.toMatch(/no\.\s*(·|$)/);
    }
  });

  test('switching it off removes it from every slide that shows one', () => {
    const on = deck();
    const off = deck({ showIssueNumber: false });
    let seenOn = 0;

    for (const [index, slide] of on.slides.entries()) {
      const withNumber = render(
        React.createElement(FRAMES[slide.type], resolveSlide(on, slide, index, null, {}).props),
      ).container.textContent;
      const without = render(
        React.createElement(FRAMES[slide.type], resolveSlide(off, slide, index, null, {}).props),
      ).container.textContent;

      if (withNumber.includes('no. 014')) seenOn += 1;
      expect(without).not.toContain('no. 014');
    }
    expect(seenOn).toBeGreaterThan(0);
  });
});

/**
 * Type sitting on a photograph. `auto` must change nothing, or every deck that
 * never touches the setting shifts the day it is added.
 */
describe('text over the photo', () => {
  const cover = slides.find((s) => s.slide.type === 'cover');
  const card = slides.find((s) => s.slide.type === 'card');

  const classesFor = (entry, options) => {
    const Frame = FRAMES[entry.slide.type];
    const { container } = render(<Frame {...entry.resolved.props} options={options} />);
    return container.innerHTML;
  };

  test('auto adds no tone class, and is the same as no option', () => {
    expect(classesFor(cover, { photoText: 'auto' })).toBe(classesFor(cover, {}));
    expect(classesFor(cover, {})).not.toContain('jgz-tone--');
  });

  test.each(['light', 'dark'])('%s marks the cover’s type and its wash', (tone) => {
    const html = classesFor(cover, { photoText: tone });
    expect(html).toContain(`jgz-cover__wash jgz-tone--${tone}`);
    expect(html).toContain(`jgz-cover__flag jgz-tone--${tone}`);
    expect(html).toContain(`jgz-cover__body jgz-tone--${tone}`);
  });

  test.each(['light', 'dark'])('%s marks the notice caption, which sits on the picture', (tone) => {
    const notice = slides.find((s) => s.slide.type === 'notice');
    const Frame = FRAMES.notice;
    const { container } = render(
      <Frame {...notice.resolved.props} options={{ ...notice.resolved.props.options, photoText: tone }} />,
    );
    expect(container.querySelector(`.jgz-notice__cut.jgz-tone--${tone}`)).toBeTruthy();
  });

  test('the notice renders with no options at all', () => {
    const notice = slides.find((s) => s.slide.type === 'notice');
    const Frame = FRAMES.notice;
    const complaints = withStrictConsole(() => {
      render(<Frame {...notice.resolved.props} options={undefined} />);
    });
    expect(complaints).toEqual([]);
  });

  test('every frame with type on a photograph offers the control', () => {
    // The dispatch's thumb carries no type, and the wall's postings put their
    // text on a plate — so neither needs one.
    const withTypeOnPhoto = ['cover', 'card', 'notice'];
    for (const type of withTypeOnPhoto) {
      const entry = slides.find((s) => s.slide.type === type);
      const html = classesFor(entry, { photoText: 'light' });
      expect(html).toContain('jgz-tone--light');
    }
  });

  test.each(['light', 'dark'])('%s marks the card’s scrim and slug', (tone) => {
    const html = classesFor(card, { photoText: tone });
    expect(html).toContain(`jgz-card__scrim jgz-tone--${tone}`);
    expect(html).toContain(`jgz-tone--${tone}`);
  });

  test('an unknown value is ignored rather than emitting a broken class', () => {
    expect(classesFor(cover, { photoText: 'chartreuse' })).not.toContain('jgz-tone--');
  });
});

describe('the cover photo credit', () => {
  const cover = slides.find((s) => s.slide.type === 'cover');
  const text = (options) => render(
    <ZineCover {...cover.resolved.props} options={options} />,
  ).container.textContent;

  test('names the photograph by default', () => {
    expect(text({})).toContain('above:');
  });

  test('switching it off leaves the picture to speak for itself', () => {
    expect(text({ photoCredit: false })).not.toContain('above:');
  });

  test('switching it off removes nothing else', () => {
    expect(text({ photoCredit: false }).length).toBeLessThan(text({}).length);
    expect(text({ photoCredit: false })).toContain(cover.resolved.props.values.name);
  });
});

/**
 * The cover's sub-line is a voice template. The figures come from the deck and
 * only the wording around them is anyone's to choose, so the numbers are
 * interpolated rather than typed — a city can reword the claim without being
 * able to misstate what it counted.
 */
describe('the cover sub-line', () => {
  const MANIFEST = {
    types: {
      cover: {
        events: { min: 0, max: 1 },
        fields: [
          {
            key: 'sub',
            kind: 'template',
            voice: 'zine.cover.sub',
            shipped: 'we read {scanned} listings this week and kept {kept}. you made none of them.',
          },
          {
            key: 'subUncounted',
            kind: 'template',
            voice: 'zine.cover.subUncounted',
            shipped: 'we kept {kept} of everything on this week. you made none of them.',
          },
        ],
      },
    },
  };

  const sub = (deckOverrides, cityVoice = {}) => {
    const deck = {
      ...ZINE_DEMO_DECK,
      ...deckOverrides,
      issue: { ...ZINE_DEMO_DECK.issue, ...(deckOverrides?.issue || {}) },
    };
    return resolveSlide(deck, deck.slides[0], 0, MANIFEST, cityVoice).props.values.lead.sub;
  };

  test('interpolates the deck’s own figures', () => {
    expect(sub()).toBe('we read 214 listings this week and kept 6. you made none of them.');
  });

  test('a city can reword it and keep the numbers', () => {
    const reworded = sub({}, { 'zine.cover.sub': 'sifted {scanned}, kept {kept}.' });
    expect(reworded).toBe('sifted 214, kept 6.');
  });

  test('a deck override beats the city', () => {
    const deckVoice = { voice: { entries: { 'zine.cover.sub': 'this week: {kept}.' } } };
    expect(sub(deckVoice, { 'zine.cover.sub': 'city wording {kept}' })).toBe('this week: 6.');
  });

  test('a deck that counted nothing uses the other line', () => {
    expect(sub({ issue: { scanned: '' } }))
      .toBe('we kept 6 of everything on this week. you made none of them.');
  });

  test('the uncounted line is separately rewordable', () => {
    const out = sub({ issue: { scanned: '' } }, { 'zine.cover.subUncounted': 'kept {kept}, counted nothing.' });
    expect(out).toBe('kept 6, counted nothing.');
  });

  test('wording with no placeholders is left alone', () => {
    expect(sub({}, { 'zine.cover.sub': 'you missed all of it.' })).toBe('you missed all of it.');
  });

  test('a broken template shows its own text rather than blanking the line', () => {
    // The formatter reports instead of throwing, and hands back the raw source.
    // Seeing the braces on the slide is how you find out the wording is wrong;
    // a silently empty line is not.
    const out = sub({}, { 'zine.cover.sub': 'kept {kept} of {nonsense}.' });
    expect(out).toBe('kept {kept} of {nonsense}.');
  });

  test('renders without a manifest, so the reference preview still reads', () => {
    const deck = ZINE_DEMO_DECK;
    const out = resolveSlide(deck, deck.slides[0], 0, null, {}).props.values.lead.sub;
    expect(out).toBe('we read 214 listings this week and kept 6. you made none of them.');
  });
});
