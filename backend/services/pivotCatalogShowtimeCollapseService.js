const mongoose = require('mongoose');
const getModels = require('./getModelService');
const { connectToDatabase } = require('../connectionsManager');
const { resolvePivotTenant } = require('./pivotIngestPublishService');
const { serializeLabEvent } = require('./pivotLabEventsService');
const { deletePivotCatalogEventsWithModels } = require('./pivotCatalogPurgeService');
const { unionHostIdentities } = require('../utilities/pivotHostIdentity');
const { uniqueOrganizerIds } = require('./pivotOrganizerResolveService');
const {
  unionPivotTimeSlots,
  slotFromStart,
  resolveEventEarliestStart,
  resolveEventLatestEnd,
} = require('../utilities/pivotTimeSlots');
const { scoreEventSimilarity } = require('../utilities/pivotEventSimilarityUtils');

const INGEST_RANK = Object.freeze({
  published: 3,
  staged: 2,
  draft: 1,
});

const INTENT_RANK = Object.freeze({
  registered: 2,
  interested: 1,
  passed: 0,
});

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function pickRicherText(left, right) {
  const a = trimString(left);
  const b = trimString(right);
  if (!a) return b || '';
  if (!b) return a;
  return b.length > a.length ? b : a;
}

/*
 * Distinctness thresholds for the manual path only.
 *
 * Ingest refuses to merge things it is not sure about, because nobody is
 * watching. A person selecting rows has looked at them, so nothing here blocks
 * — these decide what to say out loud before the work is done. Rolling two
 * unrelated listings together is allowed; it just should not be silent.
 */
const DISTINCT = Object.freeze({
  title: 0.45,
  venue: 0.4,
  spanDays: 14,
});

const MS_PER_DAY = 86_400_000;

/*
 * Two levels, and the difference matters.
 *
 * `warning` is the one that was asked for: these listings do not look like the
 * same thing. It is still allowed — a person may know better than a similarity
 * score — but it has to be acknowledged, so nobody rolls two unrelated events
 * together without being told.
 *
 * `notice` is everything else worth saying and nothing to argue with. Spanning
 * catalog weeks is a supported roll-up, not a mistake, and warning about it
 * would only train people to click through warnings.
 */
function warn(code, message) {
  return { code, level: 'warning', message };
}

function notice(code, message) {
  return { code, level: 'notice', message };
}

/** What is odd about this collapse, in the order a person would notice it. */
function collapseWarnings(survivor, absorbed, slots) {
  const warnings = [];

  for (const event of absorbed) {
    const scored = scoreEventSimilarity(survivor, event);
    if (scored.title < DISTINCT.title) {
      warnings.push(warn(
        'distinct-title',
        `“${event.name}” does not read like the same listing as “${survivor.name}”.`,
      ));
    }
    if (
      trimString(event.location)
      && trimString(survivor.location)
      && scored.venue < DISTINCT.venue
    ) {
      warnings.push(warn(
        'distinct-venue',
        `“${event.name}” is at ${event.location}, not ${survivor.location}.`,
      ));
    }
  }

  const weeks = new Set(
    [survivor, ...absorbed]
      .map((event) => event.customFields?.pivot?.batchWeek)
      .filter(Boolean),
  );
  if (weeks.size > 1) {
    warnings.push(notice(
      'mixed-weeks',
      `These span ${weeks.size} catalog weeks; the roll-up will sit in the earliest.`,
    ));
  }

  if (slots.length < 2) {
    warnings.push(notice(
      'single-showtime',
      'These start at the same minute, so the result has one showtime — this is a merge, not a roll-up.',
    ));
  }

  if (slots.length >= 2) {
    const span = (slots[slots.length - 1].start_time - slots[0].start_time) / MS_PER_DAY;
    if (span > DISTINCT.spanDays) {
      warnings.push(notice(
        'wide-span',
        `The showtimes span ${Math.round(span)} days.`,
      ));
    }
  }

  return warnings;
}

