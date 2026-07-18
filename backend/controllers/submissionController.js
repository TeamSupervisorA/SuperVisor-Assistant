const Submission = require('../models/Submission');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// Notifications are best-effort — never fail the main operation over one
const notify = async (fields) => {
  try {
    await Notification.create(fields);
  } catch (e) { /* non-fatal */ }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    // Students only see their own submissions
    if (req.user.role === 'student') filter.student = req.user.id;

    const submissions = await Submission.find(filter).populate('student', 'name email').populate('project', 'title').sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSubmission = async (req, res) => {
  try {
    req.body.student = req.user.id;
    const submission = await Submission.create(req.body);

    // Let the supervisor know a new deliverable is waiting for review
    const project = await Project.findById(submission.project).select('title supervisor');
    if (project?.supervisor) {
      await notify({
        user: project.supervisor,
        title: 'New submission to review',
        message: `${req.user.name} submitted "${submission.title}" for "${project.title}".`,
        type: 'info',
        link: '/evaluations'
      });
    }

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    let submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

    let updates = req.body;
    if (req.user.role === 'student') {
      // Students may only edit their own submission, and never grading fields
      if (submission.student.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this submission' });
      }
      const { grade, feedback, status, student, ...allowed } = updates;
      updates = allowed;
    }

    const wasGraded = req.user.role !== 'student' && (updates.grade || updates.feedback || updates.status === 'Needs Revision');
    submission = await Submission.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    if (wasGraded) {
      await notify({
        user: submission.student,
        title: updates.status === 'Needs Revision' ? 'Revision requested' : 'Feedback received',
        message: `Your submission "${submission.title}" has been reviewed${updates.grade ? ` — grade: ${updates.grade}` : ''}.`,
        type: updates.status === 'Needs Revision' ? 'warning' : 'success',
        link: '/student-submissions'
      });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

    if (req.user.role === 'student' && submission.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this submission' });
    }

    await submission.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
