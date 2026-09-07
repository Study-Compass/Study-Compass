/**
 * The export token is the one carousel surface reachable without a session, so
 * what it refuses matters more than what it allows.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-export-tokens';

const jwt = require('jsonwebtoken');
const { readDeckForExport, PURPOSE } = require('../../services/pivotCarouselExportService');

const DECK = '507f1f77bcf86cd799439011';
const OTHER = '507f1f77bcf86cd799439099';

const sign = (claims, options) => jwt.sign(claims, process.env.JWT_SECRET, options);
const valid = () => sign({ purpose: PURPOSE, tenantKey: 'oakland', deckId: DECK }, { expiresIn: '10m' });

describe('what an export token refuses', () => {
  test('no token at all', async () => {
    const result = await readDeckForExport({}, undefined, DECK);
    expect(result.status).toBe(401);
    expect(result.code).toBe('TOKEN_REQUIRED');
  });

  test('a token signed with another secret', async () => {
    const forged = jwt.sign({ purpose: PURPOSE, tenantKey: 'oakland', deckId: DECK }, 'not-the-secret');
    const result = await readDeckForExport({}, forged, DECK);
    expect(result.status).toBe(401);
    expect(result.code).toBe('TOKEN_INVALID');
  });

  test('an expired token', async () => {
    const stale = sign({ purpose: PURPOSE, tenantKey: 'oakland', deckId: DECK }, { expiresIn: '-1s' });
    const result = await readDeckForExport({}, stale, DECK);
    expect(result.status).toBe(401);
    expect(result.code).toBe('TOKEN_INVALID');
  });

  /* An ordinary session token is signed with the same secret, so purpose is
     what stops it being used here. */
  test('a session access token, which is signed with the same secret', async () => {
    const session = sign({ globalUserId: 'u1', roles: ['admin'] }, { expiresIn: '10m' });
    const result = await readDeckForExport({}, session, DECK);
    expect(result.status).toBe(403);
    expect(result.code).toBe('TOKEN_WRONG_PURPOSE');
  });

  test('a valid token pointed at a different deck', async () => {
    const result = await readDeckForExport({}, valid(), OTHER);
    expect(result.status).toBe(403);
    expect(result.code).toBe('TOKEN_WRONG_DECK');
  });

  test('the deck it is for is read from the token, not from the caller', async () => {
    // Reaching the model lookup means every gate above it passed.
    await expect(readDeckForExport({}, valid(), DECK)).rejects.toThrow(/globalDb/);
  });
});

describe('the token itself', () => {
  test('carries only a purpose, a tenant and a deck', () => {
    const claims = jwt.decode(valid());
    expect(Object.keys(claims).sort()).toEqual(['deckId', 'exp', 'iat', 'purpose', 'tenantKey']);
  });

  test('expires in minutes, not hours', () => {
    const claims = jwt.decode(valid());
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(600);
  });
});
