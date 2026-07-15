const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

exports.getAdminMetrics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'supervisor' });
    const activeProjects = await Project.countDocuments({ status: { $in: ['pending', 'in_progress'] } });
    
    // In a real app we'd query for submissions, we'll mock these for now
    const assignmentsSubmitted = 312;
    const plagiarismAlerts = 5;

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
    
    // Just mock others for now since we don't have full meeting/submission schemas yet
    const pendingReviews = 8;
    const plagiarismAlerts = 3;
    const upcomingMeetings = 2;

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
