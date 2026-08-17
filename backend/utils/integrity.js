const crypto = require('crypto');

const normalizeIntegrityText = (value) => String(value || '')
  .replace(/\r\n?/g, '\n')
  .replace(/[\t ]+/g, ' ')
  .trim();

const integrityFingerprint = (value) => crypto
  .createHash('sha256')
  .update(normalizeIntegrityText(value), 'utf8')
  .digest('hex');

module.exports = { integrityFingerprint, normalizeIntegrityText };
