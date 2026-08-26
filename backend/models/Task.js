const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a task title']
  },
  description: {
    type: String
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  // New tasks always set this in the controller; null remains readable for
  // records created before task authorship was introduced.
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  kind: { type: String, enum: ['official', 'suggestion'], default: 'official' },
  suggestionState: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'accepted' },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'blocked', 'review', 'revision', 'done', 'cancelled', 'completed', 'delayed'],
    default: 'todo'
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  dueDate: {
    type: Date
  },
  dependencies: [{ type: mongoose.Schema.ObjectId, ref: 'Task' }],
  milestone: { type: mongoose.Schema.ObjectId, default: null },
  phase: { type: String, trim: true, maxlength: 100, default: '' },
  requiredDeliverable: { type: String, trim: true, maxlength: 240, default: '' },
  acceptanceCriteria: { type: String, default: '' },
  blockedReason: { type: String, default: '' },
  completedAt: Date,
  reviewSubmission: { type: mongoose.Schema.ObjectId, ref: 'Submission', default: null },
  reviewRequestedAt: Date,
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  evidence: [{
    name: { type: String, trim: true, maxlength: 240 },
    fileUrl: { type: String, trim: true, maxlength: 2000 },
    note: { type: String, trim: true, maxlength: 3000, default: '' },
    submission: { type: mongoose.Schema.ObjectId, ref: 'Submission', default: null },
    addedBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    addedAt: { type: Date, default: Date.now }
  }],
  history: [{
    actor: { type: mongoose.Schema.ObjectId, ref: 'User' },
    action: String,
    fromStatus: String,
    toStatus: String,
    note: String,
    submission: { type: mongoose.Schema.ObjectId, ref: 'Submission', default: null },
    occurredAt: { type: Date, default: Date.now }
  }],
  comments: [{
    author: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    kind: { type: String, enum: ['comment', 'supervisor_instruction'], default: 'comment' },
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: null }
  }],
  revisionNumber: { type: Number, min: 0, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

taskSchema.virtual('isDelayed').get(function delayedTask() {
  return Boolean(this.dueDate && this.dueDate < new Date() && !['done', 'completed', 'cancelled'].includes(this.status));
});

taskSchema.index({ project: 1, status: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
