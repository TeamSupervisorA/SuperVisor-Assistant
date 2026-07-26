const mongoose = require('mongoose');

const proposalVersionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  versionNo: { type: Number, required: true, min: 1 },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  attachments: [{ name: String, fileUrl: String }],
  state: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'revision_requested', 'resubmitted', 'approved', 'rejected', 'archived'],
    default: 'draft'
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: Date,
  decision: {
    value: { type: String, enum: ['approved', 'rejected', 'revision_requested'] },
    comment: String,
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now }
});

proposalVersionSchema.index({ project: 1, versionNo: 1 }, { unique: true });
proposalVersionSchema.pre('save', function updateTimestamp() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('ProposalVersion', proposalVersionSchema);
