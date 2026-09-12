# Relay Carousel Export Implementation Plan

## Objective

Let a platform admin click **Export** in the carousel editor and receive rendered PNGs and a ZIP through Meridian. Meridian creates a tenant-bound compute job, Relay renders the saved deck with Playwright, uploads verified artifacts, and the frontend presents progress and authenticated downloads. The flow must not require a terminal command or manual result approval.

Estimated scope: **950–1,600 changed lines**, likely near **1,200**.

## Design constraints

- Keep binary files out of MongoDB and the bounded compute-result JSON request.
- Preserve the existing discovery and curation-refresh contracts.
- Give Relay short-lived, job-scoped upload grants rather than permanent object-storage credentials.
- Bind every job, render token, upload, manifest, and download to its tenant, deck, and attempt.
- Treat a successful export as `completed`, not `review-required`; exports do not apply data to a tenant.
- Make job creation and terminal reporting idempotent and safe across Relay restarts.

The intended flow is:

```text
Export button
    -> Meridian creates a tenant-bound carousel-export job
    -> Relay claims it and receives deck-scoped render context
    -> Playwright renders each slide
    -> Relay uploads PNGs and a ZIP through presigned URLs
    -> Meridian verifies and records the artifact manifest
    -> Frontend offers ZIP and individual slide downloads
```

## Phase 0 — Stabilize worker recovery

Complete this before introducing another production job kind. The current startup ordering can leave Relay's local execution and Meridian's durable job record out of sync.

### Steps

1. Run interrupted-job recovery before `wake-serve` performs its first queue reconciliation.
2. Persist sufficient claim information locally:
   - External job ID
   - Attempt ID
   - Worker ID
   - Lease expiration
   - Context version
3. On restart:
   - Mark the interrupted local execution terminal.
   - Release stale local ownership.
   - Report a retryable interruption while the lease remains valid.
   - Otherwise allow Meridian's expired-lease recovery to reclaim it.
4. Surface the exact blocking process and status in wake diagnostics.
5. Add tests for restart during execution, restart after upload, expired leases, local stop versus server cancellation, and duplicate recovery attempts.

### Acceptance criteria

- A Relay restart cannot leave a job permanently displayed as running.
- A later wake either retries the job or exposes a clear terminal failure.
- Recovery is idempotent.

Estimated change: **150–250 lines**.

### Implementation notes — completed 2026-09-12

Phase 0 is implemented in Relay and is kind-agnostic.

- `wake-serve` recovers interrupted local jobs and reports retryable interruption **before** the first queue reconciliation.
- Production claims persist `externalJobId`, `attemptId`, `workerId`, `leaseToken`, `leaseExpiresAt`, and `contextVersion` on the local job record. Public job payloads omit the lease token.
- Restart marks the local execution `failed`/`interrupted`, releases the mutex, and reports retryable failure while Meridian still holds the lease. Expired or mismatched leases are left for Meridian reclaim.
- Recovery is idempotent. A clean local stop is not rewritten as an interruption; a crash while `stopping` is.
- Wake `/health` and queue-check results include the exact blocking process `{ type, id, status }` when the machine mutex is busy.

## Phase 1 — Define the carousel compute contract

### Steps

1. Add `carousel-export` to Meridian's supported compute-job kinds.
2. Add `carousel-export` to Relay's advertised production capabilities.
3. Define a carousel claim context containing:
   - `tenantKey`
   - `cityKey`
   - `deckId`
   - Immutable deck revision
   - Slide count
   - Render dimensions
   - Render URL base
   - Short-lived, deck-scoped render token
   - Artifact upload grant
4. Mint the render token when Relay claims the job, not when the user clicks Export, so queue latency cannot consume the token lifetime.
5. Define a bounded terminal result containing:
   - Outcome
   - Rendered deck revision
   - Slide count
   - Render duration
   - Artifact manifest
   - Bounded warnings
