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
  startsAtUtc: { type: Date, required: true, index: true },
  timezone: { type: String, trim: true, default: 'Asia/Dhaka' },
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
    type: String,
    required: [true, 'Please add a meeting agenda'],
    trim: true,
    maxlength: 5000
  },
  meetingLink: { type: String, trim: true, maxlength: 2000, default: '' },
  location: { type: String, trim: true, maxlength: 300, default: '' },
  notes: {
    type: String
  },
  minutes: { type: String, default: '' },
  followUpActions: [{
    text: { type: String, required: true },
    owner: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    dueDate: Date,
    completed: { type: Boolean, default: false }
  }],
  cancellationReason: { type: String, default: '' },
  rescheduledFrom: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
