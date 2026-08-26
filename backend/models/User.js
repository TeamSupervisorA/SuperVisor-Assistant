const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    // Google-only accounts do not have a local password unless the user
    // chooses to add one during (or after) profile completion.
    required: function passwordRequired() { return !this.googleId; },
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['student', 'supervisor', 'admin'],
    default: 'student'
  },
  institution: {
    type: mongoose.Schema.ObjectId,
    ref: 'Institution',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  studentId: {
    type: String,
    default: null
  },
  department: {
    type: String,
    default: null
  },
  departmentRef: {
    type: mongoose.Schema.ObjectId,
    ref: 'Department',
    default: null
  },
  batch: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    select: false
  },
  onboardingStatus: {
    type: String,
    enum: ['complete', 'google_profile_pending'],
    default: 'complete'
  },
  googleProfileToken: {
    type: String,
    select: false
  },
  googleProfileTokenExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  expertise: [{ type: String, trim: true, maxlength: 80 }],
  maxActiveTeams: {
    type: Number,
    min: 1,
    max: 50,
    default: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    aiChatbot: { type: Boolean, default: true },
    ideaGenerator: { type: Boolean, default: true },
    proposalFeedback: { type: Boolean, default: true },
    plagiarismAutoCheck: { type: Boolean, default: false },
    systemPrompt: { 
      type: String, 
      default: 'You are a strict but fair academic supervisor. Your primary role is to guide students through their research process without writing the content for them. Always encourage critical thinking and cite relevant methodological frameworks when offering feedback.' 
    },
    plagiarismTolerance: { type: Number, default: 20 }
  }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function encryptPasswordAndTrackChanges() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Subtract one second so a freshly-issued replacement token in the same
  // second remains valid while all earlier tokens are rejected.
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

// A sparse unique index with a `null` default would permit only one local
// account because MongoDB indexes that null. Index only actual string Google
// subject IDs so legacy/local accounts stay independent and a Google subject
// can never be linked to two profiles.
userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
