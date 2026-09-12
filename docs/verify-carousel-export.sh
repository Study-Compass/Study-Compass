#!/bin/sh
# Phase 6 automated verification for carousel export plus discovery/refresh regression.
set -e

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)

echo "== Relay carousel, recovery, contract, and worker client =="
cd "$ROOT/relay"
npx vitest run \
  src/jobs/carousel.test.ts \
  src/jobs/request.test.ts \
  src/jobs/runtime.test.ts \
  src/jobs/store.test.ts \
  src/worker/client.test.ts \
  src/worker/recovery.test.ts \
  src/worker/queue.test.ts

echo "== Meridian contract, artifacts, ownership, downloads, diagnostics =="
cd "$ROOT/Meridian/backend"
NODE_ENV=test npx jest --runInBand \
  tests/unit/pivotAdminComputeJobContract.test.js \
  tests/unit/pivotCarouselComputeContext.test.js \
  tests/unit/pivotCarouselArtifactTransport.test.js \
  tests/unit/pivotCarouselExportDownload.test.js \
  tests/unit/pivotCarouselExportStorageDiagnostic.test.js \
  tests/unit/pivotComputeJobStore.test.js \
  tests/unit/pivotComputeResultApply.test.js \
  tests/unit/pivotComputeLease.test.js \
  tests/route-outcomes/pivotAdminComputeJobs.outcomes.test.js \
  tests/route-outcomes/pivotComputeWorkerArtifactRoutes.outcomes.test.js \
  tests/route-outcomes/pivotComputeWorkerRoutes.outcomes.test.js

echo "== Frontend export flow, panel, compute IA, visual matrix =="
cd "$ROOT/Meridian/frontend"
npx jest --watchAll=false \
  src/pages/PlatformAdmin/PivotTenantDashboard/carousel \
  src/pages/PlatformAdmin/PivotTenantDashboard/PivotComputeJobs.test.jsx \
  src/pages/PlatformAdmin/PivotTenantDashboard/pivotComputeJobsFormat.test.js \
  src/pages/PlatformAdmin/PivotTenantDashboard/pivotComputeJobActions.test.js

echo "Carousel export verification passed."
