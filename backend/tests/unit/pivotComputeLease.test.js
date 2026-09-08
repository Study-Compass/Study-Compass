const {
  assertLeaseBinding,
  buildLeaseBinding,
  buildJobObservation,
  createWorkerContextAuthorizer,
} = require('../../services/pivotComputeLease');

describe('pivotComputeLease', () => {
  const now = new Date('2026-09-08T20:05:00.000Z');
  const capability = {
    contractVersion: '1',
    implementationRevision: 'relay-worker@test',
    supportedContractVersions: ['1'],
    supportedKinds: ['city-source-discovery'],
  };
  const job = {
    externalJobId: 'job:discovery-iowacity-001',
    status: 'leased',
    cancelRequested: false,
    contextVersion: 'ctx:iowacity.discovery.v1',
    lease: {
      token: 'lease-token-1',
      workerId: 'relay-mini-1',
      attemptNumber: 1,
      attemptId: 'attempt-1',
      expiresAt: new Date('2026-09-08T20:10:00.000Z'),
      capability,
    },
  };

  it('builds a lease binding with capability metadata', () => {
    expect(buildLeaseBinding(job)).toEqual({
      jobId: 'job:discovery-iowacity-001',
      workerId: 'relay-mini-1',
      attemptId: 'attempt-1',
      attemptNumber: 1,
      leaseToken: 'lease-token-1',
      expiresAt: job.lease.expiresAt,
      capability,
      attemptLeaseToken: 'lease-token-1',
    });
  });

  it('accepts a valid active lease binding', () => {
    expect(assertLeaseBinding({
      job,
      workerId: 'relay-mini-1',
      leaseToken: 'lease-token-1',
      capability,
      now,
    })).toMatchObject({ leaseToken: 'lease-token-1' });
  });

  it('rejects lease token mismatches', () => {
    expect(() => assertLeaseBinding({
      job,
      workerId: 'relay-mini-1',
      leaseToken: 'wrong-token',
      now,
    })).toThrow(/lease token mismatch/);
  });

  it('rejects expired leases when active lease is required', () => {
    expect(() => assertLeaseBinding({
      job,
      workerId: 'relay-mini-1',
      leaseToken: 'lease-token-1',
      now: new Date('2026-09-08T21:00:00.000Z'),
    })).toThrow(/lease expired/);
  });

  it('authorizes context access only for the recorded job and city', async () => {
    const authorize = createWorkerContextAuthorizer({
      workerId: 'relay-mini-1',
      externalJobId: 'job:discovery-iowacity-001',
      cityKey: 'iowacity',
      kind: 'city-source-discovery',
      scheduleOccurrenceId: 'sched:discovery-iowacity@2026-09-08T12:00:00.000Z',
    });

    await expect(authorize({
      jobId: 'job:discovery-iowacity-001',
      cityKey: 'iowacity',
      kind: 'city-source-discovery',
      scheduleOccurrenceId: 'sched:discovery-iowacity@2026-09-08T12:00:00.000Z',
    })).resolves.toBeNull();

    await expect(authorize({
      jobId: 'job:other',
      cityKey: 'iowacity',
      kind: 'city-source-discovery',
      scheduleOccurrenceId: 'sched:discovery-iowacity@2026-09-08T12:00:00.000Z',
    })).resolves.toMatchObject({ code: 'COMPUTE_WORKER_JOB_FORBIDDEN' });
  });

  it('builds cancellation observation without exposing secrets', () => {
    expect(buildJobObservation({
      ...job,
      cancelRequested: true,
      status: 'running',
    })).toEqual({
      externalJobId: 'job:discovery-iowacity-001',
      status: 'running',
      cancelRequested: true,
      contextVersion: 'ctx:iowacity.discovery.v1',
      lease: {
        expiresAt: job.lease.expiresAt,
        workerId: 'relay-mini-1',
        attemptNumber: 1,
      },
    });
  });
});
