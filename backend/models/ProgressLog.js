const mongoose = require('mongoose');

const progressLogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStart: { type: Date, required: true },
  summary: { type: String, required: true, trim: true },
  blockers: { type: String, default: '' },
  evidence: [{ name: String, fileUrl: String }],
  state: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  submittedAt: Date,
  supervisorResponse: {
    message: { type: String, trim: true, maxlength: 3000, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    respondedAt: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

progressLogSchema.index({ project: 1, author: 1, weekStart: 1 }, { unique: true });
progressLogSchema.pre('save', function updateTimestamp() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('ProgressLog', progressLogSchema);
