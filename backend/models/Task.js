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
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'blocked', 'done', 'cancelled', 'review', 'completed', 'delayed'],
    default: 'todo'
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  dueDate: {
    type: Date
  },
  dependencies: [{ type: mongoose.Schema.ObjectId, ref: 'Task' }],
  acceptanceCriteria: { type: String, default: '' },
  blockedReason: { type: String, default: '' },
  completedAt: Date,
  reviewSubmission: { type: mongoose.Schema.ObjectId, ref: 'Submission', default: null },
  reviewRequestedAt: Date,
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  evidence: [{ name: String, fileUrl: String }],
  history: [{
    actor: { type: mongoose.Schema.ObjectId, ref: 'User' },
    action: String,
    fromStatus: String,
    toStatus: String,
    note: String,
    submission: { type: mongoose.Schema.ObjectId, ref: 'Submission', default: null },
    occurredAt: { type: Date, default: Date.now }
  }],
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
