const Course = require('../models/Course');
const User = require('../models/User');
const { sendServerError } = require('../utils/errorResponse');

const validateLeadInstructor = async (leadInstructor) => {
  if (leadInstructor === undefined || leadInstructor === null || leadInstructor === '') return undefined;
  const user = await User.findOne({ _id: leadInstructor, role: { $in: ['supervisor', 'admin'] }, status: 'active' }).select('_id');
  if (!user) {
    const error = new Error('Lead instructor must be an active supervisor or administrator');
    error.statusCode = 422;
    throw error;
  }
  return user._id;
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('leadInstructor', 'name email');
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load courses');
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { code, name, department, sections, leadInstructor } = req.body;
    const course = await Course.create({ code, name, department, sections, leadInstructor: await validateLeadInstructor(leadInstructor) });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const permittedFields = ['code', 'name', 'department', 'sections', 'leadInstructor'];
    const updates = Object.fromEntries(
      permittedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (Object.keys(updates).length === 0) {
      return res.status(422).json({ success: false, error: 'No supported course fields were provided' });
    }
    if (Object.hasOwn(updates, 'leadInstructor')) updates.leadInstructor = await validateLeadInstructor(updates.leadInstructor);
    const course = await Course.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true
    });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};
