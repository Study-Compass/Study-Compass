/**
 * "sorry u missed it" — repeatable 4:5 frame templates.
 *
 * Every frame takes the same four props, resolved by zineDeck.js from a stored
 * deck: `{ issue, values, events, options }`. They hold no data of their own and
 * reach for no module-level constants, which is what lets a new slide type be a
 * manifest entry plus one of these components and nothing else.
 *
 * Every frame is a fixed 4:5 box that establishes a container context, so all
 * interior geometry is expressed in `cqw` and the same markup renders
 * identically at 1080x1350 export size and at gallery preview size.
 *
 * Two devices carry the issue and are used nowhere else:
 *   - the knockout: a hand-cut hole punched through a poster, ink-stroked on
 *     the inside edge. It is the reader's absence, made literal.
 *   - the stamp: the creator console's curation verdict, re-pointed from a
 *     judgement on a listing to a judgement on your night.
 *
 * Zine register tilt budget: posters to 8deg, stamps to 12deg. Never on a
 * paragraph, a metadata rule, or anything read at length.
 *
 * These are carousel slides, not screens: nothing moves, nothing affords a
 * tap, and every frame is final on first paint so a screenshot is the export.
 */

import React from 'react';
import justGoWordmark from '../../../../assets/pivot/just-go-wordmark.svg';
import justGoWordmarkDark from '../../../../assets/pivot/just-go-wordmark-dark.svg';
import appStoreBadge from '../../../../assets/pivot/download-on-the-app-store.svg';

/* ------------------------------------------------------------- primitives */

/** Hand-cut quadrilaterals. Same grammar as the mobile scrapbook card path. */
const CUT_SHAPES = [
  'M 6 4 L 394 11 L 388 492 L 11 484 Z',
  'M 11 8 L 391 3 L 396 489 L 5 496 Z',
  'M 4 12 L 388 5 L 395 484 L 9 495 Z',
];

