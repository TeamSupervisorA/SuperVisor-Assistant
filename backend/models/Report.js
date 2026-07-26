const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  type: { type: String, enum: ['progress', 'final'], default: 'progress' },
  version: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['requested', 'generating', 'ready', 'failed', 'archived'], default: 'requested' },
  snapshot: { type: mongoose.Schema.Types.Mixed },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  error: String,
  createdAt: { type: Date, default: Date.now, immutable: true },
  readyAt: Date
});

reportSchema.index({ project: 1, type: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
