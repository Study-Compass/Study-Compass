/**
 * Phase 6 visual matrix: every slide type, both editions, ink-plate on/off,
 * remote images, image overrides, long copy, and the 1080×1350 export surface.
 * Pixel compare against Relay still happens on a real deck; this is the
 * automated floor so a missing frame or viewport drift fails in CI.
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react';
import { ZINE_DEMO_DECK } from './zineDemoDeck';
import { frameClass, resolveSlide } from './zineDeck';
import {
  ZineBack,
  ZineCard,
  ZineCover,
  ZineDispatch,
  ZineNotice,
  ZineReceipt,
  ZineSheet,
} from './zineFrames';

const FRAMES = {
  cover: ZineCover,
  wall: ZineSheet,
  card: ZineCard,
  notice: ZineNotice,
  dispatch: ZineDispatch,
  receipt: ZineReceipt,
  back: ZineBack,
};

const LONG_LINE = 'x'.repeat(72);
const REMOTE = 'https://cdn.example.test/remote-cover.jpg';
const OVERRIDE = 'https://cdn.example.test/override-flier.png';

function representativeDeck() {
  const types = Object.keys(FRAMES);
  const extras = Array.from({ length: Math.max(0, 20 - types.length) }, (_, index) => ({
    type: 'card',
    values: { kicker: LONG_LINE, title: `overflow card ${index + 1}` },
    options: {},
    events: [{
      snapshot: { name: 'late set', image: REMOTE },
      imageOverride: { url: OVERRIDE },
      values: {},
    }],
  }));
  return {
    ...ZINE_DEMO_DECK,
    edition: 'paper',
    inkPlate: true,
    slides: [
      {
        type: 'cover',
        values: { coverLine: LONG_LINE },
        options: {},
        events: [{
          snapshot: { name: 'remote lead', image: REMOTE },
          imageOverride: { url: OVERRIDE },
          values: {},
        }],
      },
      ...types.filter((type) => type !== 'cover').map((type) => (
        ZINE_DEMO_DECK.slides.find((slide) => slide.type === type)
        || { type, values: {}, options: {}, events: [] }
      )),
      ...extras,
    ].slice(0, 20),
  };
}

describe('carousel export visual matrix', () => {
  it('locks the headless surface to 1080×1350', () => {
    const css = fs.readFileSync(path.join(__dirname, 'PivotCarouselFrame.scss'), 'utf8');
    expect(css).toMatch(/width:\s*1080px/);
    expect(css).toMatch(/height:\s*1350px/);
  });

  it('covers every slide type at the export maximum', () => {
    const deck = representativeDeck();
    expect(deck.slides).toHaveLength(20);
    expect(new Set(deck.slides.map((slide) => slide.type))).toEqual(new Set(Object.keys(FRAMES)));
    expect(deck.slides[0].events[0].snapshot.image).toMatch(/^https:/);
    expect(deck.slides[0].events[0].imageOverride.url).toMatch(/^https:/);
    expect(deck.slides[0].values.coverLine).toHaveLength(72);
  });

  it('renders both editions and both ink-plate modes without throwing', () => {
    const deck = representativeDeck();
    const variants = [
      { edition: 'night', inkPlate: true },
      { edition: 'night', inkPlate: false },
      { edition: 'paper', inkPlate: true },
      { edition: 'paper', inkPlate: false },
    ];
    variants.forEach((variant) => {
      const themed = { ...deck, ...variant };
      expect(frameClass(themed)).toContain(`jgz-frame--${variant.edition === 'paper' ? 'paper' : 'night'}`);
      themed.slides.forEach((slide, index) => {
        const Frame = FRAMES[slide.type];
        const resolved = resolveSlide(themed, slide, index, null);
        expect(() => render(<Frame {...resolved.props} />)).not.toThrow();
      });
    });
  });
});
