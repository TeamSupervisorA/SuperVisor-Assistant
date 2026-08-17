const mongoose = require('mongoose');

const defaultRubric = () => ([
  { key: 'problemUnderstanding', label: 'Problem understanding', maxScore: 10, description: 'Clarity and relevance of the problem definition.' },
  { key: 'methodology', label: 'Methodology', maxScore: 20, description: 'Suitability, rigour and reproducibility of the method.' },
  { key: 'implementation', label: 'Implementation', maxScore: 30, description: 'Quality of execution, evidence and analysis.' },
  { key: 'documentation', label: 'Documentation', maxScore: 40, description: 'Academic writing, structure, citations and presentation.' }
]);

const courseSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.ObjectId, ref: 'Institution', default: null, index: true },
  code: {
    type: String,
    required: [true, 'Please add a course code'],
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
    trim: true
  },
  sections: {
    type: Number,
    default: 1,
    min: [1, 'A course must have at least one section']
  },
  leadInstructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  },
  rubric: {
    version: { type: Number, default: 1, min: 1 },
    criteria: {
      type: [{
        _id: false,
        key: { type: String, required: true, trim: true, maxlength: 60 },
        label: { type: String, required: true, trim: true, maxlength: 120 },
        maxScore: { type: Number, required: true, min: 1, max: 100 },
        description: { type: String, trim: true, maxlength: 500, default: '' }
      }],
      default: defaultRubric
    }
  }
}, {
  timestamps: true
});

courseSchema.index({ institution: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
module.exports.defaultRubric = defaultRubric;