/** Struck mark, not a badge. Double rule via outline + offset, hard rotation. */
function ZineStamp({ label = 'missed', tone = 'burst', deg = -7, className = '' }) {
  return (
    <div
      className={`jgz-stamp jgz-stamp--${tone} ${className}`}
      style={{ '--jgz-stamp-deg': `${deg}deg` }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

/**
 * The knockout. `fill-rule: evenodd` removes the cut shape from a ground-
 * coloured plate; a second path strokes only the cut edge so the hole reads
 * as torn paper rather than a mask.
 */
function ZineKnockout({ shape = 0 }) {
  const d = CUT_SHAPES[shape % CUT_SHAPES.length];
  return (
    <svg
      className="jgz-knockout"
      viewBox="0 0 400 500"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={`M0 0 H400 V500 H0 Z ${d}`} fillRule="evenodd" className="jgz-knockout__plate" />
      <path d={d} className="jgz-knockout__edge" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Warm-black textured block when nothing is filed. Brand rule: never a broken
 * image, never a logo.
 */
function ZinePhoto({ src, alt, className = '' }) {
  return (
    <div className={`jgz-photo ${className}`}>
      {src ? (
        <img src={src} alt={alt} draggable={false} />
      ) : (
        <div className="jgz-photo__blank" role="img" aria-label={`${alt} — no image filed`}>
          <span>no image filed</span>
        </div>
      )}
      <span className="jgz-photo__grain" aria-hidden="true" />
    </div>
  );
}

function ZineFolio({ left, right }) {
  return (
    <div className="jgz-folio">
      <span>{left}</span>
      <span className="jgz-folio__rule" aria-hidden="true" />
      <span>{right}</span>
    </div>
  );
}

/** Blue when / yellow where. Sharp, 1.5px-equivalent border, never a pill. */
function ZineChips({ when, where }) {
  return (
    <div className="jgz-chips">
      <span className="jgz-chip jgz-chip--when">{when}</span>
      <span className="jgz-chip jgz-chip--where">{where}</span>
    </div>
  );
}

/**
 * The standing head. A label in the display face with its date trailing in
 * mono, set flush left at reading size — no rule beneath it, no tracked-out
 * caps, and no split to both trims. It reads as a section head, which is what
 * it is, rather than as a band of chrome across the top of the frame.
 */
function ZineSlug({ label, value, className = '' }) {
  return (
    <p className={`jgz-slug ${className}`}>
      <span className="jgz-slug__label">{label}</span>
      <span className="jgz-slug__value">{value}</span>
    </p>
  );
}

/**
 * How the room worked, in the room's own words. Unfilled and rule-bound so it
 * never competes with the when/where chips, which carry the listing data.
 */
function ZineTags({ tags, limit = 3 }) {
  return (
    <ul className="jgz-tags">
      {tags.slice(0, limit).map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------------- frames */

/**
 * 01 — cover. The publication's name sits in the flag, at flag size; the cover
 * line is the week's curation and it is derived from the records, so a new
 * issue rewrites its own cover. Everything is set inside the trim — nothing
 * clips.
 */
export function ZineCover({ issue, values, events }) {
  const event = events[0] || {};
  const lead = values.lead || {};

  return (
    <>
      <ZinePhoto src={event.cover} alt={event.title} className="jgz-cover__photo" />
      <div className="jgz-cover__wash" aria-hidden="true" />

      <header className="jgz-cover__flag">
        <h2 className="jgz-cover__name">sorry u missed it</h2>
        <p className="jgz-cover__tagline">
          {values.weekLabel} · no. {issue.number}
        </p>
      </header>

      <div className="jgz-cover__body">
        <ZineStamp label="missed" deg={-9} className="jgz-cover__stamp" />
        <p className="jgz-cover__eyebrow">{lead.eyebrow}</p>
        <h3 className="jgz-cover__heading">{lead.heading}</h3>
        <p className="jgz-cover__sub">{lead.sub}</p>
      </div>

      <div className="jgz-cover__foot">
        <p className="jgz-cover__caption">
          above: {event.title}, {event.where}
        </p>
        <ZineFolio left={issue.dateline} right={issue.city} />
      </div>
    </>
  );
}

/**
 * 02 — contact sheet. Four postings pinned at four different angles, the way
 * a flyer wall accretes. The grid is deliberately off-register.
 */
export function ZineSheet({ issue, values, events }) {
  const pins = [
    { deg: -3.4, x: 0, y: 0 },
    { deg: 2.6, x: 1.6, y: 2.4 },
    { deg: 1.8, x: -1.2, y: 1.2 },
    { deg: -2.2, x: 0.8, y: -1.6 },
  ];

  return (
    <>
      <header className="jgz-sheet__head">
        <h2 className="jgz-sheet__title">{values.title}</h2>
        <p className="jgz-sheet__kicker">
          {values.kicker}. {issue.dateline}, {issue.city}
        </p>
      </header>

      <div className="jgz-sheet__grid">
        {events.slice(0, 4).map((event, index) => {
          const pin = pins[index % pins.length];
          return (
            <article
              key={event.id}
              className="jgz-posting"
              style={{
                '--jgz-deg': `${pin.deg}deg`,
                '--jgz-x': `${pin.x}cqw`,
                '--jgz-y': `${pin.y}cqw`,
              }}
            >
              <ZinePhoto src={event.cover} alt={event.title} className="jgz-posting__photo" />
              <div className="jgz-posting__plate">
                <h3 className="jgz-posting__title">{event.title}</h3>
                <p className="jgz-posting__meta">
                  {event.when} — {event.where}
                </p>
                <ZineTags tags={event.tags} limit={2} />
              </div>
              <span className="jgz-posting__x" aria-hidden="true">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
                  <path d="M4 6 L96 94" vectorEffect="non-scaling-stroke" />
                  <path d="M96 6 L4 94" vectorEffect="non-scaling-stroke" />
                </svg>
              </span>
            </article>
          );
        })}
      </div>
    </>
  );
}

/**
 * 03 — the card. The photograph is the whole frame and the app's own event
 * card sits on top of it: the listing that existed, on the night it existed,
 * with the stamp struck across it. The one frame where the product's own
 * furniture appears, so the reader sees exactly what they did not open.
 */
export function ZineCard({ issue, values, events }) {
  const event = events[0] || {};

  return (
    <>
      <ZinePhoto src={event.cover} alt={event.title} className="jgz-card__photo" />
      <div className="jgz-card__scrim" aria-hidden="true" />

      <ZineSlug
        label={values.slug}
        value={`${issue.dateline} · ${issue.city}`}
        className="jgz-card__slug"
      />

      <article className="jgz-card__plate">
        <h2 className="jgz-card__title">{event.title}</h2>
        <p className="jgz-card__host">{event.host}</p>
        <ZineChips when={event.when} where={event.where} />
        <ZineTags tags={event.tags} />
        <p className="jgz-card__note">{event.note}</p>
        <ZineStamp label="missed" deg={-8} className="jgz-card__stamp" />
      </article>

      <ZineFolio left={`no. ${issue.number}`} right="the card" />
    </>
  );
}

/**
 * 04 — the notice. One event at full weight with the knockout punched through
 * it. With no figure competing, the photograph carries the frame.
 */
export function ZineNotice({ issue, values, events, options }) {
  const event = events[0] || {};
  const shape = options.knockoutShape || 0;

  return (
    <>
      <ZineSlug label={values.slug} value={issue.dateline} className="jgz-notice__slug" />

      <figure className="jgz-notice__plate">
        <ZinePhoto src={event.cover} alt={event.title} className="jgz-notice__photo" />
        <ZineKnockout shape={shape} />
        <figcaption className="jgz-notice__cut">{values.cut}</figcaption>
      </figure>

      <div className="jgz-notice__body">
        <h2 className="jgz-notice__title">{event.title}</h2>
        <p className="jgz-notice__host">{event.host}</p>
        <ZineChips when={event.when} where={event.where} />
        <ZineTags tags={event.tags} />
        <p className="jgz-notice__note">{event.note}</p>
      </div>

      <ZineFolio left={`no. ${issue.number}`} right={issue.city} />
    </>
  );
}

/**
 * 05 — the dispatch. The reportage frame: when the night turned, what it
 * sounded like, and what the reader was doing at the same hour. The counter-
 * point at the bottom is the whole argument of the issue, stated once.
 */
export function ZineDispatch({ issue, values, events }) {
  const event = events[0] || {};

  return (
    <>
      <ZineSlug label={values.slug} value={issue.dateline} className="jgz-dispatch__slug" />

      <div className="jgz-dispatch__lede">
        <div className="jgz-dispatch__thumb">
          <ZinePhoto src={event.cover} alt={event.title} />
        </div>
        <div>
          <h2 className="jgz-dispatch__title">{event.title}</h2>
          <p className="jgz-dispatch__venue">
            {event.where} · {event.when}
          </p>
          <ZineTags tags={event.tags} />
        </div>
      </div>

      {/* A run of show is a real sequence, so it is the one place numbering earns itself. */}
      <ol className="jgz-run">
        {event.runOfShow.map((step) => (
          <li key={step.t}>
            <span className="jgz-run__time">{step.t}</span>
            <span className="jgz-run__what">{step.what}</span>
          </li>
        ))}
      </ol>

      <p className="jgz-dispatch__scene">{event.scene}</p>

      <p className="jgz-dispatch__instead">
        <span>{values.insteadLabel}</span>
        {event.instead}
      </p>

      <ZineFolio left={`no. ${issue.number}`} right={values.slug} />
    </>
  );
}

/**
 * 06 — the receipt. No photograph anywhere. Space Mono doing the one job the
 * console reserves it for: machine values. The break in the carousel.
 */
export function ZineReceipt({ issue, values }) {
  return (
    <div className="jgz-receipt">
      <div className="jgz-receipt__slip">
        <header className="jgz-receipt__head">
          <p className="jgz-receipt__vendor">just go — {issue.city}</p>
          <p className="jgz-receipt__doc">
            issue {issue.number} · {issue.dateline}
          </p>
        </header>

        <ul className="jgz-receipt__lines">
          {(values.lines || []).map((line) => (
            <li key={line.id}>
              <span className="jgz-receipt__label">{line.label}</span>
              <span className="jgz-receipt__leader" aria-hidden="true" />
              <span className="jgz-receipt__tag">{line.tag}</span>
              <span className="jgz-receipt__when">{line.when}</span>
            </li>
          ))}
        </ul>

        <dl className="jgz-receipt__totals">
          {(values.totals || []).map((total) => (
            <div key={total.label}>
              <dt>{total.label}</dt>
              <dd>{total.value}</dd>
            </div>
          ))}
        </dl>

        <p className="jgz-receipt__footer">{values.footer}</p>
      </div>

      <ZineStamp label={values.stamp} tone="ink" deg={-11} className="jgz-receipt__stamp" />
    </div>
  );
}

/**
 * 07 — back cover. The wordmark finally gets its full size, and it carries the
 * frame alone — no ornament, so nothing argues with the mark.
 */
export function ZineBack({ issue, values, paper }) {
  return (
    <>
      <div className="jgz-back__body">
        <img
          className="jgz-back__wordmark"
          src={paper ? justGoWordmarkDark : justGoWordmark}
          alt="just go"
          draggable={false}
        />
        <p className="jgz-back__kicker">{values.kicker}</p>
        <h2 className="jgz-back__line">{values.line}</h2>
        <p className="jgz-back__sub">{values.sub}</p>

        {/* The badge is the only call to action: a real mark, not a tappable-looking one. */}
        <img className="jgz-back__badge" src={appStoreBadge} alt="Download on the App Store" />
      </div>

      <ZineFolio left={values.url} right={`no. ${issue.number} · end`} />
    </>
  );
}