function normalizeEventIds(raw) {
  if (!Array.isArray(raw) || raw.length < 2) {
    return {
      error: 'Select at least two catalog events to collapse into showtimes.',
      status: 400,
      code: 'EVENT_IDS_REQUIRED',
    };
  }

  const eventIds = [];
  const seen = new Set();
  for (const value of raw) {
    const id = String(value || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        error: `Invalid eventId: ${id || '(empty)'}`,
        status: 400,
        code: 'INVALID_EVENT_IDS',
      };
    }
    if (seen.has(id)) continue;
    seen.add(id);
    eventIds.push(new mongoose.Types.ObjectId(id));
  }

  if (eventIds.length < 2) {
    return {
      error: 'Select at least two distinct catalog events to collapse into showtimes.',
      status: 400,
      code: 'EVENT_IDS_REQUIRED',
    };
  }

  return { eventIds };
}

function ingestRank(event) {
  return INGEST_RANK[event?.customFields?.pivot?.ingestStatus] || 0;
}

function slotsFromCatalogEvent(event) {
  const pivot = event?.customFields?.pivot || {};
  return unionPivotTimeSlots(
    pivot.timeSlots,
    [slotFromStart(event?.start_time, event?.end_time)],
  );
}

function pickSurvivorEvent(events, keepEventId) {
  if (keepEventId) {
    const preferred = events.find((event) => String(event._id) === String(keepEventId));
    if (preferred) return preferred;
  }

  return [...events].sort((left, right) => {
    const byStatus = ingestRank(right) - ingestRank(left);
    if (byStatus) return byStatus;
    const bySlots = slotsFromCatalogEvent(right).length - slotsFromCatalogEvent(left).length;
    if (bySlots) return bySlots;
    const leftStart = left.start_time ? new Date(left.start_time).getTime() : 0;
    const rightStart = right.start_time ? new Date(right.start_time).getTime() : 0;
    return leftStart - rightStart;
  })[0];
}

function serializeStoredSlots(slots) {
  return slots.map((slot) => ({
    id: slot.id,
    start_time: slot.start_time,
    ...(slot.end_time ? { end_time: slot.end_time } : {}),
    ...(slot.label ? { label: slot.label } : {}),
  }));
}

/**
 * Everything the collapse will produce, computed without writing anything.
 *
 * Preview renders this and execute applies it, so the two cannot describe
 * different outcomes — the whole point of showing someone a result before they
 * agree to it is that the result is the one they get.
 */
function planCollapse(events, keepEventId) {
  const survivor = pickSurvivorEvent(events, keepEventId);
  const absorbed = events.filter((event) => String(event._id) !== String(survivor._id));
  const slots = unionPivotTimeSlots(...events.map((event) => slotsFromCatalogEvent(event)));

  const pivot = { ...(survivor.customFields?.pivot || {}) };
  const host = { ...(pivot.host || {}) };
  host.name = events.reduce(
    (best, event) => pickRicherText(best, event.customFields?.pivot?.host?.name),
    host.name,
  );
  host.imageUrl = host.imageUrl
    || events.find((event) => event.customFields?.pivot?.host?.imageUrl)?.customFields.pivot.host.imageUrl;
  host.profileUrl = host.profileUrl
    || events.find((event) => event.customFields?.pivot?.host?.profileUrl)?.customFields.pivot.host.profileUrl;
  host.identities = unionHostIdentities(
    ...events.map((event) => event.customFields?.pivot?.host?.identities),
  );
  const organizerIds = uniqueOrganizerIds(
    ...events.map((event) => event.customFields?.pivot?.host?.organizerIds),
  );
  if (organizerIds.length) host.organizerIds = organizerIds;

  // The roll-up sits in the week of whichever night came first.
  const earliestEvent = [...events].sort((left, right) => {
    const leftStart = left.start_time ? new Date(left.start_time).getTime() : Infinity;
    const rightStart = right.start_time ? new Date(right.start_time).getTime() : Infinity;
    return leftStart - rightStart;
  })[0];

  pivot.host = host;
  pivot.batchWeek = earliestEvent?.customFields?.pivot?.batchWeek || pivot.batchWeek;
  pivot.timeSlots = serializeStoredSlots(slots);
  pivot.tags = [...new Set(events.flatMap((event) => event.customFields?.pivot?.tags || []))];
  pivot.duplicateRollup = {
    kind: 'showtime',
    count: events.length,
    collapsedEventIds: absorbed.map((event) => String(event._id)),
  };

  return {
    survivor,
    absorbed,
    slots,
    pivot,
    name: survivor.name,
    start_time: resolveEventEarliestStart({ timeSlots: slots }, survivor.start_time) || survivor.start_time,
    end_time: resolveEventLatestEnd({ timeSlots: slots }, survivor.end_time) || survivor.end_time,
    description: events.reduce((best, event) => pickRicherText(best, event.description), ''),
    location: events.reduce((best, event) => pickRicherText(best, event.location), ''),
    image: survivor.image || events.find((event) => event.image)?.image || null,
    warnings: collapseWarnings(survivor, absorbed, slots),
  };
}

