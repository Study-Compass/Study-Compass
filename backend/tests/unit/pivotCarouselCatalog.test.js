const {
  buildQuery,
  serializeForSlot,
  safeRegex,
} = require('../../services/pivotCarouselCatalogService');

describe('catalog query', () => {
  test('only ever returns published, undeleted pivot events', () => {
    const q = buildQuery({});
    expect(q['customFields.pivot.ingestStatus']).toBe('published');
    expect(q['customFields.pivot']).toEqual({ $exists: true });
    expect(q.isDeleted).toEqual({ $ne: true });
  });

  test('a bare query has no date or text clause to widen it', () => {
    const q = buildQuery({});
    expect(q.start_time).toBeUndefined();
    expect(q.$or).toBeUndefined();
  });

  test('a from date bounds the low end only', () => {
    const from = new Date('2026-09-01T00:00:00Z');
    expect(buildQuery({ from }).start_time).toEqual({ $gte: from });
  });

  test('both bounds apply together', () => {
    const from = new Date('2026-09-01T00:00:00Z');
    const to = new Date('2026-09-07T23:59:59Z');
    expect(buildQuery({ from, to }).start_time).toEqual({ $gte: from, $lte: to });
  });

  test('batchWeek and a date range can be combined', () => {
    const q = buildQuery({ batchWeek: '2026-W36', from: new Date('2026-09-01') });
    expect(q['customFields.pivot.batchWeek']).toBe('2026-W36');
    expect(q.start_time.$gte).toBeInstanceOf(Date);
  });

  test('search covers name, venue, host and tags', () => {
    const fields = buildQuery({ q: 'basement' }).$or.map((clause) => Object.keys(clause)[0]);
    expect(fields).toEqual([
      'name',
      'location',
      'customFields.pivot.host.name',
      'customFields.pivot.tags',
    ]);
  });
});

describe('search input is escaped', () => {
  test('regex metacharacters are matched literally, not interpreted', () => {
    expect(safeRegex('a.b').test('axb')).toBe(false);
    expect(safeRegex('a.b').test('a.b')).toBe(true);
  });

  test('a catastrophic pattern is defused rather than compiled', () => {
    const pattern = '(a+)+$';
    expect(safeRegex(pattern).test(pattern)).toBe(true);
    expect(safeRegex(pattern).test('aaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(false);
  });

  test('matching stays case-insensitive', () => {
    expect(safeRegex('BASEMENT').test('basement set')).toBe(true);
  });
});

describe('slot serialisation', () => {
  const event = {
    _id: 'abc123',
    name: 'basement set: dj oyinbo',
    location: 'warehouse off 14th',
    image: 'https://s3/flier.jpg',
    start_time: new Date('2026-09-05T23:00:00Z'),
    customFields: {
      pivot: {
        host: { name: 'nadine + the 14th st crew' },
        tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        batchWeek: '2026-W36',
      },
    },
  };

  test('carries exactly what a slot needs', () => {
    const row = serializeForSlot(event);
    expect(row).toEqual({
      _id: 'abc123',
      name: 'basement set: dj oyinbo',
      host: 'nadine + the 14th st crew',
      startTime: event.start_time,
      location: 'warehouse off 14th',
      image: 'https://s3/flier.jpg',
      tags: ['a', 'b', 'c', 'd', 'e', 'f'],
      batchWeek: '2026-W36',
    });
  });

  test('the flier is the default photo, and its absence is null not empty', () => {
    expect(serializeForSlot({ ...event, image: '' }).image).toBeNull();
  });

  test('an event with no pivot host or tags still serialises', () => {
    const bare = { _id: 'x', name: 'n', customFields: {} };
    expect(serializeForSlot(bare)).toMatchObject({ host: '', tags: [], batchWeek: null });
  });
});
