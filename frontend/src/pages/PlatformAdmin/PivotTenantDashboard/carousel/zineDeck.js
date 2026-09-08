/**
 * Deck → frame props.
 *
 * The one seam between a stored PivotCarouselDeck and the templates. Frames
 * stay dumb: each takes `{ issue, values, events, options }` and renders. That
 * is what lets a new slide type be a manifest entry plus a component, with no
 * new prop convention to invent.
 *
 * Three things resolve here rather than in a template:
 *   - voice layering: slide value → deck override → manifest shipped default
 *   - derived slots: the cover line, and the receipt's tally of the whole deck
 *   - `asset:` tokens: the reference deck's bundled photographs
 */

import canopy from '../../../../assets/pivot/pivot-hero-canopy.webp';
import coast from '../../../../assets/pivot/pivot-hero-coast.jpg';
import court from '../../../../assets/pivot/pivot-hero-court.jpg';
import dandelions from '../../../../assets/pivot/pivot-hero-dandelions.jpg';
import meadow from '../../../../assets/pivot/pivot-hero-meadow.jpg';

/** Only the reference deck uses these; a deck built in the editor carries URLs. */
const BUNDLED_ASSETS = {
  'asset:canopy': canopy,
  'asset:coast': coast,
  'asset:court': court,
  'asset:dandelions': dandelions,
  'asset:meadow': meadow,
};

/**
 * Counts are spelled out in the cover line because it is set in the display
 * face — the house rule keeps numerals in Space Mono, for machine values only.
 */
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

export function spellCount(n) {
  return COUNT_WORDS[n] || String(n);
}

/**
 * The zine sets times in lowercase with no leading zero — "11:00 pm", not
 * "11:00 PM" — so a picked event's label matches copy typed by hand.
 */
export function formatWhenLabel(startTime) {
  if (!startTime) return '';
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return '';
  return date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
}

function resolveImage(value) {
  if (!value) return null;
  return BUNDLED_ASSETS[value] || value;
}

/**
 * Static copy resolves down the layers: this deck's own override, then the
 * city's house voice, then what the manifest shipped. Dynamic copy has no
 * layers — a slide value or nothing.
 */
function fieldValue(slide, field, deck, cityVoice) {
  const own = slide?.values?.[field.key];
  if (typeof own === 'string' && own.trim()) return own;
  if (field.voice) {
    const deckValue = deck?.voice?.entries?.[field.voice];
    if (typeof deckValue === 'string' && deckValue.trim()) return deckValue;
    const cityValue = cityVoice?.[field.voice];
    if (typeof cityValue === 'string' && cityValue.trim()) return cityValue;
    if (field.shipped) return field.shipped;
  }
  return typeof own === 'string' ? own : '';
}

/**
 * A slide's event entry as the frames want it. The snapshot carries what was
 * copied from the catalog; `values` carries what the admin wrote about it.
 */
function resolveEvent(entry, index) {
  const snapshot = entry?.snapshot || {};
  const values = entry?.values || {};
  return {
    id: entry?.eventId || `slot-${index}`,
    title: snapshot.name || '',
    host: snapshot.host || '',
    when: snapshot.whenLabel || '',
    where: snapshot.location || '',
    cover: resolveImage(entry?.imageOverride?.url || snapshot.image),
    label: entry?.label || null,
    tags: Array.isArray(values.tags) ? values.tags : [],
    note: values.note || '',
    runOfShow: Array.isArray(values.runOfShow) ? values.runOfShow : [],
    scene: values.scene || '',
    instead: values.instead || '',
  };
}

/**
 * The cover line is derived, not written: change the week's slides and the
 * cover rewrites itself. It leads on the curation — what was read, what was
 * kept — and leaves the publication's own name to the flag.
 */
export function buildCoverLead(deck, slides) {
  const issue = deck?.issue || {};
  const kept = countEventSlides(slides);
  const week = issue.week || '';
  const city = issue.city || '';

  return {
    eyebrow: [week, city].filter(Boolean).join(' · '),
    heading: `${spellCount(kept)} nights worth leaving the house for`,
    sub: issue.scanned
      ? `we read ${issue.scanned} listings this week and kept ${kept}. you made none of them.`
      : `we kept ${kept} of everything on this week. you made none of them.`,
  };
}

/** Slides that stand for an event, which is what the issue's count means. */
function countEventSlides(slides) {
  const seen = new Set();
  for (const slide of slides || []) {
    if (slide.type === 'cover') continue;
    for (const entry of slide.events || []) {
      const name = entry?.snapshot?.name;
      if (name) seen.add(name);
    }
  }
  return seen.size;
}

/**
 * The slip holds this many lines before the frame's bottom trim. Derived lines
 * have no manifest cap to hold them — the count comes from how many slides the
 * deck has — so the ceiling lives here, where the geometry is known.
 */
const RECEIPT_MAX_LINES = 9;

/**
 * The receipt tallies the whole issue, so its lines come from the other slides
 * in deck order rather than from a picker of its own. The totals always report
 * the true count, even when the printed lines are capped.
 */