/** The plan as the review screen needs it: no documents, just the outcome. */
function serializePlan(plan, intentCounts) {
  return {
    survivor: {
      _id: String(plan.survivor._id),
      name: plan.survivor.name,
      ingestStatus: plan.survivor.customFields?.pivot?.ingestStatus || null,
    },
    absorbed: plan.absorbed.map((event) => ({
      _id: String(event._id),
      name: event.name,
      start_time: event.start_time,
      location: event.location || '',
    })),
    result: {
      name: plan.name,
      start_time: plan.start_time,
      end_time: plan.end_time,
      location: plan.location,
      description: plan.description,
      image: plan.image,
      tags: plan.pivot.tags || [],
      host: plan.pivot.host?.name || '',
      batchWeek: plan.pivot.batchWeek || null,
      showtimes: serializeStoredSlots(plan.slots),
    },
    warnings: plan.warnings,
    deletes: plan.absorbed.length,
    ...(intentCounts ? { intents: intentCounts } : {}),
  };
}

async function migrateAbsorbedIntents(PivotEventIntent, survivorId, absorbed, slotIdByEventId) {
  if (!PivotEventIntent) return { migrated: 0, merged: 0 };

  const absorbedIds = absorbed.map((event) => event._id);
  const intents = await PivotEventIntent.find({ eventId: { $in: absorbedIds } });
  let migrated = 0;
  let merged = 0;

  for (const intent of intents) {
    const slotId = trimString(intent.timeSlotId) || slotIdByEventId.get(String(intent.eventId)) || null;
    const existing = await PivotEventIntent.findOne({
      userId: intent.userId,
      eventId: survivorId,
    });

    if (existing) {
      const keepExisting = (INTENT_RANK[existing.status] || 0) >= (INTENT_RANK[intent.status] || 0);
      if (!keepExisting) existing.status = intent.status;
      if (!existing.timeSlotId && slotId) existing.timeSlotId = slotId;
      existing.externalOpenCount = (existing.externalOpenCount || 0) + (intent.externalOpenCount || 0);
      if (
        intent.externalOpenAt &&
        (!existing.externalOpenAt || intent.externalOpenAt > existing.externalOpenAt)
      ) {
        existing.externalOpenAt = intent.externalOpenAt;
      }
      await existing.save();
      await intent.deleteOne();
      merged += 1;
      continue;
    }

    intent.eventId = survivorId;
    if (!intent.timeSlotId && slotId) intent.timeSlotId = slotId;
    await intent.save();
    migrated += 1;
  }

  return { migrated, merged };
}

/**
 * Fold selected catalog rows into one event with `customFields.pivot.timeSlots`.
 * Extra rows are deleted after intents are pointed at the survivor.
 */