6. Define each artifact manifest entry with a logical name, server-issued artifact ID, MIME type, byte count, SHA-256 checksum, and slide number.
7. Establish limits for slide count, bytes per artifact, total bytes, artifact count, and allowed MIME types.
8. Send successful carousel jobs directly to `completed`.
9. Reject preview/apply operations for carousel jobs.

Suggested lifecycle:

```text
pending -> leased -> running -> completed
                           \-> retryable
                           \-> failed
                           \-> cancelled
```

### Acceptance criteria

- Discovery and refresh payloads remain unchanged.
- Unsupported files and oversized manifests fail validation.
- A result cannot be submitted for another tenant, deck, or attempt.

Estimated change: **100–180 lines**.

### Implementation notes — completed 2026-09-12

Phase 1 is implemented across Meridian and Relay.

- `carousel-export` is now a supported Meridian compute-job kind and is included in Relay's advertised production capabilities.
- Carousel job requests carry `deckId` and the saved deck's `deckRevision` in bounded options. The revision is the deck's `updatedAt` timestamp and is checked again when the worker requests context.
- Meridian builds carousel context only after a worker owns a lease. The context is bound to the tenant, city, external job, deck, immutable revision, and attempt, and contains:
  - Exact `1080x1350` render dimensions.
  - A render-route base URL.
  - A ten-minute deck/revision/job/attempt-scoped render token.
  - A ten-minute artifact-upload grant scoped to the same attempt.
- The upload grant currently establishes the signed authorization and limits contract. Presigned upload initialization, object verification, and finalization endpoints remain Phase 2 work.
- Carousel terminal results contain the rendered revision, slide count, render duration, bounded warnings, and an artifact manifest. Each manifest entry contains a logical filename, server-issued artifact ID, MIME type, byte count, SHA-256 checksum, and nullable slide number.
- Current limits are 20 slides, 21 artifacts, 64 MiB per artifact, 256 MiB total, 20 warnings, and MIME types `image/png` and `application/zip`. A completed result must contain exactly one PNG per slide and exactly one ZIP.
- Meridian rejects results whose job, tenant, city, deck, revision, context version, or attempt binding does not match the active job.
- Successful carousel results always transition directly from `running` to `completed`, even if a caller requests review.
- Stored/manual preview, apply, and manual-result submission paths explicitly reject carousel exports.
- Discovery and curation-refresh request, context, and result shapes were left unchanged; shared worker capability fixtures were extended additively.
- Relay now models the carousel context and terminal result, validates production-context carousel requests, carries the context deck ID into its local job, and submits successful carousel results without review. Connecting that context to the renderer and artifact transport remains Phase 3 work.

Verification completed:

- Relay TypeScript build passed.
- 19 Relay contract, request, client, and queue tests passed.
- 88 relevant Meridian contract, context, lifecycle, route, and preview/apply tests passed.
- JavaScript syntax checks and `git diff --check` passed in both repositories.

## Phase 2 — Add artifact storage transport

Use direct, presigned object-storage operations rather than embedding PNG data in JSON.

### Steps

1. Establish a server-owned object prefix:

   ```text
   pivot-exports/{tenantKey}/{externalJobId}/{attemptNumber}/
   ```

2. Add a worker endpoint that initializes the expected artifact uploads.
3. Have Meridian return short-lived presigned upload URLs.
4. Restrict every grant by active worker lease, tenant, job, attempt, approved filename, content type, maximum size, and expiration.
5. Upload each PNG directly from Relay to object storage.
6. Calculate SHA-256 and byte length before or during upload.
7. Add an idempotent artifact-finalization endpoint.
8. During finalization, verify that:
   - The object exists.
   - Its prefix belongs to the job and attempt.
   - Its content type and size are allowed.
   - Its checksum matches.
9. Store only the verified manifest in the compute-job document.
10. Add lifecycle cleanup for partial uploads, failed/cancelled attempts, and completed exports.

### Acceptance criteria

