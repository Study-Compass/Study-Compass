const getGlobalModels = require('./getGlobalModelService');
const pivotComputeJobSchema = require('../schemas/pivotComputeJob');
const pivotComputeJobAttemptSchema = require('../schemas/pivotComputeJobAttempt');
const {
  PIVOT_COMPUTE_JOB_INDEX_NAMES,
} = pivotComputeJobSchema;
const {
  PIVOT_COMPUTE_JOB_ATTEMPT_INDEX_NAMES,
} = pivotComputeJobAttemptSchema;

const syncedGlobalDbs = new WeakSet();

async function ensurePivotComputeJobIndexes(req, { force = false } = {}) {
  if (!req?.globalDb) return { synced: false };
  if (!force && syncedGlobalDbs.has(req.globalDb)) {
    return { synced: false };
  }

  const { PivotComputeJob, PivotComputeJobAttempt } = getGlobalModels(
    req,
    'PivotComputeJob',
    'PivotComputeJobAttempt',
  );

  await PivotComputeJob.syncIndexes();
  await PivotComputeJobAttempt.syncIndexes();
  syncedGlobalDbs.add(req.globalDb);

  return { synced: true };
}

async function dropPivotComputeJobIndexes(req) {
  if (!req?.globalDb) {
    throw new Error('req.globalDb is not set');
  }

  const { PivotComputeJob, PivotComputeJobAttempt } = getGlobalModels(
    req,
    'PivotComputeJob',
    'PivotComputeJobAttempt',
  );

  for (const name of PIVOT_COMPUTE_JOB_INDEX_NAMES) {
    await PivotComputeJob.collection.dropIndex(name).catch((error) => {
      if (error?.code !== 27 && error?.codeName !== 'IndexNotFound') throw error;
    });
  }

  for (const name of PIVOT_COMPUTE_JOB_ATTEMPT_INDEX_NAMES) {
    await PivotComputeJobAttempt.collection.dropIndex(name).catch((error) => {
      if (error?.code !== 27 && error?.codeName !== 'IndexNotFound') throw error;
    });
  }

  syncedGlobalDbs.delete(req.globalDb);
  return { dropped: true };
}

module.exports = {
  ensurePivotComputeJobIndexes,
  dropPivotComputeJobIndexes,
};
