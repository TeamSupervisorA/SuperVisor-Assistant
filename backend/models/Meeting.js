const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a meeting title']
  },
  date: {
    type: Date,
    required: [true, 'Please add a meeting date']
  },
  time: {
    type: String,
    required: [true, 'Please add a time']
  },
  type: {
    type: String,
    enum: ['Online', 'In-Person', 'Hybrid'],
    default: 'Online'
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  organizer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  attendees: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ],
  agenda: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Meeting', meetingSchema);
