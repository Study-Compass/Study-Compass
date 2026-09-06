/**
 * /justgo/zine — "sorry u missed it" concept deck.
 *
 * A light table of repeatable 4:5 Instagram frames in the Just Go zine
 * register: the avant-garde end of the design language, where the cut-paper
 * vocabulary is spent loudly because nothing here has to be operated.
 *
 * Concept surface only. Not linked from any product navigation, not part of
 * the public landing, and it introduces no brand vocabulary that does not
 * already exist in pivotTheme.ts / JustGoLanding.scss.
 */

import React, { useEffect, useState } from 'react';
import { ZINE_EVENTS, ZINE_ISSUE } from './justGoZineData';
import {
  ZineBack,
  ZineCover,
  ZineNotice,
  ZineReceipt,
  ZineSheet,
} from './justGoZineFrames';
import './JustGoZine.scss';

const EDITIONS = [
  { key: 'night', label: 'night press' },
  { key: 'paper', label: 'newsprint' },
];

/** Each entry is a template, not a one-off: same markup, next issue's records. */
const FRAMES = [
  {
    key: 'cover',
    name: '01 · cover',
    note: 'masthead + last night’s lead photo',
    render: () => <ZineCover event={ZINE_EVENTS[0]} />,
  },
  {
    key: 'wall',
    name: '02 · the wall',
    note: 'four postings, struck through',
    render: () => <ZineSheet events={ZINE_EVENTS.slice(1)} />,
  },
  {
    key: 'notice',
    name: '03 · the notice',
    note: 'one event, one knockout, one figure',
    render: () => <ZineNotice event={ZINE_EVENTS[0]} shape={1} />,
  },
  {
    key: 'notice-alt',
    name: '03 · the notice (repeat)',
    note: 'same template, different record',
    render: () => <ZineNotice event={ZINE_EVENTS[3]} shape={2} />,
  },
  {
    key: 'receipt',
    name: '04 · the receipt',
    note: 'the whole issue, in figures',
    render: () => <ZineReceipt />,
  },
  {
    key: 'back',
    name: '05 · back cover',
    note: 'the only decorated frame',
    render: (edition) => <ZineBack paper={edition === 'paper'} />,
  },
];

const SPEC = [
  {
    term: 'palette',
    detail:
      'warm night #15120F / cream #FAF6EF / ink #1A1714, accent #FF4F1F, pops #4AB5FF #FFD23F #FF2A2A. No value here is new — the zine only spends them louder than the app allows.',
  },
  {
    term: 'type',
    detail:
      'Les Flos Sans for the masthead only. Instrument Sans 700 for titles and the CTA. Space Mono for every machine value — times, folios, figures, the whole receipt.',
  },
  {
    term: 'tilt budget',
    detail:
      'The app caps irregularity at 1.5°. The zine raises it to 8° on postings and 12° on stamps, and never applies it to a paragraph or a metadata rule.',
  },
  {
    term: 'the knockout',
    detail:
      'A hand-cut hole punched through the poster, ink-stroked on the inside edge. It is the reader’s absence made literal, and it is the one device the issue is built around.',
  },
  {
    term: 'the stamp',
    detail:
      'The creator console’s curation stamp, re-pointed from a verdict on a listing to a verdict on your night. Mono uppercase, double rule via outline offset.',
  },
  {
    term: 'newsprint plate',
    detail:
      'The paper edition prints photographs as one misregistered ink plate. The offset is a riso artifact, not a filter — it is why the edition reads as printed rather than themed.',
  },
  {
    term: 'export',
    detail:
      'Frames are pure `cqw`, so the same markup renders at 1080×1350 for export and at gallery size here with no drift. Screenshot a frame at 1080 wide and it is post-ready.',
  },
  {
    term: 'voice',
    detail:
      'Lowercase, second person, past tense, deadpan. The copy never apologises and never sells — it reports what happened and lets the absence do the work.',
  },
];

export default function JustGoZine() {
  const [edition, setEdition] = useState('night');

  useEffect(() => {
    const previous = document.title;
    document.title = 'sorry u missed it — just go zine';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="jgz">
      <header className="jgz__masthead">
        <div>
          <h1 className="jgz__title">sorry u missed it</h1>
          <p className="jgz__standfirst">
            A repeatable instagram carousel for issue no. {ZINE_ISSUE.number},{' '}
            {ZINE_ISSUE.dateline} in {ZINE_ISSUE.city}. Every frame reports on an event that
            already happened — the argument for the app is the reader’s own absence, never a
            feature list.
          </p>
        </div>

        <div className="jgz__controls">
          <div className="jgz__switch" role="group" aria-label="Edition">
            {EDITIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={edition === option.key}
                onClick={() => setEdition(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="jgz__note">4:5 · 1080×1350</span>
        </div>
      </header>

      <ul className="jgz__sheet">
        {FRAMES.map((frame) => (
          <li className="jgz__slot" key={frame.key}>
            <div className={`jgz-frame jgz-frame--${edition}`}>{frame.render(edition)}</div>
            <p className="jgz__slot-caption">
              <b>{frame.name}</b>
              <span>{frame.note}</span>
            </p>
          </li>
        ))}
      </ul>

      <section className="jgz__spec">
        <h2>register rules</h2>
        <dl>
          {SPEC.map((item) => (
            <div key={item.term}>
              <dt>{item.term}</dt>
              <dd>{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
