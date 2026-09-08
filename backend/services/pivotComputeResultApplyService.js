const mongoose = require('mongoose');
const getGlobalModels = require('./getGlobalModelService');
const getModels = require('./getModelService');
const {
  CONTRACT_VERSION,
  validateExecutionResult,
  validateResultPreview,
  isStaleContextPreview,
} = require('../utilities/pivotAdminComputeJobContract');
const { recordVersion, isoTimestamp } = require('../utilities/pivotComputeContextVersion');
const {
  findJobByExternalId,
  beginComputeJobApply,
  completeComputeJobApply,
} = require('./pivotComputeJobStore');

const MAX_PREVIEW_ROWS = 5000;

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function serviceError(message, code, status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function sortedStrings(values) {
  return [...new Set((values || []).map((value) => trimString(value)).filter(Boolean))].sort();
}

function summarizePreviewRows(rows) {
  const summary = {
    creates: 0,
    updates: 0,
    unchanged: 0,
    conflicts: 0,
    rejected: 0,
    stale: 0,
  };
  const actionToSummaryKey = {
    create: 'creates',
    update: 'updates',
    unchanged: 'unchanged',
    conflict: 'conflicts',
    rejected: 'rejected',
    stale: 'stale',
  };
  for (const row of rows) {
    const summaryKey = actionToSummaryKey[row.action];
    if (summaryKey && summary[summaryKey] != null) summary[summaryKey] += 1;
  }
  return summary;
}

function sourceRowKey(host) {
  return `host:${trimString(host).toLowerCase()}`;
}

function curationJobRowKey(proposal) {
  if (proposal.jobId) return `jobId:${proposal.jobId}`;
  return `provider:${proposal.provider}|url:${proposal.url || ''}`;
}

function eventRowKey(sourceUrl) {
  return `sourceUrl:${trimString(sourceUrl)}`;
}

function serializeEventIdentity(eventDoc) {
  const row = eventDoc?.toObject ? eventDoc.toObject() : eventDoc;
  const sourceUrl = trimString(row?.customFields?.pivot?.sourceUrl);
  const name = trimString(row?.name);
  if (!sourceUrl || !name) return null;
  const material = {
    id: String(row._id || ''),
    sourceUrl,
    name,
    startTime: row.startTime instanceof Date ? row.startTime.toISOString() : isoTimestamp(row.startTime),
    batchWeek: trimString(row?.customFields?.pivot?.batchWeek) || null,
    location: trimString(row?.location) || null,
    tags: sortedStrings(row?.customFields?.pivot?.tags),
    updatedAt: isoTimestamp(row?.updatedAt),
  };
  return {
    recordVersion: recordVersion('event', material),
    sourceUrl,
    eventId: String(row._id),
  };
}

function sourceProposalMaterial(proposal) {
  return {
    host: proposal.host,
    url: proposal.url,
    label: proposal.label ?? null,
    provider: proposal.provider,
    status: proposal.status,
    enabled: proposal.enabled !== false,
    seedTags: sortedStrings(proposal.seedTags),
    rejectedReason: proposal.rejectedReason ?? null,
  };
}

function curationJobProposalMaterial(proposal) {
  return {
    label: proposal.label,
    url: proposal.url ?? null,
    provider: proposal.provider,
    enabled: proposal.enabled !== false,
    defaultTags: sortedStrings(proposal.defaultTags),
  };
}

function eventProposalMaterial(proposal) {
  const draft = proposal.draft || {};
  return {
    sourceUrl: proposal.sourceUrl,
    batchWeek: proposal.batchWeek,
    draft: {
      name: draft.name,
      description: draft.description ?? null,
      location: draft.location ?? null,
      start_time: draft.start_time,
      end_time: draft.end_time ?? null,
      tags: sortedStrings(draft.tags),
    },
  };
}

function classifyVersionedProposal({
  entityType,
  key,
  proposalAction,
  basedOnRecordVersion,
  current,
  proposalMaterial,
  currentMaterial,
  rejectedReason = null,
}) {
  const evidence = {};
  if (entityType === 'source') {
    evidence.host = key.replace(/^host:/, '');
  }
  if (entityType === 'event') {
    evidence.sourceUrl = key.replace(/^sourceUrl:/, '');
  }
  if (entityType === 'curationJob' && current?.jobId) {
    evidence.jobId = current.jobId;
  }

  if (rejectedReason) {
    return {
      entityType,
      action: 'rejected',
      key,
      basedOnRecordVersion: basedOnRecordVersion ?? null,
      currentRecordVersion: current?.recordVersion ?? null,
      message: rejectedReason,
      evidence,
    };
  }

  if (!current) {
    if (proposalAction === 'create' || proposalAction === 'upsert') {
      return {
        entityType,
        action: 'create',
        key,
        basedOnRecordVersion: basedOnRecordVersion ?? null,
        currentRecordVersion: null,
        message: null,
        evidence,
      };
    }
    return {
      entityType,
      action: 'rejected',
      key,
      basedOnRecordVersion: basedOnRecordVersion ?? null,
      currentRecordVersion: null,
      message: 'Cannot update a record that does not exist.',
      evidence,
    };
  }

  if (basedOnRecordVersion && basedOnRecordVersion !== current.recordVersion) {
    return {
      entityType,
      action: 'stale',
      key,
      basedOnRecordVersion,
      currentRecordVersion: current.recordVersion,
      message: 'Production record changed after the worker snapshot.',
      evidence,
    };
  }

  const proposalHash = recordVersion('preview', proposalMaterial);
  const currentHash = recordVersion('preview', currentMaterial);
  if (proposalHash === currentHash) {
    return {
      entityType,
      action: 'unchanged',
      key,
      basedOnRecordVersion: basedOnRecordVersion ?? current.recordVersion,
      currentRecordVersion: current.recordVersion,
      message: null,
      evidence,
    };
  }

  if (proposalAction === 'update' || proposalAction === 'upsert' || proposalAction === 'create') {
    return {
      entityType,
      action: 'update',
      key,
      basedOnRecordVersion: basedOnRecordVersion ?? current.recordVersion,
      currentRecordVersion: current.recordVersion,
      message: null,
      evidence,
    };
  }

  return {
    entityType,
    action: 'conflict',
    key,
    basedOnRecordVersion: basedOnRecordVersion ?? null,
    currentRecordVersion: current.recordVersion,
    message: 'Proposal action is incompatible with current production state.',
    evidence,
  };
}

function validateComputeExecutionResult(result) {
  if (trimString(result?.contractVersion) !== CONTRACT_VERSION) {
    throw serviceError(
      `Unsupported compute contract version: ${result?.contractVersion || 'unknown'}`,
      'UNSUPPORTED_COMPUTE_CONTRACT_VERSION',
      400,
    );
  }
  const validation = validateExecutionResult(result);
  if (!validation.valid) {
    throw serviceError(
      `Invalid compute execution result: ${validation.errors.join(', ')}`,
      'INVALID_COMPUTE_EXECUTION_RESULT',
      400,
    );
  }
  if (result.outcome !== 'completed') {
    throw serviceError(
      'Only completed compute results can be previewed or applied.',
      'COMPUTE_RESULT_NOT_APPLYABLE',
      409,
    );
  }
  return result;
}

async function resolvePivotTenant(req, tenantKey) {
  const { resolvePivotTenant: resolveTenant } = require('./pivotIngestPublishService');
  return resolveTenant(req, tenantKey);
}

async function resolveCurrentContextVersion(req, result, { authorize = null } = {}) {
  const options = {
    cityKey: result.cityKey,
    jobId: result.jobId,
    scheduleOccurrenceId: result.scheduleOccurrenceId ?? null,
    authorize: authorize || (async () => null),
  };
  if (result.kind === 'city-source-discovery') {
    const { buildCityDiscoveryContextSnapshot } = require('./pivotOffloadedDiscoveryContextService');
    const built = await buildCityDiscoveryContextSnapshot(req, options);
    if (built?.error) throw serviceError(built.error, built.code || 'DISCOVERY_CONTEXT_FAILED', built.status || 500);
    return built.data.snapshot.contextVersion;
  }
  const { buildCityCurationRefreshContextSnapshot } = require('./pivotOffloadedCurationRefreshContextService');
  const built = await buildCityCurationRefreshContextSnapshot(req, options);
  if (built?.error) throw serviceError(built.error, built.code || 'REFRESH_CONTEXT_FAILED', built.status || 500);
  return built.data.snapshot.contextVersion;
}

async function loadProductionIdentities(req, result) {
  const tenantResult = await resolvePivotTenant(req, result.cityKey);
  if (tenantResult.error) {
    throw serviceError(tenantResult.error, tenantResult.code || 'TENANT_NOT_FOUND', tenantResult.status || 404);
  }

  const {
    serializeSourceIdentity,
    serializeCurationJobIdentity,
  } = require('./pivotOffloadedDiscoveryContextService');

  const { PivotCitySource, PivotCurationJob } = getGlobalModels(req, 'PivotCitySource', 'PivotCurationJob');
  const [sourceRows, jobRows] = await Promise.all([
    PivotCitySource.find({ tenantKey: result.cityKey }).lean(),
    PivotCurationJob.find({ tenantKey: result.cityKey }).lean(),
  ]);

  const sources = sourceRows.map(serializeSourceIdentity).filter(Boolean);
  let curationJobs;
  if (result.kind === 'city-curation-refresh') {
    const { serializeRefreshJobIdentity } = require('./pivotOffloadedCurationRefreshContextService');
    curationJobs = jobRows.map((row) => serializeRefreshJobIdentity(row)).filter(Boolean);
  } else {
    curationJobs = jobRows.map(serializeCurationJobIdentity).filter(Boolean);
  }

  const sourceByHost = new Map(sources.map((row) => [row.host, row]));
  const jobById = new Map(curationJobs.map((row) => [row.jobId, row]));
  const jobByKey = new Map(curationJobs.map((row) => [curationJobRowKey(row), row]));

  let eventBySourceUrl = new Map();
  let eventDocBySourceUrl = new Map();
  const eventUrls = (result.proposals?.events || []).map((row) => trimString(row.sourceUrl)).filter(Boolean);
  if (eventUrls.length) {
    const { Event } = getModels(req, 'Event');
    const eventRows = await Event.find({
      'customFields.pivot.sourceUrl': { $in: eventUrls },
    }).lean();
    for (const eventDoc of eventRows) {
      const identity = serializeEventIdentity(eventDoc);
      if (!identity) continue;
      eventBySourceUrl.set(identity.sourceUrl, identity);
      eventDocBySourceUrl.set(identity.sourceUrl, eventDoc);
    }
  }

  return {
    tenant: tenantResult.tenant,
    sourceByHost,
    jobById,
    jobByKey,
    eventBySourceUrl,
    eventDocBySourceUrl,
  };
}

function eventDocToProposalMaterial(eventDoc) {
  const row = eventDoc?.toObject ? eventDoc.toObject() : eventDoc;
  return eventProposalMaterial({
    sourceUrl: trimString(row?.customFields?.pivot?.sourceUrl),
    batchWeek: trimString(row?.customFields?.pivot?.batchWeek) || null,
    draft: {
      name: row?.name,
      description: row?.description ?? null,
      location: row?.location ?? null,
      start_time: row?.startTime instanceof Date ? row.startTime.toISOString() : row?.startTime,
      end_time: row?.endTime instanceof Date ? row.endTime.toISOString() : row?.endTime ?? null,
      tags: row?.customFields?.pivot?.tags,
    },
  });
}

function previewDiscoveryProposals(result, identities) {
  const rows = [];
  for (const proposal of result.proposals?.sources || []) {
    const current = identities.sourceByHost.get(proposal.host) || null;
    rows.push(classifyVersionedProposal({
      entityType: 'source',
      key: sourceRowKey(proposal.host),
      proposalAction: proposal.action,
      basedOnRecordVersion: proposal.basedOnRecordVersion,
      current,
      proposalMaterial: sourceProposalMaterial(proposal),
      currentMaterial: current ? sourceProposalMaterial({ ...current, action: 'update', seedTags: current.seedTags }) : null,
      rejectedReason: proposal.status === 'rejected' ? (proposal.rejectedReason || 'rejected') : null,
    }));
  }

  for (const proposal of result.proposals?.curationJobs || []) {
    const current = identities.jobByKey.get(curationJobRowKey(proposal)) || null;
    rows.push(classifyVersionedProposal({
      entityType: 'curationJob',
      key: curationJobRowKey(proposal),
      proposalAction: proposal.action,
      basedOnRecordVersion: proposal.basedOnRecordVersion,
      current,
      proposalMaterial: curationJobProposalMaterial(proposal),
      currentMaterial: current ? curationJobProposalMaterial(current) : null,
    }));
  }

  for (const proposal of result.proposals?.events || []) {
    const current = identities.eventBySourceUrl.get(proposal.sourceUrl) || null;
    const currentDoc = identities.eventDocBySourceUrl.get(proposal.sourceUrl) || null;
    rows.push(classifyVersionedProposal({
      entityType: 'event',
      key: eventRowKey(proposal.sourceUrl),
      proposalAction: proposal.action,
      basedOnRecordVersion: proposal.basedOnEventVersion,
      current,
      proposalMaterial: eventProposalMaterial(proposal),
      currentMaterial: currentDoc ? eventDocToProposalMaterial(currentDoc) : null,
    }));
  }

  return rows;
}

function previewRefreshProposals(result, identities) {
  const rows = [];
  for (const outcome of result.proposals?.jobOutcomes || []) {
    const current = identities.jobById.get(outcome.jobId) || null;
    rows.push(classifyVersionedProposal({
      entityType: 'curationJob',
      key: curationJobRowKey({ jobId: outcome.jobId }),
      proposalAction: 'update',
      basedOnRecordVersion: outcome.basedOnRecordVersion,
      current,
      proposalMaterial: { outcome: outcome.outcome },
      currentMaterial: current ? { outcome: 'completed' } : null,
      rejectedReason: outcome.outcome === 'failed' || outcome.outcome === 'skipped'
        ? (outcome.failure?.message || outcome.outcome)
        : null,
    }));
  }

  for (const proposal of result.proposals?.events || []) {
    const current = identities.eventBySourceUrl.get(proposal.sourceUrl) || null;
    const currentDoc = identities.eventDocBySourceUrl.get(proposal.sourceUrl) || null;
    rows.push(classifyVersionedProposal({
      entityType: 'event',
      key: eventRowKey(proposal.sourceUrl),
      proposalAction: proposal.action,
      basedOnRecordVersion: proposal.basedOnEventVersion,
      current,
      proposalMaterial: eventProposalMaterial(proposal),
      currentMaterial: currentDoc ? eventDocToProposalMaterial(currentDoc) : null,
    }));
  }

  return rows;
}

function buildPreviewEnvelope(result, currentContextVersion, rows, now = new Date()) {
  const blockingReasons = [];
  if (isStaleContextPreview({ basedOnContextVersion: result.basedOnContextVersion }, currentContextVersion)) {
    blockingReasons.push({
      code: 'STALE_CONTEXT',
      message: `Result was computed against ${result.basedOnContextVersion} but production is now ${currentContextVersion}.`,
    });
  }
  if (rows.some((row) => row.action === 'stale')) {
    blockingReasons.push({
      code: 'STALE_ROWS',
      message: 'One or more proposed rows are stale relative to current production records.',
    });
  }
  if (rows.some((row) => row.action === 'conflict')) {
    blockingReasons.push({
      code: 'ROW_CONFLICT',
      message: 'One or more proposed rows conflict with current production records.',
    });
  }

  const applyAllowed = blockingReasons.length === 0
    && rows.some((row) => row.action === 'create' || row.action === 'update');

  const preview = {
    contractVersion: CONTRACT_VERSION,
    jobId: result.jobId,
    scheduleOccurrenceId: result.scheduleOccurrenceId ?? null,
    kind: result.kind,
    cityKey: result.cityKey,
    implementationRevision: result.implementationRevision,
    contextVersion: currentContextVersion,
    basedOnContextVersion: result.basedOnContextVersion,
    previewedAt: isoTimestamp(now) || now.toISOString(),
    applyAllowed,
    blockingReasons,
    rows: rows.slice(0, MAX_PREVIEW_ROWS),
    summary: summarizePreviewRows(rows),
  };

  const validation = validateResultPreview(preview);
  if (!validation.valid) {
    throw serviceError(
      `Generated preview failed validation: ${validation.errors.join(', ')}`,
      'INVALID_COMPUTE_RESULT_PREVIEW',
      500,
    );
  }
  return preview;
}

async function previewComputeResult(req, resultInput, {
  currentContextVersion = null,
  now = new Date(),
  authorize = null,
} = {}) {
  const result = validateComputeExecutionResult(resultInput);
  const contextVersion = currentContextVersion
    || await resolveCurrentContextVersion(req, result, { authorize });
  const identities = await loadProductionIdentities(req, result);
  const rows = result.kind === 'city-curation-refresh'
    ? previewRefreshProposals(result, identities)
    : previewDiscoveryProposals(result, identities);
  return buildPreviewEnvelope(result, contextVersion, rows, now);
}

async function applySourceRow(req, result, proposal) {
  const { persistOutcome } = require('./pivotSourceDiscoveryService');
  const outcome = {
    candidate: {
      host: proposal.host,
      seedTags: new Set(proposal.seedTags || []),
      discoveredVia: 'compute-apply',
    },
    status: proposal.status,
    provider: proposal.provider,
    url: proposal.url,
    label: proposal.label,
    eventCount: proposal.evidence?.eventCount || 0,
    rejectedReason: proposal.rejectedReason || null,
  };
  await persistOutcome(req, result.cityKey, outcome, new Date());
}

async function findCurationJobProposal(result, proposal, identities) {
  return identities.jobByKey.get(curationJobRowKey(proposal))
    || [...identities.jobById.values()].find((row) => row.label === proposal.label && row.provider === proposal.provider)
    || null;
}

async function applyCurationJobRow(req, result, proposal, identities) {
  const { createCurationJob, updateCurationJob } = require('./pivotCurationJobService');
  const existing = await findCurationJobProposal(result, proposal, identities);
  if (!existing) {
    await createCurationJob(req, {
      tenantKey: result.cityKey,
      label: proposal.label,
      url: proposal.url,
      provider: proposal.provider,
      defaultTags: proposal.defaultTags || [],
      enabled: proposal.enabled !== false,
      defaultBatchWeekStrategy: 'next-drop',
    });
    return;
  }
  await updateCurationJob(req, {
    tenantKey: result.cityKey,
    jobId: existing.jobId,
    url: proposal.url,
    defaultTags: proposal.defaultTags,
    enabled: proposal.enabled,
  });
}

async function applyEventRow(req, result, proposal) {
  const { publishIngestEvent } = require('./pivotIngestPublishService');
  const published = await publishIngestEvent(req, {
    tenantKey: result.cityKey,
    draft: proposal.draft,
    batchWeek: proposal.batchWeek,
    url: proposal.sourceUrl,
    tagsRequired: false,
  });
  if (published?.error) {
    throw serviceError(published.error, published.code || 'EVENT_APPLY_FAILED', published.status || 500);
  }
}

async function applyComputeResult(req, {
  result: resultInput,
  preview,
  idempotencyKey,
  actor = null,
  now = new Date(),
} = {}) {
  const result = validateComputeExecutionResult(resultInput);
  const normalizedKey = trimString(idempotencyKey);
  if (!normalizedKey) {
    throw serviceError('Apply idempotencyKey is required.', 'APPLY_IDEMPOTENCY_REQUIRED');
  }
  if (!preview || preview.jobId !== result.jobId) {
    throw serviceError('Accepted preview is required.', 'PREVIEW_REQUIRED', 409);
  }
  if (!preview.applyAllowed) {
    throw serviceError('Preview does not allow apply.', 'PREVIEW_APPLY_BLOCKED', 409);
  }

  const freshPreview = await previewComputeResult(req, result, {
    now,
    currentContextVersion: preview.contextVersion,
  });
  if (freshPreview.basedOnContextVersion !== preview.basedOnContextVersion
    || freshPreview.contextVersion !== preview.contextVersion
    || freshPreview.summary.creates !== preview.summary.creates
    || freshPreview.summary.updates !== preview.summary.updates) {
    throw serviceError('Preview is stale relative to current production state.', 'PREVIEW_STALE', 409);
  }

  const identities = await loadProductionIdentities(req, result);
  const applicable = preview.rows.filter((row) => row.action === 'create' || row.action === 'update');
  const summary = {
    creates: 0,
    updates: 0,
    unchanged: preview.summary.unchanged,
    conflicts: 0,
    stale: 0,
    rejected: preview.summary.rejected,
  };

  try {
    for (const row of applicable) {
      if (row.entityType === 'source') {
        const proposal = (result.proposals.sources || []).find((item) => sourceRowKey(item.host) === row.key);
        if (!proposal) continue;
        await applySourceRow(req, result, proposal);
        summary[row.action === 'create' ? 'creates' : 'updates'] += 1;
        continue;
      }
      if (row.entityType === 'curationJob' && result.kind === 'city-source-discovery') {
        const proposal = (result.proposals.curationJobs || []).find((item) => curationJobRowKey(item) === row.key);
        if (!proposal) continue;
        await applyCurationJobRow(req, result, proposal, identities);
        summary[row.action === 'create' ? 'creates' : 'updates'] += 1;
        continue;
      }
      if (row.entityType === 'event') {
        const proposal = (result.proposals.events || []).find((item) => eventRowKey(item.sourceUrl) === row.key);
        if (!proposal) continue;
        await applyEventRow(req, result, proposal);
        summary[row.action === 'create' ? 'creates' : 'updates'] += 1;
      }
    }
  } catch (error) {
    error.partialSummary = summary;
    throw error;
  }

  return { summary, preview };
}

async function previewStoredComputeJob(req, externalJobId, options = {}) {
  const job = await findJobByExternalId(req, externalJobId);
  if (!job) throw serviceError('Compute job not found.', 'COMPUTE_JOB_NOT_FOUND', 404);
  if (!job.result?.embedded) {
    throw serviceError('Compute job has no stored result to preview.', 'COMPUTE_JOB_RESULT_MISSING', 409);
  }
  const preview = await previewComputeResult(req, job.result.embedded, options);
  return { job, preview };
}

async function applyStoredComputeJob(req, externalJobId, {
  idempotencyKey,
  preview,
  actor = null,
  now = new Date(),
} = {}) {
  const job = await findJobByExternalId(req, externalJobId);
  if (!job) throw serviceError('Compute job not found.', 'COMPUTE_JOB_NOT_FOUND', 404);
  if (job.status === 'completed') {
    if (job.applicationAudit?.idempotencyKey === trimString(idempotencyKey)) {
      return { job, duplicate: true };
    }
    throw serviceError('Compute job result has already been applied.', 'COMPUTE_JOB_ALREADY_APPLIED', 409);
  }
  if (job.status !== 'review-required') {
    throw serviceError(`Compute job cannot be applied from status ${job.status}.`, 'COMPUTE_JOB_NOT_REVIEWABLE', 409);
  }
  if (!job.result?.embedded) {
    throw serviceError('Compute job has no stored result to apply.', 'COMPUTE_JOB_RESULT_MISSING', 409);
  }

  await beginComputeJobApply(req, {
    externalJobId,
    actor,
    previewId: preview?.previewedAt || null,
    idempotencyKey,
    now,
  });

  try {
    const applied = await applyComputeResult(req, {
      result: job.result.embedded,
      preview,
      idempotencyKey,
      actor,
      now,
    });
    const completed = await completeComputeJobApply(req, {
      externalJobId,
      actor,
      idempotencyKey,
      summary: applied.summary,
      outcome: 'completed',
      now,
    });
    return { job: completed, duplicate: false, summary: applied.summary };
  } catch (error) {
    await completeComputeJobApply(req, {
      externalJobId,
      actor,
      idempotencyKey: trimString(idempotencyKey) || `apply-failed:${externalJobId}`,
      summary: error.partialSummary || preview?.summary || {},
      outcome: 'partial',
      now,
    });
    throw error;
  }
}

async function previewManualComputeResult(req, resultInput, options = {}) {
  return previewComputeResult(req, resultInput, options);
}

module.exports = {
  sourceRowKey,
  curationJobRowKey,
  eventRowKey,
  serializeEventIdentity,
  classifyVersionedProposal,
  summarizePreviewRows,
  buildPreviewEnvelope,
  validateComputeExecutionResult,
  previewComputeResult,
  previewStoredComputeJob,
  previewManualComputeResult,
  applyComputeResult,
  applyStoredComputeJob,
};
