/**
 * Carousel voice — the static copy layer, served in the copy pack's own shapes.
 *
 * The carousel reuses PivotVoicePage as its editor, so these endpoints answer
 * with exactly what that component expects: a catalog of keys and a layers map
 * of { shipped, platform, tenant, effective }. Only the meaning of the two
 * editable layers differs, and it maps cleanly:
 *
 *   platform layer -> this city's house voice   (pivot_carousel_voice)
 *   tenant   layer -> this deck's own override  (deck.voice.entries)
 *   shipped        -> the manifest default      (zineSlideTypes.js)
 *
 * The catalog is derived from the manifest, so declaring a field with a voice
 * key is the only step needed to make it appear in the panel.
 */

const getGlobalModels = require('./getGlobalModelService');
const { getTenantByKey } = require('./tenantConfigService');
const { isPivotTenant } = require('../utilities/pivotDropSchedule');
const { zineVoiceKeys } = require('../constants/zineSlideTypes');

const VALUE_MAX = 500;

async function requirePivotTenant(req, tenantKey) {
  const key = String(tenantKey || '').trim().toLowerCase();
  if (!key) return { error: 'tenantKey is required.', status: 400 };
  const tenant = await getTenantByKey(req, key);
  if (!tenant) return { error: 'Tenant not found.', status: 404 };
  if (!isPivotTenant(tenant)) {
    return { error: 'Carousels are only available for Pivot city tenants.', status: 403 };
  }
  return { tenantKey: key };
}

/** The panel's catalog. Every row is a plain string — no ICU, no tokens. */
function voiceCatalog() {
  return {
    keys: zineVoiceKeys().map((row) => ({
      path: row.path,
      // Carried through rather than flattened to 'string': the editor keys its
      // interpolator filter and its live preview off these.
      kind: row.kind,
      params: row.params,
      ...(row.sampleArgs ? { sampleArgs: row.sampleArgs } : {}),
      usesTokens: false,
      shipped: row.shipped,
    })),
    tokens: [],
  };
}

async function readCityEntries(req, tenantKey) {
  const { PivotCarouselVoice } = getGlobalModels(req, 'PivotCarouselVoice');
  const doc = await PivotCarouselVoice.findOne({ tenantKey }).lean();
  return doc?.entries || {};
}

async function readDeckEntries(req, tenantKey, deckId) {
  if (!deckId) return {};
  const { PivotCarouselDeck } = getGlobalModels(req, 'PivotCarouselDeck');
  const doc = await PivotCarouselDeck.findOne({ _id: deckId, tenantKey })
    .select('voice')
    .lean();
  return doc?.voice?.entries || {};
}

/**
 * `deckId` is optional: without it the panel is editing the city layer alone
 * and there is no deck override to show above it.
 */
async function getCarouselVoiceLayers(req, tenantKey, deckId) {
  const gate = await requirePivotTenant(req, tenantKey);
  if (gate.error) return gate;

  const [city, deck] = await Promise.all([
    readCityEntries(req, gate.tenantKey),
    readDeckEntries(req, gate.tenantKey, deckId),
  ]);

  const entries = {};
  for (const row of zineVoiceKeys()) {
    const platform = city[row.path] ?? null;
    const tenant = deck[row.path] ?? null;
    entries[row.path] = {
      shipped: row.shipped,
      platform,
      tenant,
      effective: tenant ?? platform ?? row.shipped,
    };
  }

  return { data: { entries, tokens: {} } };
}

function coerceValue(raw) {
  return String(raw == null ? '' : raw).slice(0, VALUE_MAX);
}

/** One key at a time, which is how the editor saves. */
async function patchCarouselVoice(req, tenantKey, { scope, deckId, key, value, reset }) {
  const gate = await requirePivotTenant(req, tenantKey);
  if (gate.error) return gate;

  const known = new Set(zineVoiceKeys().map((row) => row.path));
  const keys = reset ? (Array.isArray(reset) ? reset : [reset]) : [key];
  for (const path of keys) {
    if (!known.has(path)) {
      return { error: `Unknown voice key: ${path}`, status: 400, code: 'UNKNOWN_KEY' };
    }
  }

  if (scope === 'deck') {
    if (!deckId) return { error: 'deckId is required to edit a deck override.', status: 400 };
    const { PivotCarouselDeck } = getGlobalModels(req, 'PivotCarouselDeck');
    const doc = await PivotCarouselDeck.findOne({ _id: deckId, tenantKey: gate.tenantKey });
    if (!doc) return { error: 'Deck not found.', status: 404 };

    const entries = { ...(doc.voice?.entries || {}) };
    if (reset) keys.forEach((path) => delete entries[path]);
    else entries[key] = coerceValue(value);

    doc.voice = { entries, tokens: doc.voice?.tokens || {} };
    doc.markModified('voice');
    await doc.save();
    return { data: { entries, tokens: {} } };
  }

  const { PivotCarouselVoice } = getGlobalModels(req, 'PivotCarouselVoice');
  const doc = (await PivotCarouselVoice.findOne({ tenantKey: gate.tenantKey }))
    || new PivotCarouselVoice({ tenantKey: gate.tenantKey, entries: {} });

  const entries = { ...(doc.entries || {}) };
  if (reset) keys.forEach((path) => delete entries[path]);
  else entries[key] = coerceValue(value);

  doc.entries = entries;
  doc.markModified('entries');
  doc.updatedBy = req.user?.globalUserId || req.user?.userId || null;
  await doc.save();

  return { data: { entries, tokens: {} } };
}

module.exports = { voiceCatalog, getCarouselVoiceLayers, patchCarouselVoice };
