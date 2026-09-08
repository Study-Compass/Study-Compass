const crypto = require('crypto');

function stableHash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function shortHash(value) {
  return stableHash(value).slice(0, 12);
}

function recordVersion(prefix, material) {
  return `rv:${prefix}-${shortHash(JSON.stringify(material))}`;
}

function discoveryContextVersion(cityKey, material) {
  return `ctx:${cityKey}.discovery.${shortHash(JSON.stringify(material))}`;
}

function refreshContextVersion(cityKey, material) {
  return `ctx:${cityKey}.refresh.${shortHash(JSON.stringify(material))}`;
}

function resolveImplementationRevision(env = process.env) {
  const explicit = trimString(env.MERIDIAN_IMPLEMENTATION_REVISION);
  if (explicit && /^[a-zA-Z0-9@._+-]+$/.test(explicit)) return explicit;
  return 'meridian-backend@local';
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isoTimestamp(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  return null;
}

module.exports = {
  stableHash,
  shortHash,
  recordVersion,
  discoveryContextVersion,
  refreshContextVersion,
  resolveImplementationRevision,
  isoTimestamp,
};
