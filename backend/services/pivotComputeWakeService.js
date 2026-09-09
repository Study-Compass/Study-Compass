const { createHmac, randomBytes } = require('crypto');
const { logPivot } = require('../utilities/pivotLogger');

const WAKE_PATH = '/v1/wake';
const WAKE_TIMESTAMP_HEADER = 'x-relay-wake-timestamp';
const WAKE_NONCE_HEADER = 'x-relay-wake-nonce';
const WAKE_SIGNATURE_HEADER = 'x-relay-wake-signature';
const MIN_WAKE_HMAC_KEY_BYTES = 32;
const DEFAULT_WAKE_TIMEOUT_MS = 2000;
const MIN_WAKE_TIMEOUT_MS = 250;
const MAX_WAKE_TIMEOUT_MS = 5000;

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveWakeUrl(rawValue, { requireHttps = false } = {}) {
  const value = trimString(rawValue);
  if (!value) return null;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('PIVOT_COMPUTE_WAKE_URL must use http or https');
  }
  if (requireHttps && url.protocol !== 'https:') {
    throw new Error('PIVOT_COMPUTE_WAKE_URL must use https in production');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('PIVOT_COMPUTE_WAKE_URL must not contain credentials, a query, or a fragment');
  }
  if (!url.pathname.endsWith(WAKE_PATH)) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}${WAKE_PATH}`;
  }
  return url;
}

function decodeWakeHmacKey(rawValue) {
  const value = trimString(rawValue);
  if (!value) throw new Error('PIVOT_COMPUTE_WAKE_HMAC_KEY is required');
  const key = /^[0-9a-fA-F]+$/.test(value)
    && value.length >= MIN_WAKE_HMAC_KEY_BYTES * 2
    && value.length % 2 === 0
    ? Buffer.from(value, 'hex')
    : Buffer.from(value, 'utf8');
  if (key.length < MIN_WAKE_HMAC_KEY_BYTES) {
    throw new Error('PIVOT_COMPUTE_WAKE_HMAC_KEY must be at least 32 bytes');
  }
  return key;
}

function resolveWakeTimeoutMs(rawValue) {
  const parsed = Number(trimString(rawValue));
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_WAKE_TIMEOUT_MS;
  return Math.min(MAX_WAKE_TIMEOUT_MS, Math.max(MIN_WAKE_TIMEOUT_MS, Math.floor(parsed)));
}

function computeWakeSignature({ timestampMs, nonce, hmacKey }) {
  const payload = Buffer.from(`POST\n${WAKE_PATH}\n${timestampMs}\n${nonce}\n`, 'utf8');
  return createHmac('sha256', hmacKey).update(payload).digest('hex');
}

async function deliverComputeWorkerWake({
  env = process.env,
  fetchImpl = global.fetch,
  now = () => Date.now(),
  createNonce = () => randomBytes(16).toString('hex'),
} = {}) {
  const wakeUrl = resolveWakeUrl(env.PIVOT_COMPUTE_WAKE_URL, {
    requireHttps: env.NODE_ENV === 'production',
  });
  if (!wakeUrl) return { status: 'disabled' };
  if (typeof fetchImpl !== 'function') throw new Error('Wake delivery requires fetch');

  const hmacKey = decodeWakeHmacKey(env.PIVOT_COMPUTE_WAKE_HMAC_KEY);
  const timestampMs = now();
  const nonce = createNonce();
  const signature = computeWakeSignature({ timestampMs, nonce, hmacKey });
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    resolveWakeTimeoutMs(env.PIVOT_COMPUTE_WAKE_TIMEOUT_MS),
  );
  timeout.unref?.();

  try {
    const response = await fetchImpl(wakeUrl.toString(), {
      method: 'POST',
      headers: {
        [WAKE_TIMESTAMP_HEADER]: String(timestampMs),
        [WAKE_NONCE_HEADER]: nonce,
        [WAKE_SIGNATURE_HEADER]: signature,
        'content-length': '0',
      },
      signal: controller.signal,
    });
    if (response.status !== 202) {
      const error = new Error(`Compute worker wake returned ${response.status}`);
      error.code = 'COMPUTE_WAKE_REJECTED';
      error.status = response.status;
      throw error;
    }
    return { status: 'accepted', httpStatus: response.status };
  } finally {
    clearTimeout(timeout);
  }
}

async function notifyComputeWorkerWake(options = {}) {
  try {
    return await deliverComputeWorkerWake(options);
  } catch (error) {
    logPivot('warn', 'compute worker wake failed', {
      code: error?.code || 'COMPUTE_WAKE_FAILED',
      status: error?.status,
      message: error?.message || String(error),
    });
    return {
      status: 'failed',
      code: error?.code || 'COMPUTE_WAKE_FAILED',
      httpStatus: error?.status,
    };
  }
}

module.exports = {
  WAKE_PATH,
  WAKE_TIMESTAMP_HEADER,
  WAKE_NONCE_HEADER,
  WAKE_SIGNATURE_HEADER,
  DEFAULT_WAKE_TIMEOUT_MS,
  resolveWakeUrl,
  decodeWakeHmacKey,
  resolveWakeTimeoutMs,
  computeWakeSignature,
  deliverComputeWorkerWake,
  notifyComputeWorkerWake,
};
