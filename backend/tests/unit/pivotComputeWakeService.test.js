const { createHmac } = require('crypto');
const {
  WAKE_PATH,
  WAKE_TIMESTAMP_HEADER,
  WAKE_NONCE_HEADER,
  WAKE_SIGNATURE_HEADER,
  resolveWakeUrl,
  deliverComputeWorkerWake,
  notifyComputeWorkerWake,
} = require('../../services/pivotComputeWakeService');

const HMAC_KEY = 'aa'.repeat(32);
const NOW_MS = Date.parse('2026-09-09T20:00:00.000Z');
const NONCE = 'wake-nonce-1234567890abcdef';

describe('pivotComputeWakeService', () => {
  it('stays disabled when no wake URL is configured', async () => {
    await expect(deliverComputeWorkerWake({ env: {} })).resolves.toEqual({ status: 'disabled' });
  });

  it('signs and sends the Relay empty-body wake contract', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ status: 202 });
    const result = await deliverComputeWorkerWake({
      env: {
        PIVOT_COMPUTE_WAKE_URL: 'https://mini.example.test',
        PIVOT_COMPUTE_WAKE_HMAC_KEY: HMAC_KEY,
      },
      fetchImpl,
      now: () => NOW_MS,
      createNonce: () => NONCE,
    });

    const expectedPayload = `POST\n${WAKE_PATH}\n${NOW_MS}\n${NONCE}\n`;
    const expectedSignature = createHmac('sha256', Buffer.from(HMAC_KEY, 'hex'))
      .update(Buffer.from(expectedPayload, 'utf8'))
      .digest('hex');

    expect(result).toEqual({ status: 'accepted', httpStatus: 202 });
    expect(fetchImpl).toHaveBeenCalledWith(
      `https://mini.example.test${WAKE_PATH}`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          [WAKE_TIMESTAMP_HEADER]: String(NOW_MS),
          [WAKE_NONCE_HEADER]: NONCE,
          [WAKE_SIGNATURE_HEADER]: expectedSignature,
          'content-length': '0',
        },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('requires https for production delivery', () => {
    expect(() => resolveWakeUrl('http://mini.example.test/v1/wake', { requireHttps: true }))
      .toThrow('must use https in production');
  });

  it('contains rejected delivery so the durable job path can still succeed', async () => {
    const result = await notifyComputeWorkerWake({
      env: {
        PIVOT_COMPUTE_WAKE_URL: 'https://mini.example.test/v1/wake',
        PIVOT_COMPUTE_WAKE_HMAC_KEY: HMAC_KEY,
      },
      fetchImpl: jest.fn().mockResolvedValue({ status: 503 }),
      now: () => NOW_MS,
      createNonce: () => NONCE,
    });

    expect(result).toEqual({
      status: 'failed',
      code: 'COMPUTE_WAKE_REJECTED',
      httpStatus: 503,
    });
  });

  it('contains network failures so reconciliation can recover the pending job', async () => {
    const result = await notifyComputeWorkerWake({
      env: {
        PIVOT_COMPUTE_WAKE_URL: 'https://mini.example.test/v1/wake',
        PIVOT_COMPUTE_WAKE_HMAC_KEY: HMAC_KEY,
      },
      fetchImpl: jest.fn().mockRejectedValue(new Error('offline')),
      now: () => NOW_MS,
      createNonce: () => NONCE,
    });

    expect(result).toEqual({
      status: 'failed',
      code: 'COMPUTE_WAKE_FAILED',
      httpStatus: undefined,
    });
  });
});
