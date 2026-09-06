/**
 * "sorry u missed it" — repeatable 4:5 frame templates.
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
 */

import React from 'react';
import justGoBurst from '../../assets/pivot/just-go-burst.svg';
import justGoWordmark from '../../assets/pivot/just-go-wordmark.svg';
import justGoWordmarkDark from '../../assets/pivot/just-go-wordmark-dark.svg';
import appStoreBadge from '../../assets/pivot/download-on-the-app-store.svg';
import { ZINE_CTA, ZINE_ISSUE, ZINE_RECEIPT } from './justGoZineData';

/* ------------------------------------------------------------- primitives */

/** Hand-cut quadrilaterals. Same grammar as the mobile scrapbook card path. */
const CUT_SHAPES = [
  'M 6 4 L 394 11 L 388 492 L 11 484 Z',
  'M 11 8 L 391 3 L 396 489 L 5 496 Z',
  'M 4 12 L 388 5 L 395 484 L 9 495 Z',
];

function ZineTicker({ message, tone = 'ticker' }) {
  const segment = `${message}   •   `;
  return (
    <div className={`jgz-ticker jgz-ticker--${tone}`} aria-hidden="true">
      <div className="jgz-ticker__rail">
        <span>{segment.repeat(4)}</span>
        <span>{segment.repeat(4)}</span>
      </div>
    </div>
  );
}

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

/** Warm-black textured block. Brand rule: never a broken image, never a logo. */
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

/* ----------------------------------------------------------------- frames */

/**
 * 01 — cover. The masthead is set past the right trim so the word "it" is
 * partly missing from its own cover.
 */
export function ZineCover({ event }) {
  return (
    <>
      <ZineTicker message={ZINE_ISSUE.strapline} />
      <ZinePhoto src={event.cover} alt={event.title} className="jgz-cover__photo" />
      <div className="jgz-cover__wash" aria-hidden="true" />

      <div className="jgz-cover__body">
        <h2 className="jgz-masthead">
          <span>sorry</span>
          <span>u</span>
          <span className="jgz-masthead__bleed">missed it</span>
        </h2>
        <ZineStamp label="missed" deg={-9} className="jgz-cover__stamp" />
      </div>

      <div className="jgz-cover__foot">
        <p className="jgz-cover__caption">
          last night, {ZINE_ISSUE.city}. all of it without you.
        </p>
        <ZineFolio
          left={`no. ${ZINE_ISSUE.number}`}
          right={`${ZINE_ISSUE.dateline} · ${ZINE_ISSUE.city}`}
        />
      </div>
    </>
  );
}

/**
 * 02 — contact sheet. Four postings pinned at four different angles, the way
 * a flyer wall accretes. The grid is deliberately off-register.
 */
export function ZineSheet({ events }) {
  const pins = [
    { deg: -3.4, x: 0, y: 0 },
    { deg: 2.6, x: 1.6, y: 2.4 },
    { deg: 1.8, x: -1.2, y: 1.2 },
    { deg: -2.2, x: 0.8, y: -1.6 },
  ];

  return (
    <>
      <header className="jgz-sheet__head">
        <h2 className="jgz-sheet__title">the wall</h2>
        <p className="jgz-sheet__kicker">
          four of seven. {ZINE_ISSUE.dateline}, {ZINE_ISSUE.city}
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

      <ZineFolio left="the wall" right={`no. ${ZINE_ISSUE.number}`} />
    </>
  );
}

/**
 * 03 — the notice. One event at full weight with the knockout punched through
 * it. The figure is the only large number in the whole issue.
 */
export function ZineNotice({ event, shape = 0 }) {
  return (
    <>
      <header className="jgz-notice__head">
        <span className="jgz-eyebrow">in absentia</span>
        <span className="jgz-eyebrow jgz-eyebrow--right">{ZINE_ISSUE.dateline}</span>
      </header>

      <figure className="jgz-notice__plate">
        <ZinePhoto src={event.cover} alt={event.title} className="jgz-notice__photo" />
        <ZineKnockout shape={shape} />
        <figcaption className="jgz-notice__cut">you, not here</figcaption>
      </figure>

      <div className="jgz-notice__body">
        <h2 className="jgz-notice__title">{event.title}</h2>
        <p className="jgz-notice__host">{event.host}</p>
        <ZineChips when={event.when} where={event.where} />

        <div className="jgz-tally">
          <span className="jgz-tally__value">{event.tally}</span>
          <span className="jgz-tally__label">{event.tallyLabel}</span>
        </div>

        <p className="jgz-notice__note">{event.note}</p>
      </div>

      <ZineFolio left={`no. ${ZINE_ISSUE.number}`} right={ZINE_ISSUE.city} />
    </>
  );
}

/**
 * 04 — the receipt. No photograph anywhere. Space Mono doing the one job the
 * console reserves it for: machine values. The break in the carousel.
 */
export function ZineReceipt() {
  return (
    <div className="jgz-receipt">
      <div className="jgz-receipt__slip">
        <header className="jgz-receipt__head">
          <p className="jgz-receipt__vendor">just go — {ZINE_ISSUE.city}</p>
          <p className="jgz-receipt__doc">
            issue {ZINE_ISSUE.number} · {ZINE_ISSUE.dateline}
          </p>
        </header>

        <ul className="jgz-receipt__lines">
          {ZINE_RECEIPT.lines.map((line) => (
            <li key={line.id}>
              <span className="jgz-receipt__label">{line.label}</span>
              <span className="jgz-receipt__leader" aria-hidden="true" />
              <span className="jgz-receipt__when">{line.when}</span>
            </li>
          ))}
        </ul>

        <dl className="jgz-receipt__totals">
          {ZINE_RECEIPT.totals.map((total) => (
            <div key={total.label}>
              <dt>{total.label}</dt>
              <dd>{total.value}</dd>
            </div>
          ))}
        </dl>

        <p className="jgz-receipt__footer">{ZINE_RECEIPT.footer}</p>
      </div>

      <ZineStamp label="0 attended" tone="ink" deg={-11} className="jgz-receipt__stamp" />
    </div>
  );
}

/**
 * 05 — back cover. The wordmark finally gets its full size, and the burst is
 * the only decoration allowed in the whole issue.
 */
export function ZineBack({ paper }) {
  return (
    <>
      <ZineTicker message="stop finding out on friday" tone="accent" />

      <div className="jgz-back__body">
        <img
          className="jgz-back__wordmark"
          src={paper ? justGoWordmarkDark : justGoWordmark}
          alt="just go"
          draggable={false}
        />
        <img className="jgz-back__burst" src={justGoBurst} alt="" aria-hidden="true" draggable={false} />

        <p className="jgz-back__kicker">{ZINE_CTA.kicker}</p>
        <h2 className="jgz-back__line">{ZINE_CTA.line}</h2>
        <p className="jgz-back__sub">{ZINE_CTA.sub}</p>

        <div className="jgz-back__actions">
          <span className="jgz-cta">{ZINE_CTA.action}</span>
          <img className="jgz-back__badge" src={appStoreBadge} alt="Download on the App Store" />
        </div>
      </div>

      <ZineFolio left={ZINE_CTA.url} right={`no. ${ZINE_ISSUE.number} · end`} />
    </>
  );
}
