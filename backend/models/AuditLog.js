const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, trim: true },
  entityType: { type: String, required: true, trim: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now, immutable: true }
}, { versionKey: false });

auditLogSchema.index({ entityType: 1, entityId: 1, occurredAt: -1 });
auditLogSchema.index({ actor: 1, occurredAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
