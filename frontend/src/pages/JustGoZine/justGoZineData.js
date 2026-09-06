/**
 * "sorry u missed it" — demo issue content.
 *
 * Concept deck only. The zine is a social-post register: it reports on the
 * events that already happened, so every record here is past tense and every
 * figure is a machine value (mono, tabular). Real issues would be generated
 * from the previous day's published drop for one tenant city.
 */

import canopy from '../../assets/pivot/pivot-hero-canopy.webp';
import coast from '../../assets/pivot/pivot-hero-coast.jpg';
import court from '../../assets/pivot/pivot-hero-court.jpg';
import dandelions from '../../assets/pivot/pivot-hero-dandelions.jpg';
import meadow from '../../assets/pivot/pivot-hero-meadow.jpg';

export const ZINE_ISSUE = {
  number: '014',
  city: 'oakland',
  dateline: 'thu 05 sep',
  strapline: 'everything that happened while you were home',
};

/**
 * `missed` is the editorial verdict, not a data state — it is the reason the
 * issue exists, so it is stamped rather than badged.
 */
export const ZINE_EVENTS = [
  {
    id: 'basement-set',
    title: 'basement set: dj oyinbo',
    host: 'nadine + the 14th st crew',
    when: '11:00 pm',
    where: 'warehouse off 14th',
    cover: court,
    tally: '40',
    tallyLabel: 'capacity',
    note: 'sold out in six minutes. you were not on the list.',
  },
  {
    id: 'free-throw',
    title: 'free throw contest',
    host: 'mosswood rec',
    when: '6:00 pm',
    where: 'mosswood park',
    cover: meadow,
    tally: '0',
    tallyLabel: 'cover charge',
    note: 'free, outdoors, four blocks from your apartment.',
  },
  {
    id: 'sixteen-mm',
    title: '16mm shorts + q&a',
    host: 'the new parkway',
    when: '7:30 pm',
    where: '474 24th st',
    cover: canopy,
    tally: '9',
    tallyLabel: 'films screened',
    note: 'the director stayed until the lights came up.',
  },
  {
    id: 'night-market',
    title: 'night market on 8th',
    host: 'chinatown merchants assoc.',
    when: '5:00 pm',
    where: '8th & webster',
    cover: coast,
    tally: '31',
    tallyLabel: 'stalls',
    note: 'ran four hours longer than posted.',
  },
  {
    id: 'blitz-chess',
    title: 'blitz chess, lakeside',
    host: 'lake merritt irregulars',
    when: '4:00 pm',
    where: 'lake merritt pergola',
    cover: dandelions,
    tally: '5',
    tallyLabel: 'minute clock',
    note: 'they play every thursday. they have for eleven years.',
  },
  {
    id: 'riso-swap',
    title: 'risograph zine swap',
    host: 'e.m. wolfman',
    when: '2:00 pm',
    where: '410 13th st',
    cover: null,
    tally: '60',
    tallyLabel: 'zines traded',
    note: 'bring one, take one. no money changed hands.',
  },
  {
    id: 'last-call',
    title: 'last call listening party',
    host: 'roof at the kapor',
    when: '9:00 pm',
    where: 'uptown rooftop',
    cover: null,
    tally: '1',
    tallyLabel: 'album, start to finish',
    note: 'nobody talked over it.',
  },
];

/** The receipt frame tallies the whole issue — it is the argument, in figures. */
export const ZINE_RECEIPT = {
  lines: ZINE_EVENTS.map((event) => ({
    id: event.id,
    label: event.title,
    when: event.when,
  })),
  totals: [
    { label: 'events published', value: '7' },
    { label: 'events you attended', value: '0' },
    { label: 'within 2 miles of you', value: '6' },
    { label: 'free to get into', value: '4' },
  ],
  footer: 'no refunds. it already happened.',
};

export const ZINE_CTA = {
  kicker: 'this took ninety seconds to read',
  line: 'next thursday you find out on monday',
  sub: 'just go tells you what is on this week, before it is last night.',
  action: 'get just go',
  url: 'justgo.lol',
};
