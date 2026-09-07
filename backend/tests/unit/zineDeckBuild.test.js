/**
 * Phase 03 proof: a deck can be built from empty and survives the server's
 * coercion. Exercises the editor's own reducer shapes — writePath for a slot
 * edit, the manifest-derived add, and the fixed-ends rule — against the real
 * manifest rather than a fixture.
 */

const {
  ZINE_SLIDE_TYPES,
  ZINE_ADDABLE_TYPES,
  emptySlideOf,
  coerceSlide,
  slideGaps,
} = require('../../constants/zineSlideTypes');

/** Mirrors writePath in the frontend's zineField.jsx. */
function writePath(source, path, value) {
  const [head, ...rest] = String(path).split('.');
  const base = Array.isArray(source) ? [...source] : { ...(source || {}) };
  base[head] = rest.length ? writePath(base[head], rest.join('.'), value) : value;
  return base;
}

/** Mirrors addSlide in PivotCarouselEditor.jsx — nothing here names a type. */
function addSlide(deck, type, afterIndex) {
  const spec = ZINE_SLIDE_TYPES[type];
  const count = spec.events === 'derived' ? 0 : (spec.events.exactly ?? spec.events.min ?? 0);
  const events = Array.from({ length: count }, () => ({
    eventId: null, label: null, snapshot: null, imageOverride: null, values: {},
  }));
  const options = {};
  for (const option of spec.options || []) {
    if (option.default !== undefined) options[option.key] = option.default;
  }
  const slides = [...deck.slides];
  const at = Math.min(Math.max(afterIndex + 1, 1), slides.length - 1);
  slides.splice(at, 0, { type, values: {}, options, events });
  return { ...deck, slides };
}

describe('building a deck from empty', () => {
  const emptyDeck = () => ({
    title: 'issue — oakland',
    issue: { number: '', city: 'oakland', dateline: '', week: '', scanned: '' },
    slides: [emptySlideOf('cover'), emptySlideOf('back')],
  });

  test('a new deck opens on the cover and closes on the back', () => {
    const deck = emptyDeck();
    expect(deck.slides.map((s) => s.type)).toEqual(['cover', 'back']);
  });

  test('every added slide lands between the fixed pair', () => {
    let deck = emptyDeck();
    for (const type of ZINE_ADDABLE_TYPES) {
      deck = addSlide(deck, type, deck.slides.length - 2);
    }
    expect(deck.slides[0].type).toBe('cover');
    expect(deck.slides[deck.slides.length - 1].type).toBe('back');
    expect(deck.slides).toHaveLength(ZINE_ADDABLE_TYPES.length + 2);
  });

  test('adding never lands outside the ends even when the selection is the last slide', () => {
    const deck = addSlide(emptyDeck(), ZINE_ADDABLE_TYPES[0], 99);
    expect(deck.slides[deck.slides.length - 1].type).toBe('back');
  });

  test('an added slide arrives with its declared event slots and option defaults', () => {
    const wall = addSlide(emptyDeck(), 'wall', 0).slides[1];
    expect(wall.events).toHaveLength(3);
    const notice = addSlide(emptyDeck(), 'notice', 0).slides[1];
    expect(notice.options).toEqual({ knockoutShape: 0 });
  });

  test('a slot edit writes through a dotted path without touching its siblings', () => {
    const slide = emptySlideOf('dispatch');
    const edited = writePath(
      writePath(slide, 'events.0.snapshot.name', 'basement set'),
      'events.0.values.scene',
      'the PA was a house system',
    );
    expect(edited.events[0].snapshot.name).toBe('basement set');
    expect(edited.events[0].values.scene).toBe('the PA was a house system');
    expect(edited.type).toBe('dispatch');
    expect(slide.events[0].snapshot).toBeNull();
  });

  test('a run-of-show row edit reaches into the array', () => {
    let slide = emptySlideOf('dispatch');
    slide = writePath(slide, 'events.0.values.runOfShow', [{ t: '', what: '' }]);
    slide = writePath(slide, 'events.0.values.runOfShow.0.t', '23:00');
    expect(slide.events[0].values.runOfShow[0].t).toBe('23:00');
  });

  test('a deck built this way survives the server coercion unchanged', () => {
    let deck = emptyDeck();
    for (const type of ZINE_ADDABLE_TYPES) deck = addSlide(deck, type, deck.slides.length - 2);

    for (const slide of deck.slides) {
      const result = coerceSlide(slide);
      expect(result.error).toBeUndefined();
      expect(result.notes).toEqual([]);
      expect(result.slide.type).toBe(slide.type);
    }
  });

  test('an empty deck reports gaps, and filling a slot clears them', () => {
    const slide = emptySlideOf('card');
    expect(slideGaps(slide).length).toBeGreaterThan(0);

    const filled = writePath(
      writePath(slide, 'values.slug', 'last night'),
      'events.0.snapshot.name',
      'basement set',
    );
    expect(slideGaps(filled)).toEqual([]);
  });

  test('typing past a manifest cap is trimmed on save, not silently kept', () => {
    const slide = writePath(emptySlideOf('card'), 'events.0.values.note', 'x'.repeat(400));
    const result = coerceSlide(slide);
    expect(result.slide.events[0].values.note).toHaveLength(84);
  });
});