- No image bytes pass through the compute-result JSON endpoint.
- Relay holds no permanent object-storage credentials.
- An old attempt cannot overwrite artifacts from a newer attempt.
- Repeated finalization returns the same verified manifest.

Estimated change: **300–500 lines**, including tests.

### Implementation notes — completed 2026-09-12

Phase 2 is implemented across Meridian and Relay's worker client.

- Carousel artifacts use the server-owned prefix `pivot-exports/{tenantKey}/{externalJobId}/{attemptNumber}/`.
- Workers initialize expected uploads at `POST /worker/pivot/compute/v1/jobs/:id/artifacts/init` with the attempt-scoped upload grant. Meridian returns short-lived presigned PUT URLs bound to approved filenames, content types, byte counts, checksums, and the active lease.
- Relay uploads PNG and ZIP bytes directly to object storage. Those bytes never enter the compute-result JSON endpoint.
- `POST .../artifacts/finalize` verifies object existence, prefix ownership, content type, size, and SHA-256, then stores only the verified manifest on the attempt and compute-job documents. Repeated finalization returns the same manifest.
- An older attempt cannot write into a newer attempt's prefix. Completed carousel results are rejected until the current attempt's manifest is verified.
- Failed, cancelled, and expired attempts delete their prefixes. Completed exports expire after `PIVOT_CAROUSEL_EXPORT_RETENTION_MS` (14 days by default) during lease-reclaim cleanup. Recommend an S3 lifecycle rule on `pivot-exports/` for incomplete multipart uploads.

Verification completed:

- Relay TypeScript build and worker client tests.
- Meridian contract, store, transport, and worker-route tests.

## Phase 3 — Connect the existing Relay renderer

Reuse the existing `carousel-export` Playwright adapter.

### Steps

1. Route production `carousel-export` claims to `createCarouselJobAdapter`.
2. Replace direct production database reads with the claim-time context. Relay must not require production MongoDB access.
3. Continue rendering through the deck-scoped browser route.
4. Verify the expected deck revision before rendering.
5. Emit bounded progress for loading, rendering, uploading, packaging, and finalization.
6. Render each slide in the job's isolated output directory.
7. Upload each completed PNG through the artifact transport.
8. Package and upload a ZIP after every slide passes validation.
9. Submit the verified artifact manifest as the terminal result.
10. On cancellation, stop Playwright, leave no finalized partial export, and remove temporary local output when safe.
11. On restart, reuse verified uploads and rerender only missing artifacts where safe.
12. Delete local temporary files only after Meridian acknowledges completion.

### Acceptance criteria

- Relay renders without direct production database access.
- Meridian receives useful progress while rendering.
- Partial upload failures are retryable.
- Repeated result submission does not duplicate artifacts.
- Relay output visually matches the existing local export at 1080x1350.

Estimated change: **180–300 lines**.

### Implementation notes — completed 2026-09-12

Phase 3 is implemented in Relay. Production `carousel-export` claims always route to `createCarouselJobAdapter`.

- Production runs use claim-time context only: slide count, deck revision, render URL base, render token, dimensions, and the artifact upload grant. They do not open production Mongo or mint a local token.
- The Playwright launcher still screenshots the deck-scoped `/carousel-export/:deckId/:index` route at 1080×1350. A revision mismatch from that route fails the job before any finalize.
- Bounded activity/heartbeat progress covers loading, rendering, uploading, packaging, and finalization.
- Each PNG is written in the job's isolated render directory, hashed, uploaded through the Phase 2 transport, then packaged into `carousel.zip`. The verified manifest is the terminal compute result (`completed`, no review).
- Cancellation aborts Playwright, skips finalization, and deletes local output. Retryable PUT failures retry without re-rendering. Init that already reports a finalized attempt reuses that manifest.
- Local PNGs are reused when present on a same-attempt retry. Temporary render files are removed only after the compute outbox receives Meridian's acknowledgement (or duplicate acknowledgement).

