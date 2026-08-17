const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.ObjectId,
    ref: 'Institution',
    default: null,
    index: true
  },
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
  projectType: {
    type: String,
    enum: ['thesis', 'capstone', 'course_project', 'research', 'software', 'other'],
    default: 'research'
  },
  course: { type: mongoose.Schema.ObjectId, ref: 'Course', default: null },
  academicYear: { type: String, trim: true, maxlength: 40, default: null },
  timezone: { type: String, trim: true, maxlength: 80, default: 'Asia/Dhaka' },
  expectedStartDate: { type: Date, default: null },
  expectedEndDate: { type: Date, default: null },
  supervisor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null // Student proposals start without a supervisor; assigned later
  },
  students: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  leaderUserId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  memberInvitations: [{
    email: { type: String, lowercase: true, trim: true },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    invitedBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    state: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    respondedAt: Date
  }],
  supervisorInvitations: [{
    supervisor: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    invitedBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    message: { type: String, maxlength: 500, default: '' },
    state: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    respondedAt: Date
  }],
  status: {
    type: String,
    enum: ['draft', 'awaiting_supervisor', 'awaiting_approval', 'proposed', 'active', 'completed', 'on_hold', 'archived'],
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
  supervisorHistory: [{
    supervisor: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['student_invitation', 'supervisor_claim', 'admin_assignment'], required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    endReason: { type: String, trim: true, maxlength: 500, default: '' }
  }],
  milestones: [{
    title: { type: String, required: true, trim: true, maxlength: 160 },
    phase: { type: String, trim: true, maxlength: 100, default: '' },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: ['planned', 'active', 'completed', 'cancelled'], default: 'planned' },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.index({ 'memberInvitations.email': 1, 'memberInvitations.state': 1 });
projectSchema.index({ 'supervisorInvitations.supervisor': 1, 'supervisorInvitations.state': 1 });
projectSchema.index({ institution: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
