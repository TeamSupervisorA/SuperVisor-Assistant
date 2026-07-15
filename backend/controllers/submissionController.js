const Submission = require('../models/Submission');

exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find().populate('student', 'name email').populate('project', 'title').sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSubmission = async (req, res) => {
  try {
    req.body.student = req.user.id;
    const submission = await Submission.create(req.body);
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