Verification completed:

- Relay TypeScript build passed.
- Carousel, zip, runtime, request, worker client/queue/recovery, and outbox tests passed.

## Phase 4 — Build the seamless frontend flow

Replace the terminal-command interface in the carousel editor.

### Steps

1. Change **Export…** to create a tenant-bound compute job.
2. Require the current deck to be saved before export.
3. Submit tenant key, deck ID, expected deck revision, and an idempotency key.
4. Immediately open an export popup or inline status panel.
5. Present distinct states:
   - Creating job
   - Relay notified
   - Waiting for worker
   - Rendering
   - Uploading
   - Completed
   - Failed
   - Cancelled
6. Show concrete progress such as `Rendering slide 4 of 8` and `4 PNGs uploaded`.
7. On completion, provide **Download ZIP** and individual slide downloads with sizes, export time, and rendered revision.
8. Keep completed exports accessible after the popup closes.
9. Add cancellation and retry actions.
10. Warn if the deck changes while an older revision is exporting.
11. Restore active export state after a browser refresh.
12. Never show preview/apply controls for this job kind.

### Acceptance criteria

- The admin never copies or runs a shell command.
- Repeated clicks cannot create duplicate jobs.
- Refreshing the browser restores the active export.
- Downloads remain tenant-authorized.
- Errors identify whether rendering, uploading, or finalization failed.

Estimated change: **180–300 lines**, including component tests.

### Implementation notes — completed 2026-09-12

Phase 4 replaces the terminal-command Export UI in the carousel editor.

- Export creates a tenant-bound `carousel-export` compute job with the saved deck ID, deck revision, and a click-scoped idempotency key. Unsaved decks cannot export. A second click reopens the active job instead of enqueueing another.
- The editor opens a status popup and keeps a persistent strip after the popup closes. States cover creating, Relay notified, waiting for worker, rendering, uploading, completed, failed, and cancelled. Progress uses worker heartbeats such as `Rendering slide 4 of 8` and `4 PNGs uploaded`.
- Completed jobs offer authenticated ZIP and per-slide downloads (`GET /admin/pivot/compute-jobs/:id/artifacts/:artifactId?tenantKey=`). Meridian mints a short-lived, tenant-bound presigned GET. Expired artifacts keep the job record and tell the admin to export again.
- Cancel and retry use the existing compute-job actions. A deck save during an older export shows a revision warning. Session storage plus the tenant job list restore an in-flight export after refresh.
- Preview and apply controls are omitted from the export surface and rejected for `carousel-export` in shared compute-job action helpers.

## Phase 5 — Integrate with compute-job information architecture

### Steps

1. Add the `Carousel export` job label and presentation.
2. Display tenant, deck title, deck revision, slide count, artifact count, total size, worker, attempt, and duration.
3. Replace review actions with artifact download actions.
4. Make exports visible in the global compute panel while keeping downloads tenant-authorized.
5. Preserve tenant context when navigating between an export and its carousel editor.
6. Explain expired artifacts without presenting the job itself as lost:

   ```text
   Export record available. Files expired after the retention period.
   Run another export to regenerate them.
   ```

### Acceptance criteria

- Carousel jobs follow the existing compute-panel hierarchy.
- Queue, render, upload, and finalization failures are distinguishable.
- No misleading review or apply language appears.

Estimated change: **80–140 lines**.

### Implementation notes — completed 2026-09-12

Phase 5 is implemented in the global compute panel and carousel editor.

- `carousel-export` is labeled **Carousel export** and is a kind filter, not a create-form option. Tenant and fleet queues list these jobs with the same inspector hierarchy as discovery and refresh.
- Inspector facts cover tenant, deck title, deck revision, slide count, artifact count, total size, worker, attempt, and duration. Queue, rendering, uploading, and finalization failures are named distinctly. Preview, apply, and application-audit copy are omitted.
- Completed jobs offer tenant-authorized ZIP and per-slide downloads. Expired artifacts keep the job record and show: “Export record available. Files expired after the retention period. Run another export to regenerate them.”
- Compute → editor and editor → compute links stay on the job’s tenant and pass `deckId` / `computeJobId`. The carousel page opens that deck when `deckId` is present.

