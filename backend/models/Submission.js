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
    required: [true, 'Please provide the file URL']
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
