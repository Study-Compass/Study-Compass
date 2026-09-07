/**
 * The www path lock exists twice: once in Express, which redirects a document
 * request before React loads, and once in the client, which redirects after it
 * does. A path allowed by one and not the other fails in a way that looks like
 * a routing bug rather than a policy one — and for the carousel export it fails
 * by screenshotting an institution picker.
 */

const fs = require('node:fs');
const path = require('node:path');

const serverSource = fs.readFileSync(
  path.join(__dirname, '../../app.js'),
  'utf8',
);
const clientSource = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/config/tenantRedirect.js'),
  'utf8',
);

function listBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  const body = source
    .slice(start, end)
    // Comments first: an apostrophe in prose pairs with the next real quote and
    // shifts every entry after it by one.
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  return [...body.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

const serverPaths = listBetween(serverSource, 'wwwAllowedPathPrefixes = [', '];');
const clientPaths = listBetween(clientSource, 'WWW_ALLOWED_PATHS = [', '];');

describe('the www path lock', () => {
  test('both halves were found', () => {
    expect(serverPaths.length).toBeGreaterThan(5);
    expect(clientPaths.length).toBeGreaterThan(5);
  });

  test('the carousel export route is allowed by the server', () => {
    expect(serverPaths).toContain('/carousel-export');
  });

  test('the carousel export route is allowed by the client', () => {
    expect(clientPaths).toContain('/carousel-export');
  });

  /*
   * Not a full equality check: the client allows landing paths Express never
   * sees, and Express allows API prefixes the client never routes. Only the
   * paths that render a page have to agree, and the export route is one.
   */
  test('every path the server allows that renders a page is allowed by the client', () => {
    const pageRendering = ['/platform-admin', '/justgo', '/login', '/carousel-export'];
    for (const route of pageRendering) {
      if (!serverPaths.includes(route)) continue;
      expect(clientPaths).toContain(route);
    }
  });
});
