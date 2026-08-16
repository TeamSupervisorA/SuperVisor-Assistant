const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a project title']
  },
  description: {
    type: String
  },
  department: {
    type: String,
    trim: true,
    maxlength: 120,
    default: null
  },
  section: {
    type: String,
    trim: true,
    maxlength: 80,
    default: null
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
  supervisionSource: {
    type: String,
    enum: ['unassigned', 'student_invitation', 'supervisor_claim', 'admin_assignment'],
    default: 'unassigned'
  },
  supervisorAssignedAt: {
    type: Date,
    default: null
  },
  supervisorAssignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);