async function loadSelection(req, options) {
  const idsResult = normalizeEventIds(options.eventIds);
  if (idsResult.error) return idsResult;

  const tenantResult = await resolvePivotTenant(req, options.tenantKey);
  if (tenantResult.error) return tenantResult;

  const tenantKey = tenantResult.tenant.tenantKey;
  const db = await connectToDatabase(tenantKey);
  const models = getModels({ db }, 'Event', 'PivotEventIntent');

  const events = await models.Event.find({
    _id: { $in: idsResult.eventIds },
    'customFields.pivot': { $exists: true },
    isDeleted: { $ne: true },
  }).lean();

  if (events.length !== idsResult.eventIds.length) {
    return {
      error: 'One or more selected events were not found in this city catalog.',
      status: 404,
      code: 'EVENT_NOT_FOUND',
    };
  }

  return { models, events };
}

/**
 * Show what a collapse would do. Reads only — nothing here writes, so a person
 * can look at the outcome, change the survivor, and look again.
 */
async function previewCatalogShowtimeCollapse(req, options = {}) {
  const loaded = await loadSelection(req, options);
  if (loaded.error) return loaded;

  const plan = planCollapse(loaded.events, options.keepEventId);
  const absorbedIds = plan.absorbed.map((event) => event._id);
  const intentCount = loaded.models.PivotEventIntent
    ? await loaded.models.PivotEventIntent.countDocuments({ eventId: { $in: absorbedIds } })
    : 0;

  return {
    data: {
      ...serializePlan(plan),
      intents: { toMigrate: intentCount },
      // Every event, so the review screen can offer any of them as survivor.
      candidates: loaded.events.map((event) => ({
        _id: String(event._id),
        name: event.name,
        start_time: event.start_time,
        location: event.location || '',
        ingestStatus: event.customFields?.pivot?.ingestStatus || null,
        showtimes: slotsFromCatalogEvent(event).length,
      })),
    },
  };
}

async function collapseCatalogEventsToShowtimes(req, options = {}) {
  const loaded = await loadSelection(req, options);
  if (loaded.error) return loaded;

  const { models, events } = loaded;
  const { Event, PivotEventIntent } = models;

  const plan = planCollapse(events, options.keepEventId);
  const { survivor, absorbed, slots, pivot } = plan;

  /*
   * Warnings do not block, but they must be seen. The caller says which ones it
   * was shown; anything raised since is a plan that changed after review, and
   * that is worth stopping for rather than applying silently.
   */
  const acknowledged = new Set(
    Array.isArray(options.acknowledgedWarnings) ? options.acknowledgedWarnings : [],
  );
  const unacknowledged = plan.warnings.filter(
    (entry) => entry.level === 'warning' && !acknowledged.has(entry.code),
  );
  if (unacknowledged.length) {
    return {
      error: 'Review the warnings on this roll-up before applying it.',
      status: 409,
      code: 'WARNINGS_NOT_ACKNOWLEDGED',
      data: { ...serializePlan(plan), unacknowledged },
    };
  }
  const updated = await Event.findByIdAndUpdate(
    survivor._id,
    {
      $set: {
        start_time: plan.start_time,
        end_time: plan.end_time,
        description: plan.description,
        location: plan.location,
        image: plan.image,
        'customFields.pivot': pivot,
      },
    },
    { new: true, runValidators: true },
  ).lean();

  const slotIdByEventId = new Map(
    events.map((event) => {
      const fromStart = slotFromStart(event.start_time, event.end_time);
      return [String(event._id), fromStart?.id || null];
    }),
  );
  const intents = await migrateAbsorbedIntents(
    PivotEventIntent,
    survivor._id,
    absorbed,
    slotIdByEventId,
  );

  await deletePivotCatalogEventsWithModels(models, absorbed.map((event) => event._id));

  return {
    data: {
      event: serializeLabEvent(updated),
      collapsedCount: absorbed.length,
      showtimeCount: slots.length,
      intents,
    },
  };
}

module.exports = {
  previewCatalogShowtimeCollapse,
  planCollapse,
  collapseWarnings,
  collapseCatalogEventsToShowtimes,
  pickSurvivorEvent,
  slotsFromCatalogEvent,
  normalizeEventIds,
};
