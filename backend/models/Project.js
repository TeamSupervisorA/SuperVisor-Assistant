const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a project title']
  },
  description: {
    type: String
  },
  supervisor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null // Student proposals start without a supervisor; assigned later
  },
  students: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['proposed', 'active', 'completed', 'on_hold'],
    default: 'active'
  },
  proposalState: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'revision_requested', 'resubmitted', 'approved', 'rejected', 'archived'],
    default: 'draft'
  },
  approvedProposalVersion: {
    type: mongoose.Schema.ObjectId,
    ref: 'ProposalVersion',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);
