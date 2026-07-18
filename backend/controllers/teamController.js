const Team = require('../models/Team');
const Project = require('../models/Project');

const idOf = (ref) => (ref && ref._id ? ref._id : ref)?.toString();

// Leader of the team, its supervisor, or an admin may modify it
const canModifyTeam = (team, user) => {
  if (user.role === 'admin') return true;
  if (idOf(team.supervisor) === user.id) return true;
  return team.members.some(m => idOf(m.user) === user.id && m.role === 'Leader');
};

exports.getAllTeams = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;

    const teams = await Team.find(filter)
      .populate('project', 'title')
      .populate('supervisor', 'name email')
      .populate('members.user', 'name email');
    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('project', 'title').populate('supervisor', 'name email').populate('members.user', 'name email');
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const body = { ...req.body };

    if (req.user.role === 'student') {
      // Students may only create teams for projects they belong to,
      // and always become the team leader (proposal §4.2)
      const project = await Project.findById(body.project);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      if (!project.students.some(s => idOf(s) === req.user.id)) {
        return res.status(403).json({ success: false, error: 'You can only create a team for your own project' });
      }
      const members = (body.members || []).filter(m => idOf(m.user) !== req.user.id);
      body.members = [{ user: req.user.id, role: 'Leader' }, ...members];
      body.supervisor = project.supervisor || undefined;
    }

    const team = await Team.create(body);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    if (!canModifyTeam(team, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this team' });
    }

    team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    if (!canModifyTeam(team, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this team' });
    }

    await team.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
