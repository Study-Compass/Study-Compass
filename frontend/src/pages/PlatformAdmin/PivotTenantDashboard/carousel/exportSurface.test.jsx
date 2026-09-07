/**
 * Nothing may paint over the export surface.
 *
 * The render script screenshots a viewport, so anything the app mounts globally
 * lands in the image — and a fresh headless profile misses every "you have
 * already seen this" flag that normally hides such things. The first export ran
 * ten slides of a rebranding interstitial for exactly that reason.
 */

import React from 'react';
import { render } from '@testing-library/react';
import RebrandingNotice from '../../../../components/RebrandingNotice/RebrandingNotice';
import DevTenantSelector from '../../../../components/DevTenantSelector/DevTenantSelector';

const at = (path) => window.history.pushState({}, '', path);

describe('global overlays stay off the export route', () => {
  afterEach(() => {
    at('/');
    localStorage.clear();
  });

  test('the rebranding notice renders nothing there', () => {
    at('/carousel-export/deck123/2');
    const { container } = render(<RebrandingNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  test('the dev tenant badge renders nothing there', () => {
    at('/carousel-export/deck123/2');
    const { container } = render(<DevTenantSelector />);
    expect(container).toBeEmptyDOMElement();
  });

  test('the notice does not fire on localhost, where the script runs', () => {
    at('/platform-admin/pivot/oakland');
    const { container } = render(<RebrandingNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  /*
   * The reason localhost cannot be trusted to suppress it: the flag lives in
   * localStorage, and every headless run starts without one.
   */
  test('a fresh profile has no dismissal flag', () => {
    expect(localStorage.getItem('hasSeenRebrandingNotice')).toBeNull();
  });

  test('the notice is still reachable on purpose', () => {
    at('/?test-rebranding=true');
    const { container } = render(<RebrandingNotice />);
    expect(container).not.toBeEmptyDOMElement();
  });
});
