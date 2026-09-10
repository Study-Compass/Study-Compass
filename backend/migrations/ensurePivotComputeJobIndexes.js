#!/usr/bin/env node
/**
 * Ensure durable indexes for Pivot compute jobs and attempts.
 *
 * Usage (from Meridian/backend):
 *   node migrations/ensurePivotComputeJobIndexes.js
 *   node migrations/ensurePivotComputeJobIndexes.js --down
 */
require('dotenv').config();

const mongoose = require('mongoose');
const { connectToGlobalDatabase } = require('../connectionsManager');
const {
  ensurePivotComputeJobIndexes,
  dropPivotComputeJobIndexes,
} = require('../services/ensurePivotComputeJobIndexes');

async function run() {
  const down = process.argv.includes('--down');
  const globalDb = await connectToGlobalDatabase();
  const req = { globalDb };

  if (down) {
    await dropPivotComputeJobIndexes(req);
    console.log('[migrate:pivot-compute-job-indexes] dropped compute job indexes');
    return;
  }

  await ensurePivotComputeJobIndexes(req, { force: true });
  console.log('[migrate:pivot-compute-job-indexes] synced compute job indexes');
}

run()
  .catch((error) => {
    console.error('[migrate:pivot-compute-job-indexes] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
