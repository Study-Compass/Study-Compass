/**
 * "sorry u missed it" — repeatable 4:5 frame templates.
 *
 * Every frame takes the same four props, resolved by zineDeck.js from a stored
 * deck: `{ issue, values, events, options }`. They hold no data of their own and
 * reach for no module-level constants, which is what lets a new slide type be a
 * manifest entry plus one of these components and nothing else.
 *
 * Only DYNAMIC text is wrapped in <ZineField path=…> — what changes every issue:
 * event names, venues, times, tags, the run of show, the scene, the issue's own
 * number and dateline. The frame declares which slot the run belongs to and the
 * editor turns that element typable in place.
 *
 * STATIC house copy is rendered plainly and is deliberately not typable here.
 * The section slugs, "meanwhile", "you, not here", the receipt footer and the
 * whole back cover read the same in every issue, so they belong to the city's
 * voice rather than to one deck, and they are edited in the voice panel. The
 * manifest is the authority on which is which: a field with a `voice` key is
 * static.
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
import { ZineField, ZineRows } from './zineField';
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

/**
 * Class for type sitting on a photograph. Empty on `auto`, so a deck that never
 * touches this keeps the edition's own behaviour untouched.
 */
function photoTone(options) {
  const tone = options?.photoText;
  return tone === 'light' || tone === 'dark' ? ` jgz-tone--${tone}` : '';
}

/**
 * The issue number where the folio prints it. Editable in place, because the
 * number belongs to the deck rather than the slide — setting it on any slide
 * sets it on all of them, which is the only sane behaviour for a folio.
 * Renders nothing at all when the deck is unnumbered.
 */
