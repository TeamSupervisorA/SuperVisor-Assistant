const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  section: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  explanation: { type: String, required: true },
  recommendation: String,
  source: { type: String, enum: ['supervisor', 'ai'], default: 'supervisor' },
  resolutionNote: String,
  resolvedAt: Date
}, { _id: true });

const reviewSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  proposalVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'ProposalVersion', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  state: { type: String, enum: ['draft', 'submitted', 'acknowledged', 'resolved', 'superseded'], default: 'draft' },
  rubric: { type: mongoose.Schema.Types.Mixed, default: {} },
  findings: [findingSchema],
  overallComment: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reviewSchema.pre('save', function updateTimestamp() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Review', reviewSchema);
