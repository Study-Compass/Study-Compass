/**
 * Portal styling guard.
 *
 * Popup renders into document.body, and CSS custom properties inherit down the
 * DOM tree rather than the React tree. A `var(--jgz-…)` in popup content sits
 * outside `.jgz` and resolves to nothing — silently, with no error anywhere.
 * These read the stylesheet because that failure has no runtime signal.
 */

import fs from 'fs';
import path from 'path';

const popupCss = fs.readFileSync(path.join(__dirname, 'PivotCarouselPopup.scss'), 'utf8');
const popupJsx = fs.readFileSync(path.join(__dirname, 'PivotCarouselPopup.jsx'), 'utf8');
const pageCss = fs.readFileSync(path.join(__dirname, 'PivotCarouselPage.scss'), 'utf8');

describe('popup styles survive the portal', () => {
  test('no popup rule reads a token declared on .jgz', () => {
    const reached = popupCss.match(/var\(--jgz-[a-z-]+/g) || [];
    expect(reached).toEqual([]);
  });

  test('the portal root re-declares the ops token scope', () => {
    expect(popupJsx).toMatch(/className="pivot-ops/);
  });

  test('the token wrapper does not become a layout box', () => {
    expect(popupCss).toMatch(/\.jgz-popup__body\s*\{[^}]*display:\s*contents/);
  });

  test('popup styles live with the popup, not on the page', () => {
    expect(popupCss).toMatch(/\.jgz-picker\b/);
    expect(popupCss).toMatch(/\.jgz-voice\b/);
    expect(pageCss).not.toMatch(/\.jgz-picker\b/);
  });

  test('the page keeps the styles that render inside .jgz', () => {
    expect(pageCss).toMatch(/\.jgz-editor__slots\b/);
    expect(pageCss).toMatch(/\.jgz-editable\b/);
  });
});

/**
 * The edit affordance must cost no layout. A box property on `.jgz-editable`
 * overrides whatever padding the template had already set on that same element,
 * and the slide silently reflows the moment editing is switched on — which is
 * the one thing an edit mode may not do.
 */
describe('the edit affordance is layout-neutral', () => {
  const block = (() => {
    const start = pageCss.indexOf('.jgz-editable {');
    // Scan from the opening brace, not the selector, or depth never rises.
    let i = pageCss.indexOf('{', start);
    let depth = 0;
    do {
      if (pageCss[i] === '{') depth += 1;
      else if (pageCss[i] === '}') depth -= 1;
      i += 1;
    } while (depth > 0 && i < pageCss.length);
    return pageCss.slice(start, i);
  })();

  // Everything inside ::before is the tint's own box, not the slot's.
  const ownDeclarations = block.slice(0, block.indexOf('&::before'));

  test.each([
    'margin', 'padding', 'border', 'width', 'height',
    'font-size', 'line-height', 'display',
  ])('the slot itself declares no %s', (prop) => {
    expect(ownDeclarations).not.toMatch(new RegExp(`(^|[;{\\s])${prop}\\s*:`, 'm'));
  });

  test('the tint is drawn by a pseudo-element that bleeds outward', () => {
    expect(block).toMatch(/&::before/);
    expect(block).toMatch(/inset:\s*-[\d.]+cqw\s+calc\(var\(--jgz-slot-bleed\)\s*\*\s*-1\)/);
  });

  test('containers whose padding differs from the trim set their own bleed', () => {
    for (const sel of ['.jgz-posting__plate', '.jgz-card__plate', '.jgz-dispatch__instead']) {
      expect(pageCss).toMatch(new RegExp(`\\${sel}\\s*\\{[^}]*--jgz-slot-bleed`));
    }
  });
});

/**
 * The placeholder has to be driven by :empty, not by a class React computes.
 * The field commits on blur and does not re-render while focused, so a class
 * set at render time survives the first keystroke and the placeholder sits
 * there while typed text piles up beside it.
 */
describe('the slot placeholder', () => {
  test('is selected by :empty rather than by a rendered class', () => {
    expect(pageCss).toMatch(/\.jgz-editable:empty::after/);
    expect(pageCss).not.toMatch(/\.jgz-editable--empty::(before|after)/);
  });

  test('does not sit on ::before, which the tint owns', () => {
    // Source SCSS, so the tint's rule is written nested as `&::before`.
    expect(pageCss).toMatch(/&::before/);
    expect(pageCss).not.toMatch(/\.jgz-editable:empty::before/);
  });

  test('cannot swallow a click meant for the field', () => {
    const rule = pageCss.slice(pageCss.indexOf('.jgz-editable:empty::after'));
    expect(rule.slice(0, rule.indexOf('}'))).toMatch(/pointer-events:\s*none/);
  });
});

/**
 * A frame must carry its own palette. Export mounts one slide alone, outside
 * the light table, so anything declared only on `.jgz` resolves to nothing
 * there — a cover set in the fallback face, an accent that is not orange.
 */
describe('a frame is self-sufficient', () => {
  const sharedBlock = (() => {
    const start = pageCss.indexOf('.jgz,\n.jgz-frame {');
    return pageCss.slice(start, pageCss.indexOf('}', start));
  })();

  test('the palette and faces are declared on the frame, not only on the table', () => {
    for (const token of [
      '--jgz-ink', '--jgz-cream', '--jgz-accent', '--jgz-blue',
      '--jgz-pop', '--jgz-burst',
      '--jgz-font-display', '--jgz-font-mono', '--jgz-font-flos',
    ]) {
      expect(sharedBlock).toContain(token);
    }
  });

  test('the export surface is exactly 1080x1350 with nothing around it', () => {
    const frameCss = fs.readFileSync(path.join(__dirname, 'PivotCarouselFrame.scss'), 'utf8');
    expect(frameCss).toMatch(/width:\s*1080px/);
    expect(frameCss).toMatch(/height:\s*1350px/);
    expect(frameCss).toMatch(/overflow:\s*hidden/);
  });

  test('the table edge treatment stays on the table, out of the export', () => {
    // Scoped `.jgz .jgz-frame`, so a frame mounted alone gets no border.
    expect(pageCss).toMatch(/\.jgz \.jgz-frame \{/);
    const frameCss = fs.readFileSync(path.join(__dirname, 'PivotCarouselFrame.scss'), 'utf8');
    expect(frameCss).not.toMatch(/box-shadow[^;]*rgba\(26, 23, 20/);
  });
});