/**
 * Phase 04 proof: an event picked from the catalog fills a slot and the result
 * survives the server's coercion. Mirrors what the picker builds from a search
 * row, so a change to either shape breaks here rather than on a slide.
 */
describe('filling a slot from the catalog', () => {
  const { serializeForSlot } = require('../../services/pivotCarouselCatalogService');

  const catalogRow = serializeForSlot({
    _id: '507f1f77bcf86cd799439011',
    name: 'basement set: dj oyinbo',
    location: 'warehouse off 14th',
    image: 'https://s3/flier.jpg',
    start_time: new Date('2026-09-05T23:00:00Z'),
    customFields: {
      pivot: { host: { name: 'nadine' }, tags: ['no phones', 'cash at the door'] },
    },
  });

  /** Mirrors pick() in PivotCarouselEventPicker.jsx. */
  const asSlotEntry = (row) => ({
    eventId: row._id,
    label: null,
    snapshot: {
      name: row.name,
      host: row.host,
      startTime: row.startTime,
      whenLabel: '11:00 pm',
      location: row.location,
      image: row.image,
    },
    imageOverride: null,
    values: { tags: (row.tags || []).slice(0, 3) },
  });

  test('a picked event fills the slot and closes the slide gaps', () => {
    const slide = emptySlideOf('card');
    expect(slideGaps(slide).join(' ')).toMatch(/1 more event/);

    const filled = {
      ...writePath(slide, 'values.slug', 'last night'),
      events: [asSlotEntry(catalogRow)],
    };
    expect(slideGaps(filled)).toEqual([]);
  });

  test('the picked entry survives coercion with nothing trimmed', () => {
    const slide = { ...emptySlideOf('card'), events: [asSlotEntry(catalogRow)] };
    const result = coerceSlide(slide);
    expect(result.error).toBeUndefined();
    expect(result.notes).toEqual([]);
    expect(result.slide.events[0].snapshot.name).toBe('basement set: dj oyinbo');
  });

  test('the event id is kept as provenance and the copy is a snapshot', () => {
    const entry = coerceSlide({
      ...emptySlideOf('card'),
      events: [asSlotEntry(catalogRow)],
    }).slide.events[0];
    expect(entry.eventId).toBe('507f1f77bcf86cd799439011');
    expect(entry.snapshot.location).toBe('warehouse off 14th');
  });

  test('catalog tags seed the vibe tags but stay within the manifest cap', () => {
    const wide = { ...catalogRow, tags: ['a', 'b', 'c', 'd', 'e'] };
    const entry = coerceSlide({
      ...emptySlideOf('card'),
      events: [asSlotEntry(wide)],
    }).slide.events[0];
    expect(entry.values.tags).toEqual(['a', 'b', 'c']);
  });

  test('the flier is the photo until an override replaces it', () => {
    const entry = asSlotEntry(catalogRow);
    expect(entry.snapshot.image).toBe('https://s3/flier.jpg');
    expect(entry.imageOverride).toBeNull();
  });
});
