const mongoose = require('mongoose');

const aiInteractionSchema = new mongoose.Schema({
  feature: { type: String, required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  model: String,
  promptVersion: { type: String, default: 'v2' },
  input: { type: mongoose.Schema.Types.Mixed, required: true },
  output: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['succeeded', 'failed'], required: true },
  error: String,
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now, immutable: true }
}, { versionKey: false });

aiInteractionSchema.index({ project: 1, feature: 1, createdAt: -1 });

module.exports = mongoose.model('AIInteraction', aiInteractionSchema);