function ZineFolioNumber({ issue }) {
  if (!issue?.folio) return null;
  return (
    <>
      {'no. '}
      <ZineField path="issue.number" max={8}>{issue.number}</ZineField>
    </>
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
function ZineChips({ when, where, index = 0 }) {
  return (
    <div className="jgz-chips">
      <ZineField
        as="span"
        className="jgz-chip jgz-chip--when"
        path={`events.${index}.snapshot.whenLabel`}
        max={24}
        placeholder="when"
      >
        {when}
      </ZineField>
      <ZineField
        as="span"
        className="jgz-chip jgz-chip--where"
        path={`events.${index}.snapshot.location`}
        max={48}
        placeholder="where"
      >
        {where}
      </ZineField>
    </div>
  );
}

/**
 * The standing head. A label in the display face with its date trailing in
 * mono, set flush left at reading size — no rule beneath it, no tracked-out
 * caps, and no split to both trims. It reads as a section head, which is what
 * it is, rather than as a band of chrome across the top of the frame.
 */
/*
 * The value is composed by the caller rather than passed as a string, because a
 * single field cannot own two values. Binding "dateline · city" to issue.dateline
 * showed the whole thing when reading and only the dateline when editing — the
 * slide stopped being the slide the moment you tried to change it.
 */
function ZineSlug({ label, className = '', children }) {
  return (
    <p className={`jgz-slug ${className}`}>
      <span className="jgz-slug__label">{label}</span>
      <span className="jgz-slug__value">{children}</span>
    </p>
  );
}

/**
 * How the room worked, in the room's own words. Unfilled and rule-bound so it
 * never competes with the when/where chips, which carry the listing data.
 */
function ZineTags({ tags, limit = 3, path }) {
  return (
    <ul className="jgz-tags">
      {tags.slice(0, limit).map((tag, index) => (
        <ZineField
          as="li"
          key={`${tag}-${index}`}
          path={`${path}.${index}`}
          max={22}
          placeholder="tag"
        >
          {tag}
        </ZineField>
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
export function ZineCover({ issue, values, events, options = {} }) {
  const event = events[0] || {};
  const lead = values.lead || {};
  const tone = photoTone(options);

  return (
    <>
      <ZinePhoto src={event.cover} alt={event.title} className="jgz-cover__photo" />
      <div className={`jgz-cover__wash${tone}`} aria-hidden="true" />

      <header className={`jgz-cover__flag${tone}`}>
        <h2 className="jgz-cover__name">{values.name}</h2>
        <p className="jgz-cover__tagline">
          {values.tagline}
          {issue.folio ? ' · ' : null}
          {issue.folio ? (
            <ZineField path="issue.number" max={8}>{issue.number}</ZineField>
          ) : null}
        </p>
      </header>

      <div className={`jgz-cover__body${tone}`}>
        {options.stamp === false ? null : (
          <ZineStamp label="missed" deg={-9} className="jgz-cover__stamp" />
        )}
        <p className="jgz-cover__eyebrow">{lead.eyebrow}</p>
        <ZineField
          as="h3"
          className="jgz-cover__heading"
          path="values.coverLine"
          max={72}
          fallback={lead.heading}
        >
          {values.coverLine || lead.heading}
        </ZineField>
        <p className="jgz-cover__sub">{lead.sub}</p>
      </div>

      <div className={`jgz-cover__foot${tone}`}>
        {options.photoCredit === false ? null : (
          <p className="jgz-cover__caption">
            {'above: '}
            <ZineField path="events.0.snapshot.name" max={64}>{event.title}</ZineField>
            {', '}
            <ZineField path="events.0.snapshot.location" max={48}>{event.where}</ZineField>
          </p>
        )}
        <ZineFolio left={issue.dateline} right={issue.city} />
      </div>
    </>
  );
}

/**
 * 02 — contact sheet. Four postings pinned at four different angles, the way
 * a flyer wall accretes. The grid is deliberately off-register.
 */
export function ZineSheet({ issue, values, events, options = {} }) {
  const full = options.detail === 'full';

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
          <ZineField path="values.kicker" max={48}>{values.kicker}</ZineField>
          {'. '}
          <ZineField path="issue.dateline" max={32}>{issue.dateline}</ZineField>
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
                <ZineField
                  as="h3"
                  className="jgz-posting__title"
                  path={`events.${index}.snapshot.name`}
                  max={64}
                >
                  {event.title}
                </ZineField>
                <p className="jgz-posting__meta">
                  <ZineField path={`events.${index}.snapshot.whenLabel`} max={24}>
                    {event.when}
                  </ZineField>
                  {full ? ' — ' : null}
                  {full ? (
                    <ZineField path={`events.${index}.snapshot.location`} max={48}>
                      {event.where}
                    </ZineField>
                  ) : null}
                </p>
                {full ? (
                  <ZineTags tags={event.tags} limit={2} path={`events.${index}.values.tags`} />
                ) : null}
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
export function ZineCard({ issue, values, events, options = {} }) {
  const event = events[0] || {};
  const tone = photoTone(options);

  return (
    <>
      <ZinePhoto src={event.cover} alt={event.title} className="jgz-card__photo" />
      <div className={`jgz-card__scrim${tone}`} aria-hidden="true" />

      <ZineSlug label={values.slug} className={`jgz-card__slug${tone}`}>
        <ZineField path="issue.dateline" max={32}>{issue.dateline}</ZineField>
        {' · '}
        <ZineField path="issue.city" max={40}>{issue.city}</ZineField>
      </ZineSlug>

      <article className="jgz-card__plate">
        <ZineField as="h2" className="jgz-card__title" path="events.0.snapshot.name" max={64}>
          {event.title}
        </ZineField>
        <ZineField as="p" className="jgz-card__host" path="events.0.snapshot.host" max={48}>
          {event.host}
        </ZineField>
        <ZineChips when={event.when} where={event.where} />
        <ZineTags tags={event.tags} path="events.0.values.tags" />
        <ZineField as="p" className="jgz-card__note" path="events.0.values.note" max={84}>
          {event.note}
        </ZineField>
        {options.stamp === false ? null : (
          <ZineStamp label="missed" deg={-8} className="jgz-card__stamp" />
        )}
      </article>

      <ZineFolio left={<ZineFolioNumber issue={issue} />} right="the card" />
    </>
  );
}

/**
 * 04 — the notice. One event at full weight with the knockout punched through
 * it. With no figure competing, the photograph carries the frame.
 */
export function ZineNotice({ issue, values, events, options = {} }) {
  const event = events[0] || {};
  const shape = options.knockoutShape || 0;
  const tone = photoTone(options);

  return (
    <>
      <ZineSlug label={values.slug} className="jgz-notice__slug">
        <ZineField path="issue.dateline" max={32}>{issue.dateline}</ZineField>
      </ZineSlug>

      <figure className="jgz-notice__plate">
        <ZinePhoto src={event.cover} alt={event.title} className="jgz-notice__photo" />
        <ZineKnockout shape={shape} />
        <figcaption className={`jgz-notice__cut${tone}`}>{values.cut}</figcaption>
      </figure>

      <div className="jgz-notice__body">
        <ZineField as="h2" className="jgz-notice__title" path="events.0.snapshot.name" max={64}>
          {event.title}
        </ZineField>
        <ZineField as="p" className="jgz-notice__host" path="events.0.snapshot.host" max={48}>
          {event.host}
        </ZineField>
        <ZineChips when={event.when} where={event.where} />
        <ZineTags tags={event.tags} path="events.0.values.tags" />
        <ZineField as="p" className="jgz-notice__note" path="events.0.values.note" max={84}>
          {event.note}
        </ZineField>
      </div>

      <ZineFolio left={<ZineFolioNumber issue={issue} />} right={issue.city} />
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
      <ZineSlug label={values.slug} className="jgz-dispatch__slug">
        <ZineField path="issue.dateline" max={32}>{issue.dateline}</ZineField>
      </ZineSlug>

      <div className="jgz-dispatch__lede">
        <div className="jgz-dispatch__thumb">
          <ZinePhoto src={event.cover} alt={event.title} />
        </div>
        <div>
          <ZineField as="h2" className="jgz-dispatch__title" path="events.0.snapshot.name" max={64}>
            {event.title}
          </ZineField>
          <p className="jgz-dispatch__venue">
            <ZineField path="events.0.snapshot.location" max={48}>{event.where}</ZineField>
            {' · '}
            <ZineField path="events.0.snapshot.whenLabel" max={24}>{event.when}</ZineField>
          </p>
          <ZineTags tags={event.tags} path="events.0.values.tags" />
        </div>
      </div>

      {/* A run of show is a real sequence, so it is the one place numbering earns itself. */}
      <ol className="jgz-run">
        <ZineRows path="events.0.values.runOfShow" rows={event.runOfShow} max={4}
          render={(step, index, drop) => (
            <li key={`run-${index}`}>
              <ZineField
                as="span"
                className="jgz-run__time"
                path={`events.0.values.runOfShow.${index}.t`}
                max={8}
                placeholder="00:00"
              >
                {step.t}
              </ZineField>
              <ZineField
                as="span"
                className="jgz-run__what"
                path={`events.0.values.runOfShow.${index}.what`}
                max={64}
                placeholder="what turned"
              >
                {step.what}
              </ZineField>
              {drop}
            </li>
          )}
        />
      </ol>

      <ZineField
        as="p"
        className="jgz-dispatch__scene"
        path="events.0.values.scene"
        max={300}
        placeholder="what it sounded and smelled like"
      >
        {event.scene}
      </ZineField>

      <p className="jgz-dispatch__instead">
        <span>{values.insteadLabel}</span>
        <ZineField
          as="span"
          className="jgz-dispatch__insteadText"
          path="events.0.values.instead"
          max={80}
          placeholder="what you were doing at that hour"
        >
          {event.instead}
        </ZineField>
      </p>

      <ZineFolio left={<ZineFolioNumber issue={issue} />} right={values.slug} />
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
          <p className="jgz-receipt__vendor">
            {'just go — '}
            <ZineField path="issue.city" max={40}>{issue.city}</ZineField>
          </p>
          <p className="jgz-receipt__doc">
            {issue.folio ? `${issue.folio} · ` : ''}{issue.dateline}
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

      <ZineFolio left={values.url} right={issue.folio ? `${issue.folio} · end` : 'end'} />
    </>
  );
}
