const Team = require('../models/Team');
const { Project, idOf, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const LeaderHistory = require('../models/LeaderHistory');
const { recordAudit } = require('../services/auditService');
const { sendServerError } = require('../utils/errorResponse');

const hasOnlyProjectStudents = async (members, project) => {
  const ids = (members || []).map((member) => idOf(member.user || member)).filter(Boolean);
  if (!ids.length) return true;
  return ids.every((id) => project.students.some((student) => idOf(student) === id));
};

const validateMembers = async (members, project, activeLeader = null) => {
  if (!Array.isArray(members)) {
    const error = new Error('Team members must be an array');
    error.statusCode = 422;
    throw error;
  }
  if (!(await hasOnlyProjectStudents(members, project))) {
    const error = new Error('Team members must be students assigned to this project');
    error.statusCode = 422;
    throw error;
  }
  const activeMembers = members.filter((member) => member?.state !== 'removed');
  const ids = activeMembers.map((member) => idOf(member.user)).filter(Boolean);
  if (new Set(ids).size !== ids.length) {
    const error = new Error('A student can appear only once in a team');
    error.statusCode = 422;
    throw error;
  }
  const leaders = activeMembers.filter((member) => member.role === 'Leader');
  if (leaders.length > 1) {
    const error = new Error('A team can have only one active leader');
    error.statusCode = 422;
    throw error;
  }
  if (activeLeader && !leaders.some((member) => idOf(member.user) === idOf(activeLeader))) {
    const error = new Error('Membership changes must preserve the confirmed team leader; use the nomination workflow to change leaders');
    error.statusCode = 422;
    throw error;
  }
};

// Leader of the team, that project's assigned supervisor, or an admin may modify it.
const canModifyTeam = (team, project, user) => {
  if (user.role === 'admin') return true;
  if (idOf(project?.supervisor) === user.id) return true;
  return team.members.some(m => idOf(m.user) === user.id && m.role === 'Leader');
};

exports.getAllTeams = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      const project = await Project.findById(req.query.project);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(project, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this project\'s teams' });
      }
      filter.project = req.query.project;
    } else if (req.user.role !== 'admin') {
      filter.project = { $in: await projectIdsForUser(req.user) };
    }

    const teams = await Team.find(filter)
      .populate('project', 'title')
      .populate('supervisor', 'name email')
      .populate('members.user', 'name email');
    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load teams');
  }
};

exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    const project = await Project.findById(team.project);
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this team' });
    }
    await team.populate('project', 'title');
    await team.populate('supervisor', 'name email');
    await team.populate('members.user', 'name email');
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load this team');
  }
};

exports.createTeam = async (req, res) => {
  try {
    const body = {
      name: req.body?.name,
      project: req.body?.project,
      members: Array.isArray(req.body?.members) ? req.body.members : []
    };

    const project = await Project.findById(body.project);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'You can only create a team for an accessible project' });
    }

    if (req.user.role === 'student') {
      // Students may only create teams for projects they belong to,
      // and always become the team leader (proposal §4.2)
      if (!project.students.some(s => idOf(s) === req.user.id)) {
        return res.status(403).json({ success: false, error: 'You can only create a team for your own project' });
      }
      const members = (body.members || []).filter(m => idOf(m.user) !== req.user.id);
      body.members = [{ user: req.user.id, role: 'Leader' }, ...members];
      body.activeLeader = req.user.id;
      body.supervisor = project.supervisor || undefined;
    } else if (req.user.role === 'supervisor') {
      body.supervisor = project.supervisor || req.user.id;
    }

    await validateMembers(body.members, project, body.activeLeader);
    body.status = 'forming';

    const team = await Team.create(body);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.nominateLeader = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    const project = await Project.findById(team.project);
    if (!canAccessProject(project, req.user) || !canModifyTeam(team, project, req.user)) return res.status(403).json({ success: false, error: 'Only the team leader, assigned supervisor, or an administrator may nominate a leader' });
    if (!team.members.some((member) => idOf(member.user) === userId && member.state !== 'removed')) return res.status(422).json({ success: false, error: 'Leader must be an active team member' });
    team.pendingLeader = userId;
    await team.save();
    await recordAudit({ actor: req.user.id, action: 'team.leader_nominated', entityType: 'team', entityId: team._id, metadata: { pendingLeader: userId } });
    res.json({ success: true, data: team });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.confirmLeader = async (req, res) => {
  try {
    const { reason = 'Supervisor-confirmed leader change' } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    const project = await Project.findById(team.project);
    if (req.user.role !== 'admin' && project.supervisor?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assigned supervisor may confirm a leader' });
    if (!team.pendingLeader) return res.status(409).json({ success: false, error: 'No leader nomination is awaiting confirmation' });

    const previousLeader = team.activeLeader;
    team.members.forEach((member) => {
      if (idOf(member.user) === idOf(team.pendingLeader)) member.role = 'Leader';
      else if (member.role === 'Leader') member.role = 'Developer';
    });
    team.activeLeader = team.pendingLeader;
    team.pendingLeader = null;
    if (team.status === 'forming') team.status = 'active';
    await team.save();
    await LeaderHistory.create({ team: team._id, fromUser: previousLeader, toUser: team.activeLeader, changedBy: req.user.id, reason });
    await recordAudit({ actor: req.user.id, action: 'team.leader_confirmed', entityType: 'team', entityId: team._id, metadata: { fromUser: previousLeader, toUser: team.activeLeader, reason } });
    res.json({ success: true, data: team });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    const project = await Project.findById(team.project);
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this team' });
    }

    if (!canModifyTeam(team, project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this team' });
    }

    const canManageMembership = req.user.role === 'admin' || idOf(project.supervisor) === req.user.id;
    const allowedFields = canManageMembership ? ['name', 'status', 'members'] : ['name'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
    if (updates.members) await validateMembers(updates.members, project, team.activeLeader);
    team = await Team.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    const project = await Project.findById(team.project);
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this team' });
    }

    if (!canModifyTeam(team, project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this team' });
    }

    await team.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
