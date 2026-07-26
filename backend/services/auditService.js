const AuditLog = require('../models/AuditLog');

exports.recordAudit = async ({ actor, action, entityType, entityId, metadata = {} }) => {
  try {
    await AuditLog.create({ actor, action, entityType, entityId, metadata });
  } catch (error) {
    // Audit failures are logged without exposing sensitive request data or breaking the user workflow.
    console.error('Audit write failed:', error.message);
  }
};
