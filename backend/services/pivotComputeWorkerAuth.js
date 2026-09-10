const bcrypt = require('bcrypt');
const { validateWorkerCapability } = require('../utilities/pivotAdminComputeJobContract');

const WORKER_ID_HEADER = 'x-pivot-compute-worker-id';
const MAX_WORKER_SECRET_LENGTH = 256;
const MAX_WORKER_ID_LENGTH = 128;

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function redactAuthorizationHeader(value) {
  const raw = trimString(value);
  if (!raw) return '[redacted]';
  return '[redacted]';
}

function parseWorkerCredentials(rawValue) {
  if (!rawValue) return [];
  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error('PIVOT_COMPUTE_WORKER_CREDENTIALS must be valid JSON');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('PIVOT_COMPUTE_WORKER_CREDENTIALS must be a JSON array');
  }
  return parsed.map((entry, index) => {
    const workerId = trimString(entry?.workerId);
    const secretHash = trimString(entry?.secretHash);
    if (!workerId || !secretHash) {
      throw new Error(`PIVOT_COMPUTE_WORKER_CREDENTIALS[${index}] requires workerId and secretHash`);
    }
    if (workerId.length > MAX_WORKER_ID_LENGTH) {
      throw new Error(`PIVOT_COMPUTE_WORKER_CREDENTIALS[${index}] workerId is too long`);
    }
    return { workerId, secretHash };
  });
}

function createWorkerCredentialVerifier(credentials = []) {
  const byWorkerId = new Map(credentials.map((entry) => [entry.workerId, entry.secretHash]));
  async function verifyWorkerCredential(workerId, secret) {
    const normalizedWorkerId = trimString(workerId);
    const normalizedSecret = trimString(secret);
    if (!normalizedWorkerId || !normalizedSecret || normalizedSecret.length > MAX_WORKER_SECRET_LENGTH) {
      return false;
    }
    const secretHash = byWorkerId.get(normalizedWorkerId);
    if (!secretHash) return false;
    return bcrypt.compare(normalizedSecret, secretHash);
  }
  verifyWorkerCredential.__credentialCount = credentials.length;
  return verifyWorkerCredential;
}

function resolveWorkerCredentialVerifier(env = process.env, injectedCredentials = null) {
  if (Array.isArray(injectedCredentials)) {
    return createWorkerCredentialVerifier(injectedCredentials);
  }
  const credentials = parseWorkerCredentials(env.PIVOT_COMPUTE_WORKER_CREDENTIALS);
  return createWorkerCredentialVerifier(credentials);
}

function extractWorkerAuth(req) {
  const workerId = trimString(req.headers[WORKER_ID_HEADER]);
  const authorization = trimString(req.headers.authorization);
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const secret = match ? trimString(match[1]) : '';
  return { workerId, secret };
}

function createComputeWorkerAuthMiddleware({
  verifyWorkerCredential,
  failClosedWhenUnconfigured = true,
} = {}) {
  if (!verifyWorkerCredential) {
    throw new Error('verifyWorkerCredential is required');
  }

  return async function requireComputeWorkerAuth(req, res, next) {
    try {
      if (failClosedWhenUnconfigured && verifyWorkerCredential.__credentialCount === 0) {
        return res.status(503).json({
          error: 'Compute worker credentials are not configured',
          code: 'COMPUTE_WORKER_AUTH_UNAVAILABLE',
        });
      }

      const { workerId, secret } = extractWorkerAuth(req);
      if (!workerId || !secret) {
        return res.status(401).json({
          error: 'Compute worker authentication required',
          code: 'COMPUTE_WORKER_AUTH_REQUIRED',
        });
      }

      const valid = await verifyWorkerCredential(workerId, secret);
      if (!valid) {
        return res.status(401).json({
          error: 'Invalid compute worker credentials',
          code: 'COMPUTE_WORKER_AUTH_INVALID',
        });
      }

      req.computeWorker = { workerId };
      return next();
    } catch (error) {
      return res.status(500).json({
        error: 'Compute worker authentication failed',
        code: 'COMPUTE_WORKER_AUTH_ERROR',
      });
    }
  };
}

function normalizeWorkerCapabilityPayload(payload, workerId) {
  const validation = validateWorkerCapability(payload);
  if (!validation.valid) {
    const error = new Error(`Invalid worker capability: ${validation.errors.join(', ')}`);
    error.code = 'INVALID_WORKER_CAPABILITY';
    throw error;
  }
  if (trimString(payload.workerId) !== trimString(workerId)) {
    const error = new Error('Worker capability workerId mismatch');
    error.code = 'WORKER_CAPABILITY_ID_MISMATCH';
    throw error;
  }
  return {
    contractVersion: payload.contractVersion,
    workerId: payload.workerId,
    implementationRevision: payload.implementationRevision,
    supportedContractVersions: payload.supportedContractVersions,
    supportedKinds: payload.supportedKinds,
    capabilities: payload.capabilities,
    advertisedAt: payload.advertisedAt,
  };
}

module.exports = {
  WORKER_ID_HEADER,
  MAX_WORKER_SECRET_LENGTH,
  redactAuthorizationHeader,
  parseWorkerCredentials,
  createWorkerCredentialVerifier,
  resolveWorkerCredentialVerifier,
  extractWorkerAuth,
  createComputeWorkerAuthMiddleware,
  normalizeWorkerCapabilityPayload,
};
