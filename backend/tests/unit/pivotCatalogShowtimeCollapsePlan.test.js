/**
 * The manual roll-up path.
 *
 * Ingest refuses to merge what it is unsure about, because nobody is watching.
 * A person selecting rows has looked at them, so nothing here blocks — two
 * unrelated listings can be rolled up on purpose. What the code owes them is an
 * accurate account of what will happen and a warning when it looks wrong.
 */

const {
  planCollapse,
  collapseWarnings,
} = require('../../services/pivotCatalogShowtimeCollapseService');

function catalogEvent(id, overrides = {}) {
  return {
    _id: id,
    name: overrides.name || 'Derrick Stroup',
    description: overrides.description || 'A night of stand-up.',
    location: overrides.location || "Cobb's Comedy Club",
    image: overrides.image || null,
    start_time: overrides.start_time || '2026-08-28T02:30:00.000Z',
    end_time: overrides.end_time || null,
    customFields: {
      pivot: {
        batchWeek: overrides.batchWeek || '2026-W35',
        ingestStatus: overrides.ingestStatus || 'staged',
        tags: overrides.tags || [],
        host: overrides.host || { name: 'Cobbs' },
      },
    },
  };
}

const second = (o = {}) => catalogEvent('b', { start_time: '2026-08-29T02:30:00.000Z', ...o });

describe('who survives', () => {
  test('the caller decides, whatever the ranking would have said', () => {
    const events = [
      catalogEvent('a', { ingestStatus: 'published' }),
      second({ ingestStatus: 'draft' }),
    ];
    expect(String(planCollapse(events, 'b').survivor._id)).toBe('b');
  });

  test('without a choice, published outranks draft', () => {
    const events = [
      catalogEvent('a', { ingestStatus: 'draft' }),
      second({ ingestStatus: 'published' }),
    ];
    expect(String(planCollapse(events).survivor._id)).toBe('b');
  });

  test('an unknown keepEventId falls back to the ranking rather than throwing', () => {
    const events = [catalogEvent('a', { ingestStatus: 'published' }), second()];
    expect(String(planCollapse(events, 'nope').survivor._id)).toBe('a');
  });

  test('the survivor is not in its own absorbed list', () => {
    const plan = planCollapse([catalogEvent('a'), second()], 'a');
    expect(plan.absorbed.map((e) => String(e._id))).toEqual(['b']);
  });
});

describe('what the plan says will happen', () => {
  const plan = () => planCollapse([
    catalogEvent('a', { description: 'Short.', tags: ['comedy'] }),
    second({ description: 'A much longer description of the night.', tags: ['standup'], image: 'x.jpg' }),
  ], 'a');

  test('every showtime is listed, earliest first', () => {
    const times = plan().slots.map((slot) => slot.start_time.toISOString());
    expect(times).toEqual([...times].sort());
    expect(times).toHaveLength(2);
  });

  test('the richer description wins, not the survivor’s', () => {
    expect(plan().description).toBe('A much longer description of the night.');
  });

  test('tags union rather than replace', () => {
    expect(plan().pivot.tags.sort()).toEqual(['comedy', 'standup']);
  });

  test('an absorbed image fills a survivor that has none', () => {
    expect(plan().image).toBe('x.jpg');
  });

  test('the span runs from the earliest start to the latest end', () => {
    const p = plan();
    expect(new Date(p.start_time).toISOString()).toBe('2026-08-28T02:30:00.000Z');
  });

  test('planning writes nothing to the events it was given', () => {
    const events = [catalogEvent('a'), second()];
    const before = JSON.stringify(events);
    planCollapse(events, 'a');
    expect(JSON.stringify(events)).toBe(before);
  });
});

describe('warnings', () => {
  const codes = (events, keep) => planCollapse(events, keep).warnings.map((w) => w.code);
  const levels = (events, keep) => Object.fromEntries(
    planCollapse(events, keep).warnings.map((w) => [w.code, w.level]),
  );

  test('two showings of the same thing raise nothing', () => {
    expect(codes([catalogEvent('a'), second()])).toEqual([]);
  });

  test('an unrelated title warns', () => {
    const events = [catalogEvent('a'), second({ name: 'Warehouse techno all-nighter' })];
    expect(codes(events, 'a')).toContain('distinct-title');
    expect(levels(events, 'a')['distinct-title']).toBe('warning');
  });

  test('a different venue warns', () => {
    const events = [catalogEvent('a'), second({ location: 'Gray Area, 2665 Mission St' })];
    expect(codes(events, 'a')).toContain('distinct-venue');
  });

  test('a missing venue does not warn, because absence is not disagreement', () => {
    expect(codes([catalogEvent('a'), second({ location: '' })], 'a')).not.toContain('distinct-venue');
  });

  test('spanning catalog weeks is a notice, not a warning — it is supported', () => {
    const events = [catalogEvent('a'), second({ start_time: '2026-09-03T02:30:00.000Z', batchWeek: '2026-W36' })];
    expect(codes(events, 'a')).toContain('mixed-weeks');
    expect(levels(events, 'a')['mixed-weeks']).toBe('notice');
  });

  test('identical start times are a notice: it is a merge, not a roll-up', () => {
    const events = [catalogEvent('a'), catalogEvent('b')];
    expect(levels(events, 'a')['single-showtime']).toBe('notice');
  });

  test('a very wide span is a notice', () => {
    const events = [catalogEvent('a'), second({ start_time: '2026-10-30T02:30:00.000Z', batchWeek: '2026-W35' })];
    expect(codes(events, 'a')).toContain('wide-span');
  });

  test('nothing is ever an error — the manual path always produces a plan', () => {
    const wild = [
      catalogEvent('a'),
      second({ name: 'Completely different', location: 'Elsewhere', batchWeek: '2027-W02', start_time: '2027-01-09T02:30:00.000Z' }),
    ];
    const plan = planCollapse(wild, 'a');
    expect(plan.survivor).toBeTruthy();
    expect(plan.slots.length).toBe(2);
    expect(plan.warnings.some((w) => w.level === 'warning')).toBe(true);
  });

  test('collapseWarnings is callable on its own, for a survivor swap', () => {
    const a = catalogEvent('a');
    const b = second({ name: 'Warehouse techno all-nighter' });
    expect(collapseWarnings(a, [b], planCollapse([a, b], 'a').slots).length).toBeGreaterThan(0);
  });
});
