const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Meeting = require('../models/Meeting');
const PlagiarismReport = require('../models/PlagiarismReport');

exports.getAdminMetrics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'supervisor' });
    const activeProjects = await Project.countDocuments({ status: { $in: ['proposed', 'active'] } });
    
    // Real counts from submissions and plagiarism reports
    const assignmentsSubmitted = await Submission.countDocuments();
    const plagiarismAlerts = await PlagiarismReport.countDocuments({
      status: 'Completed',
      overallSimilarity: { $gte: 20 }
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        activeProjects,
        assignmentsSubmitted,
        plagiarismAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSupervisorMetrics = async (req, res) => {
  try {
    const supervisorId = req.user._id;

    // Count projects where this user is the supervisor
    const assignedTeams = await Project.countDocuments({ supervisor: supervisorId });

    const supervisedProjects = await Project.find({ supervisor: supervisorId }).select('_id');
    const projectIds = supervisedProjects.map(p => p._id);

    // Submissions awaiting review on supervised projects
    const pendingReviews = await Submission.countDocuments({
      project: { $in: projectIds },
      status: { $in: ['Submitted', 'Under Review'] }
    });

    // Upcoming meetings for supervised projects
    const upcomingMeetings = await Meeting.countDocuments({
      project: { $in: projectIds },
      status: 'Upcoming',
      date: { $gte: new Date() }
    });

    // Plagiarism alerts: completed reports above a similarity threshold
    const plagiarismAlerts = await PlagiarismReport.countDocuments({
      project: { $in: projectIds },
      status: 'Completed',
      overallSimilarity: { $gte: 20 }
    });

    res.status(200).json({
      success: true,
      data: {
        assignedTeams,
        pendingReviews,
        plagiarismAlerts,
        upcomingMeetings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStudentMetrics = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Count projects the student is part of
    const activeProjects = await Project.countDocuments({
      students: studentId,
      status: { $in: ['proposed', 'active'] }
    });

    // Count tasks
    const totalTasks = await Task.countDocuments({ assignedTo: studentId });
    const completedTasks = await Task.countDocuments({ assignedTo: studentId, status: 'completed' });

    // Pending feedback (submitted but not graded)
    const pendingFeedback = await Submission.countDocuments({
      student: studentId,
      status: { $in: ['Submitted', 'Under Review'] }
    });

    // Next deadline — find nearest future task due date
    const nextTask = await Task.findOne({
      assignedTo: studentId,
      status: { $ne: 'completed' },
      dueDate: { $gte: new Date() }
    }).sort({ dueDate: 1 }).lean();

    const daysUntilDeadline = nextTask?.dueDate
      ? Math.max(0, Math.ceil((new Date(nextTask.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))
      : null;

    res.status(200).json({
      success: true,
      data: {
        activeProjects,
        completedTasks,
        totalTasks,
        pendingFeedback,
        daysUntilDeadline,
        nextMilestone: nextTask?.title || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