function buildReceipt(deck, slides) {
  const lines = [];
  const seen = new Set();

  for (const slide of slides || []) {
    if (slide.type === 'cover' || slide.type === 'receipt') continue;
    for (const entry of slide.events || []) {
      const name = entry?.snapshot?.name;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      lines.push({
        id: `${name}-${lines.length}`,
        label: name,
        when: entry.snapshot.whenLabel || '',
        tag: (entry.values?.tags || [])[0] || '',
      });
    }
  }

  const printed = lines.slice(0, RECEIPT_MAX_LINES);
  const overflow = lines.length - printed.length;
  if (overflow > 0) {
    printed.push({
      id: 'overflow',
      label: `and ${overflow} more you also missed`,
      when: '',
      tag: '',
    });
  }

  return {
    lines: printed,
    totals: [
      { label: 'events published', value: String(lines.length) },
      { label: 'events you attended', value: '0' },
    ],
  };
}

function manifestFields(manifest, type) {
  return manifest?.types?.[type]?.fields || [];
}

/**
 * Resolve one slide into the props its frame takes. `manifest` is optional —
 * the reference deck fills every value explicitly, so it renders without one.
 */
export function resolveSlide(deck, slide, index, manifest, cityVoice) {
  const values = { ...(slide.values || {}) };

  for (const field of manifestFields(manifest, slide.type)) {
    values[field.key] = fieldValue(slide, field, deck, cityVoice);
  }

  const events = (slide.events || []).map(resolveEvent);
  const slides = deck?.slides || [];

  if (slide.type === 'cover') {
    values.lead = buildCoverLead(deck, slides);
  }
  if (slide.type === 'receipt') {
    Object.assign(values, buildReceipt(deck, slides));
  }

  return {
    id: slide._id || `slide-${index}`,
    type: slide.type,
    props: {
      issue: deck?.issue || {},
      values,
      events,
      options: slide.options || {},
      paper: deck?.edition === 'paper',
    },
  };
}

/**
 * Slots a slide still needs, read from the manifest the server sent. Mirrors
 * slideGaps() in backend/constants/zineSlideTypes.js — the server decides what
 * is stored, this only decides what the editor shows while you are typing.
 */
export function slideGaps(slide, manifest) {
  const spec = manifest?.types?.[slide?.type];
  if (!spec) return [];

  const gaps = [];
  for (const field of spec.fields || []) {
    if (field.optional || field.derived) continue;
    const own = slide?.values?.[field.key];
    const shipped = field.shipped;
    if (!String(own || shipped || '').trim()) gaps.push(field.key);
  }

  if (spec.events !== 'derived') {
    const min = spec.events.exactly ?? spec.events.min ?? 0;
    const filled = (slide?.events || []).filter((e) => e?.snapshot?.name).length;
    if (filled < min) gaps.push(`${min - filled} more event${min - filled === 1 ? '' : 's'}`);
  }

  return gaps;
}

/**
 * The class list for a frame. One helper because four places render frames —
 * the light table, the strip, the canvas and the export route — and a slide
 * that prints differently from its own thumbnail is the bug this prevents.
 */
export function frameClass(deck) {
  const edition = deck?.edition === 'paper' ? 'paper' : 'night';
  // The ink plate only exists on newsprint, so the modifier is only meaningful
  // there; adding it on night would be a class that never matches anything.
  const noInk = edition === 'paper' && deck?.inkPlate === false;
  return `jgz-frame jgz-frame--${edition}${noInk ? ' jgz-frame--noink' : ''}`;
}

/**
 * A slide of `type` with enough in it to be recognisable, for the add-slide
 * previews. Static copy comes from the manifest so a preview shows the city's
 * real house voice; the dynamic copy is obviously placeholder, because a
 * preview that looked like real listing data would be read as one.
 */
const SAMPLE_EVENT = {
  eventId: null,
  label: null,
  snapshot: {
    name: 'the event goes here',
    host: 'its host',
    startTime: null,
    whenLabel: '9:00 pm',
    location: 'the venue',
    image: null,
  },
  imageOverride: null,
  values: {
    tags: ['a tag', 'another'],
    note: 'the line that lands after the listing.',
    scene: 'what the room sounded like, in a sentence or three.',
    instead: 'what you were doing at that hour',
    runOfShow: [
      { t: '21:00', what: 'doors' },
      { t: '23:10', what: 'the room turned' },
    ],
  },
};

export function sampleSlideFor(type, manifest) {
  const spec = manifest?.types?.[type];
  if (!spec) return null;

  const options = {};
  for (const option of spec.options || []) {
    if (option.default !== undefined) options[option.key] = option.default;
  }

  const count = spec.events === 'derived'
    ? 0
    : (spec.events.exactly ?? spec.events.max ?? 0);

  return {
    type,
    values: {},
    options,
    events: Array.from({ length: count }, () => SAMPLE_EVENT),
  };
}

/** The whole deck, ready to render. */
export function resolveDeck(deck, manifest, cityVoice) {
  return {
    edition: deck?.edition === 'paper' ? 'paper' : 'night',
    issue: deck?.issue || {},
    slides: (deck?.slides || []).map(
      (slide, i) => resolveSlide(deck, slide, i, manifest, cityVoice),
    ),
  };
}