Verification completed:

- Compute panel, format, carousel helper, export-panel, and export-hook tests passed (41).

## Phase 6 — Verification and rollout

### Automated verification

Cover:

1. Contract validation and worker capability matching.
2. Tenant and deck ownership.
3. Presigned upload authorization.
4. Artifact count, type, size, and checksum validation.
5. Duplicate creation, upload finalization, and result submission.
6. Playwright success, timeout, cancellation, and partial failure.
7. Restart during render, upload, and result submission.
8. Lease expiration and retry.
9. Frontend status restoration after reload.
10. ZIP and individual downloads.
11. Discovery and refresh regression coverage.

### Visual verification

Render representative decks containing remote images, image overrides, long text, every slide type, both editions, both ink-plate modes, and the maximum slide count. Compare Relay output against the existing local exporter at exact 1080x1350 dimensions.

### Deployment sequence

1. Deploy backward-compatible Meridian schema and worker endpoints.
2. Deploy artifact-storage configuration.
3. Deploy Relay with carousel capability disabled.
4. Run worker-handshake and artifact-upload diagnostics.
5. Enable `carousel-export` on one worker.
6. Enable the frontend flow for one tenant.
7. Complete and download a real export.
8. Restart Relay during a test export and verify recovery.
9. Expand to all Pivot tenants.
10. Monitor failure rates, cleanup, and storage consumption.

### Rollback

1. Disable the frontend feature flag.
2. Remove `carousel-export` from Relay's advertised capabilities.
3. Leave completed export records and artifacts readable.
4. Keep discovery and refresh workers operating normally.
5. Allow object-storage lifecycle rules to remove incomplete artifacts.

No destructive database rollback should be necessary because the new job kind and fields are additive.

### Implementation notes — completed 2026-09-12

Phase 6 adds rollout gates, diagnostics, and the remaining verification coverage.

Rollout controls:

- Relay `RELAY_ENABLE_CAROUSEL_EXPORT` (default on; set `false` to omit `carousel-export` from advertised kinds).
- Frontend `REACT_APP_ENABLE_CAROUSEL_EXPORT` and optional `REACT_APP_CAROUSEL_EXPORT_TENANTS`. Disabling hides new Export clicks; completed jobs and tenant-authorized downloads remain.
- Compute panel **Test export storage** runs `POST /admin/pivot/compute-jobs/artifact-diagnostic` (list `pivot-exports/`, mint a PUT URL, write nothing).

Automated verification:

- Contract kinds/capability, tenant download mismatch, presign grants, artifact MIME/size/completeness, duplicate create/finalize/result, Playwright timeout/cancel/partial upload retry, restart recovery for carousel, lease expiry sweep, frontend reload restore, ZIP/slide downloads, discovery/refresh contract and apply tests.
- Job-store persist now revalidates carousel records with `deckId`. Without that, local carousel jobs could not round-trip through `isJobRecord`, so restart recovery could not reload them.
- Visual matrix: every slide type, both editions, both ink-plate modes, remote images, image overrides, long copy, 20-slide cap, and the 1080×1350 export surface CSS. Pixel compare against a live Relay export remains an operator check.

Run `sh Meridian/docs/verify-carousel-export.sh` from the mono repo.

## Recommended implementation order

1. Worker restart recovery
2. Versioned carousel contract
3. Artifact upload and verification
4. Relay renderer integration
5. One-click frontend flow
6. Compute-panel presentation
7. End-to-end rollout

The central architectural rule is that image files are artifacts, not compute JSON. A separate verified artifact channel lets carousel exports share Relay's job lifecycle without weakening the size, safety, or tenant-isolation guarantees of discovery and refresh jobs.
