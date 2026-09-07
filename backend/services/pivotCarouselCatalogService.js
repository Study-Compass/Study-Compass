/**
 * Catalog search for the slide picker.
 *
 * A sibling of listPivotLabEvents rather than an extension of it. That one
 * answers a curation question — readiness, intent stats, enrichment gaps,
 * out-of-week counts — for a whole batch week at once. This answers a much
 * smaller one: which published events could fill this slot, and what would the
 * snapshot look like. Keeping them apart means the picker's date range and
 * search cannot perturb the curation page's data source.
 *
 * Published only. A deck reports on what actually ran, so a draft or a rejected
 * listing has no business on a slide.
 */

const { connectToDatabase } = require('../connectionsManager');
const getModels = require('./getModelService');
const { getTenantByKey } = require('./tenantConfigService');
const { isPivotTenant } = require('../utilities/pivotDropSchedule');
const { isValidIsoWeek } = require('../utilities/pivotIsoWeek');

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;

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

/** Escape a user's search string so it cannot act as a regular expression. */
function safeRegex(value) {
  return new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildQuery({ batchWeek, from, to, q }) {
  const query = {
    'customFields.pivot': { $exists: true },
    'customFields.pivot.ingestStatus': 'published',
    isDeleted: { $ne: true },
  };

  if (batchWeek) query['customFields.pivot.batchWeek'] = batchWeek;

  if (from || to) {
    query.start_time = {};
    if (from) query.start_time.$gte = from;
    if (to) query.start_time.$lte = to;
  }

  if (q) {
    const needle = safeRegex(q);
    query.$or = [
      { name: needle },
      { location: needle },
      { 'customFields.pivot.host.name': needle },
      { 'customFields.pivot.tags': needle },
    ];
  }

  return query;
}

/** Exactly what a slide slot needs, and nothing a slide never renders. */
function serializeForSlot(event) {
  const pivot = event.customFields?.pivot || {};
  return {
    _id: String(event._id),
    name: event.name || '',
    host: pivot.host?.name || '',
    startTime: event.start_time || null,
    location: event.location || '',
    image: event.image || null,
    tags: Array.isArray(pivot.tags) ? pivot.tags.slice(0, 6) : [],
    batchWeek: pivot.batchWeek || null,
  };
}

async function searchCarouselCatalog(req, tenantKey, options = {}) {
  const gate = await requirePivotTenant(req, tenantKey);
  if (gate.error) return gate;

  const batchWeek = String(options.batchWeek || '').trim();
  if (batchWeek && !isValidIsoWeek(batchWeek)) {
    return { error: 'batchWeek must be ISO week format YYYY-Www.', status: 400 };
  }

  const limit = Math.min(Math.max(Number(options.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = Math.max(Number(options.skip) || 0, 0);

  const query = buildQuery({
    batchWeek: batchWeek || null,
    from: parseDate(options.from),
    to: parseDate(options.to),
    q: String(options.q || '').trim(),
  });

  const db = await connectToDatabase(gate.tenantKey);
  const { Event } = getModels({ db }, 'Event');

  const [events, total] = await Promise.all([
    Event.find(query)
      .select('name image start_time location customFields.pivot')
      // Most recent first: a deck reports on the nights just gone.
      .sort({ start_time: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments(query),
  ]);

  return {
    data: {
      tenantKey: gate.tenantKey,
      events: events.map(serializeForSlot),
      total,
      skip,
      limit,
      hasMore: skip + events.length < total,
    },
  };
}

module.exports = { searchCarouselCatalog, buildQuery, serializeForSlot, safeRegex };
