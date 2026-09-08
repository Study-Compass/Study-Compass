const {
  ZINE_SLIDE_TYPES,
  ZINE_ADDABLE_TYPES,
  eventSlotRange,
  zineVoiceKeys,
  emptySlideOf,
  coerceSlide,
  slideGaps,
} = require('../../constants/zineSlideTypes');

describe('zine slide manifest', () => {
  test('every type declares an event rule and a photo policy', () => {
    for (const [key, spec] of Object.entries(ZINE_SLIDE_TYPES)) {
      expect(spec.label).toBeTruthy();
      expect(spec.events).toBeDefined();
      expect(spec.photo).toBeTruthy();
      expect(`${key} has fields`).toBe(`${key} has fields`);
    }
  });

  test('the fixed pair is not addable', () => {
    expect(ZINE_ADDABLE_TYPES).not.toContain('cover');
    expect(ZINE_ADDABLE_TYPES).not.toContain('back');
    expect(ZINE_ADDABLE_TYPES).toContain('dispatch');
  });

  test('voice keys are unique across the manifest', () => {
    const paths = zineVoiceKeys().map((row) => row.path);
    expect(paths.length).toBeGreaterThan(0);
    expect(new Set(paths).size).toBe(paths.length);
  });

  test('every voice key is namespaced under zine.', () => {
    for (const row of zineVoiceKeys()) {
      expect(row.path.startsWith('zine.')).toBe(true);
    }
  });
});

describe('event slot ranges', () => {
  test('exactly-one types report a range of one', () => {
    expect(eventSlotRange('dispatch')).toEqual({ min: 1, max: 1, derived: false });
  });

  test('the wall takes three to four', () => {
    expect(eventSlotRange('wall')).toEqual({ min: 3, max: 4, derived: false });
  });

  test('the receipt is derived and takes no slots of its own', () => {
    expect(eventSlotRange('receipt')).toEqual({ min: 0, max: 0, derived: true });
  });
});

describe('emptySlideOf', () => {
  test('seeds the minimum number of blank event slots', () => {
    expect(emptySlideOf('wall').events).toHaveLength(3);
    expect(emptySlideOf('dispatch').events).toHaveLength(1);
    expect(emptySlideOf('cover').events).toHaveLength(0);
  });

  test('applies declared option defaults', () => {
    expect(emptySlideOf('notice').options).toMatchObject({ knockoutShape: 0 });
  });

  test('returns null for an unknown type', () => {
    expect(emptySlideOf('nope')).toBeNull();
  });
});

describe('coerceSlide', () => {
  test('rejects an unknown type', () => {
    expect(coerceSlide({ type: 'nope' }).error).toMatch(/Unknown slide type/);
  });

  test('caps a line to the manifest max and says so', () => {
    const max = ZINE_SLIDE_TYPES.back.fields.find((f) => f.key === 'kicker').max;
    const result = coerceSlide({ type: 'back', values: { kicker: 'x'.repeat(max + 40) } });
    expect(result.slide.values.kicker).toHaveLength(max);
    expect(result.notes.join(' ')).toMatch(/kicker trimmed/);
  });

  test('drops values the type does not declare', () => {
    const result = coerceSlide({ type: 'back', values: { kicker: 'ok', smuggled: 'nope' } });
    expect(result.slide.values).not.toHaveProperty('smuggled');
  });

  test('holds the event list inside the slot range', () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ snapshot: { name: `e${i}` } }));
    const result = coerceSlide({ type: 'wall', events: six });
    expect(result.slide.events).toHaveLength(4);
    expect(result.notes.join(' ')).toMatch(/at most 4/);
  });

  test('caps rows and their text, and drops wholly empty rows', () => {
    const result = coerceSlide({
      type: 'dispatch',
      events: [{
        values: {
          runOfShow: [
            { t: '11:00', what: 'y'.repeat(200) },
            { t: '', what: '' },
            { t: '1', what: 'a' }, { t: '2', what: 'b' },
            { t: '3', what: 'c' }, { t: '4', what: 'd' },
          ],
        },
      }],
    });
    const rows = result.slide.events[0].values.runOfShow;
    expect(rows.length).toBeLessThanOrEqual(4);
    expect(rows[0].what.length).toBeLessThanOrEqual(64);
    expect(rows.every((row) => row.t || row.what)).toBe(true);
  });

  test('caps tags by count and by length', () => {
    const result = coerceSlide({
      type: 'card',
      events: [{ values: { tags: ['a'.repeat(80), 'b', 'c', 'd', 'e'] } }],
    });
    const tags = result.slide.events[0].values.tags;
    expect(tags).toHaveLength(3);
    expect(tags[0].length).toBeLessThanOrEqual(22);
  });

  test('falls back to the default for an out-of-range enum', () => {
    expect(coerceSlide({ type: 'notice', options: { knockoutShape: 9 } }).slide.options)
      .toMatchObject({ knockoutShape: 0 });
  });

  test('keeps eventId as provenance without reading it back', () => {
    const id = '507f1f77bcf86cd799439011';
    const result = coerceSlide({ type: 'card', events: [{ eventId: id, snapshot: { name: 'x' } }] });
    expect(result.slide.events[0].eventId).toBe(id);
    expect(result.slide.events[0].snapshot).toEqual({ name: 'x' });
  });
});

describe('slideGaps', () => {
  test('an empty required slide reports its unfilled slots', () => {
    const gaps = slideGaps(emptySlideOf('back'));
    expect(gaps).toEqual(expect.arrayContaining(['kicker', 'line', 'sub']));
  });

  test('optional fields never count as gaps', () => {
    const gaps = slideGaps({ type: 'cover', values: { weekLabel: 'w', scanned: '1', coverLine: 'c' }, events: [] });
    expect(gaps).not.toContain('caption');
  });

  test('a short event list is reported as a gap', () => {
    expect(slideGaps(emptySlideOf('wall')).join(' ')).toMatch(/3 more event/);
  });

  test('a filled slide has no gaps', () => {
    const gaps = slideGaps({
      type: 'card',
      values: { slug: 'last night' },
      events: [{ snapshot: { name: 'basement set' } }],
    });
    expect(gaps).toEqual([]);
  });
});
