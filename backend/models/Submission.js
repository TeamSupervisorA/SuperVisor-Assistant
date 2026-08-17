const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a submission title']
  },
  task: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    trim: true,
    maxlength: [2000, 'File URL cannot exceed 2,000 characters'],
    required: function requireFileWhenNoText() {
      return !String(this.content || '').trim();
    }
  },
  milestone: { type: mongoose.Schema.ObjectId, default: null },
  proposalVersion: { type: mongoose.Schema.ObjectId, ref: 'ProposalVersion', default: null },
  content: {
    type: String,
    default: '',
    maxlength: [60000, 'Submission text cannot exceed 60,000 characters']
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Graded', 'Needs Revision'],
    default: 'Submitted'
  },
  grade: {
    type: String
  },
  feedback: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', submissionSchema);
