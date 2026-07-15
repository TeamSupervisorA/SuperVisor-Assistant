const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a course code'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Please add a course name'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please select a department'],
    enum: ['Computer Science', 'Electrical Engineering', 'Business Admin', 'Other']
  },
  sections: {
    type: Number,
    default: 1
  },
  leadInstructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
