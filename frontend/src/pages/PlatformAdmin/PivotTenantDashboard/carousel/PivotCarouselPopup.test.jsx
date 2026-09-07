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
