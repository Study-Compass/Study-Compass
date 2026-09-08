const path = require('path');
const fs = require('fs');

const CONTRACT_VERSION = '1';

const COMPUTE_JOB_KINDS = Object.freeze([
  'city-source-discovery',
  'city-curation-refresh',
]);

const EXECUTION_OUTCOMES = Object.freeze(['completed', 'failed', 'cancelled']);

const PREVIEW_ACTIONS = Object.freeze([
  'create',
  'update',
  'unchanged',
  'conflict',
  'rejected',
  'stale',
]);

/** Keys that must never appear in importable execution results. */
const FORBIDDEN_IMPORTABLE_KEYS = Object.freeze([
  'command',
  'module',
  'filesystemPath',
  'callbackUrl',
  'callback',
  'credential',
  'credentials',
  'password',
  'apiKey',
  'secret',
  'token',
  'query',
  'sql',
  'logs',
  'memory',
  'mutex',
  'internalRunId',
  'vendorRunId',
  'relayJobId',
  'mongoConnectionString',
  'diagnostics',
  'steps',
]);

const ABSOLUTE_PATH_PATTERN = /(?:^|[\s'"`])(?:\/(?:Users|home|private|tmp|var\/folders)\/|[A-Za-z]:\\)/;
const CREDENTIAL_VALUE_PATTERN = /(?:api[_-]?key|secret|password|token|bearer)\s*[:=]/i;

const SCHEMAS = Object.freeze({
  jobRequest: loadSchema('job-request.v1.schema.json'),
  contextSnapshot: loadSchema('context-snapshot.v1.schema.json'),
  executionResult: loadSchema('execution-result.v1.schema.json'),
  diagnosticExport: loadSchema('diagnostic-export.v1.schema.json'),
  workerCapability: loadSchema('worker-capability.v1.schema.json'),
  resultPreview: loadSchema('result-preview.v1.schema.json'),
});

const FIXTURES_DIR = path.join(__dirname, '../contracts/pivot-admin-compute/fixtures');

function loadSchema(filename) {
  const raw = fs.readFileSync(
    path.join(__dirname, '../contracts/pivot-admin-compute', filename),
    'utf8',
  );
  return JSON.parse(raw);
}

function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) throw new Error(`Unsupported ref: ${ref}`);
  return ref
    .slice(2)
    .split('/')
    .reduce((value, segment) => value[segment], root);
}

function matchesSchema(value, node, root = node) {
  if (!node || typeof node !== 'object') return true;
  if (node.$ref) return matchesSchema(value, resolveRef(root, node.$ref), root);
  if (node.allOf) {
    return node.allOf.every((candidate) => matchesSchema(value, candidate, root));
  }
  if (node.oneOf) {
    return node.oneOf.filter((candidate) => matchesSchema(value, candidate, root)).length === 1;
  }
  if (Object.prototype.hasOwnProperty.call(node, 'const') && value !== node.const) return false;
  if (node.enum && !node.enum.includes(value)) return false;

  if (node.type === 'null') return value === null;
  if (node.type === 'boolean') return typeof value === 'boolean';
  if (node.type === 'integer') {
    if (!Number.isInteger(value)) return false;
    if (node.minimum != null && value < node.minimum) return false;
    if (node.maximum != null && value > node.maximum) return false;
    return true;
  }
  if (node.type === 'array') {
    if (!Array.isArray(value)) return false;
    if (node.minItems != null && value.length < node.minItems) return false;
    if (node.maxItems != null && value.length > node.maxItems) return false;
    if (node.items) return value.every((item) => matchesSchema(item, node.items, root));
    return true;
  }
  if (node.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const keys = Object.keys(value);
    if ((node.required || []).some((key) => !Object.prototype.hasOwnProperty.call(value, key))) {
      return false;
    }
    if (node.additionalProperties === false && keys.some((key) => !node.properties?.[key])) {
      return false;
    }
    return keys.every((key) => !node.properties?.[key] || matchesSchema(value[key], node.properties[key], root));
  }
  if (node.type === 'string') {
    if (typeof value !== 'string') return false;
    if (node.minLength != null && value.length < node.minLength) return false;
    if (node.maxLength != null && value.length > node.maxLength) return false;
    if (node.pattern && !new RegExp(node.pattern).test(value)) return false;
    if (node.format === 'date-time' && Number.isNaN(Date.parse(value))) return false;
    if (node.format === 'uri') {
      try {
        new URL(value);
      } catch {
        return false;
      }
    }
  }
  return true;
}

function collectForbiddenImportableViolations(value, trail = 'root', found = []) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenImportableViolations(item, `${trail}[${index}]`, found));
    return found;
  }
  for (const [key, child] of Object.entries(value)) {
    const normalized = String(key).toLowerCase();
    if (FORBIDDEN_IMPORTABLE_KEYS.some((forbidden) => forbidden.toLowerCase() === normalized)) {
      found.push(`${trail}.${key}`);
    }
    if (typeof child === 'string') {
      if (ABSOLUTE_PATH_PATTERN.test(child)) found.push(`${trail}.${key}:absolute-path`);
      if (CREDENTIAL_VALUE_PATTERN.test(child)) found.push(`${trail}.${key}:credential-like-value`);
    }
    collectForbiddenImportableViolations(child, `${trail}.${key}`, found);
  }
  return found;
}

function validateWithSchema(schema, value, { importable = false } = {}) {
  const errors = [];
  if (!matchesSchema(value, schema)) {
    errors.push('schema mismatch');
  }
  if (importable) {
    const forbidden = collectForbiddenImportableViolations(value);
    if (forbidden.length) {
      errors.push(`forbidden importable fields: ${forbidden.join(', ')}`);
    }
  }
  return errors.length ? { valid: false, errors } : { valid: true };
}

function validateJobRequest(value) {
  return validateWithSchema(SCHEMAS.jobRequest, value);
}

function validateContextSnapshot(value) {
  return validateWithSchema(SCHEMAS.contextSnapshot, value);
}

function validateExecutionResult(value) {
  return validateWithSchema(SCHEMAS.executionResult, value, { importable: true });
}

function validateDiagnosticExport(value) {
  return validateWithSchema(SCHEMAS.diagnosticExport, value);
}

function validateWorkerCapability(value) {
  return validateWithSchema(SCHEMAS.workerCapability, value);
}

function validateResultPreview(value) {
  return validateWithSchema(SCHEMAS.resultPreview, value);
}

function loadFixture(name) {
  const target = path.join(FIXTURES_DIR, name);
  return JSON.parse(fs.readFileSync(target, 'utf8'));
}

function listFixtures() {
  return fs.readdirSync(FIXTURES_DIR).filter((name) => name.endsWith('.json')).sort();
}

function isStaleContextPreview(preview, currentContextVersion) {
  return preview?.basedOnContextVersion !== currentContextVersion;
}

module.exports = {
  CONTRACT_VERSION,
  COMPUTE_JOB_KINDS,
  EXECUTION_OUTCOMES,
  PREVIEW_ACTIONS,
  FORBIDDEN_IMPORTABLE_KEYS,
  SCHEMAS,
  FIXTURES_DIR,
  matchesSchema,
  collectForbiddenImportableViolations,
  validateJobRequest,
  validateContextSnapshot,
  validateExecutionResult,
  validateDiagnosticExport,
  validateWorkerCapability,
  validateResultPreview,
  loadFixture,
  listFixtures,
  isStaleContextPreview,
};
