const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { Project, idOf, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const LeaderHistory = require('../models/LeaderHistory');
const { recordAudit } = require('../services/auditService');
const { sendServerError } = require('../utils/errorResponse');

const populateTeam = (id) => Team.findById(id)
  .populate('project', 'title department section supervisor students')
  .populate('supervisor', 'name department expertise')
  .populate('activeLeader', 'name')
  .populate('pendingLeader', 'name')
  .populate('members.user', 'name email department')
  .populate('supervisorInvitations.supervisor', 'name department expertise maxActiveTeams')
  .populate('supervisorInvitations.invitedBy', 'name');

const notify = async (fields) => {
  try { await Notification.create(fields); } catch { /* notifications do not block the workflow */ }
};

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
  if (user.role === 'admin') return canAccessProject(project, user);
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
    } else {
      filter.project = { $in: await projectIdsForUser(req.user) };
    }

    const teams = await Team.find(filter)
      .populate('project', 'title department section supervisor students')
      .populate('supervisor', 'name department expertise')
      .populate('activeLeader', 'name')
      .populate('pendingLeader', 'name')
      .populate('members.user', 'name email department')
      .populate('supervisorInvitations.supervisor', 'name department expertise maxActiveTeams')
      .populate('supervisorInvitations.invitedBy', 'name');
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
    res.status(200).json({ success: true, data: await populateTeam(team._id) });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load this team');
  }
};

exports.createTeam = async (req, res) => {
  // Projects are the canonical team boundary. Retaining this read-only legacy
  // controller lets old records remain visible without creating a second,
  // conflicting roster or supervisor assignment.
  return res.status(410).json({
    success: false,
    error: 'Separate teams are no longer created. Use the project People & Supervision workspace to invite members and a primary supervisor.'
  });
  /* c8 ignore start -- legacy migration reference
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
    await recordAudit({ actor: req.user.id, action: 'team.created', entityType: 'team', entityId: team._id, metadata: { project: project._id } });
    res.status(201).json({ success: true, data: await populateTeam(team._id) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
  c8 ignore stop */
};

// Active supervisors are visible as a limited academic directory. Workload is
// derived on the server; private account details are never exposed.
exports.getSupervisorDirectory = async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor', status: 'active' })
      .select('name department expertise maxActiveTeams')
      .sort({ name: 1 })
      .lean();
    const workloads = await Project.aggregate([
      { $match: { supervisor: { $ne: null }, status: { $in: ['proposed', 'active', 'on_hold'] } } },
      { $group: { _id: '$supervisor', activeProjects: { $sum: 1 } } }
    ]);
    const workloadById = new Map(workloads.map((item) => [String(item._id), item.activeProjects]));
    res.json({
      success: true,
      data: supervisors.map((supervisor) => ({
        ...supervisor,
        activeProjects: workloadById.get(String(supervisor._id)) || 0,
        available: (workloadById.get(String(supervisor._id)) || 0) < (supervisor.maxActiveTeams || 6)
      }))
    });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load the supervisor directory');
  }
};

exports.getMySupervisorInvitations = async (req, res) => {
  try {
    if (req.user.role !== 'supervisor') return res.json({ success: true, data: [] });
    const teams = await Team.find({
      supervisorInvitations: { $elemMatch: { supervisor: req.user.id, status: 'pending' } }
    })
      .populate('project', 'title description department section students')
      .populate('members.user', 'name department')
      .populate('supervisorInvitations.supervisor', 'name department expertise')
      .populate('supervisorInvitations.invitedBy', 'name');
    res.json({ success: true, data: teams });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load supervision invitations');
  }
};

exports.inviteSupervisor = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    const project = await Project.findById(team.project);
    if (!project || !canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to invite a supervisor for this team' });
    const isStudentLeader = req.user.role === 'student'
      && team.members.some((member) => idOf(member.user) === req.user.id && member.role === 'Leader' && member.state !== 'removed');
    if (!isStudentLeader && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the student team leader or an administrator may invite a supervisor' });
    }
    if (project.supervisor) return res.status(409).json({ success: false, error: 'This project already has an assigned supervisor' });

    const supervisor = await User.findOne({ _id: req.body?.supervisorId, role: 'supervisor', status: 'active', institution: project.institution || null })
      .select('name department expertise maxActiveTeams');
    if (!supervisor) return res.status(422).json({ success: false, error: 'Choose an active supervisor from the directory' });
    const activeWorkload = await Project.countDocuments({ supervisor: supervisor._id, status: { $in: ['proposed', 'active', 'on_hold'] } });
    if (activeWorkload >= (supervisor.maxActiveTeams || 6)) return res.status(409).json({ success: false, error: 'This supervisor is currently at their configured project capacity' });
    const pending = team.supervisorInvitations.find((invitation) => idOf(invitation.supervisor) === idOf(supervisor._id) && invitation.status === 'pending');
    if (pending) return res.status(409).json({ success: false, error: 'This supervisor already has a pending invitation from the team' });
    if (team.supervisorInvitations.filter((invitation) => invitation.status === 'pending').length >= 3) {
      return res.status(409).json({ success: false, error: 'Resolve an existing invitation before inviting another supervisor (maximum three pending)' });
    }

    team.supervisorInvitations.push({
      supervisor: supervisor._id,
      invitedBy: req.user.id,
      message: String(req.body?.message || '').trim().slice(0, 500)
    });
    team.status = 'pending_approval';
    await team.save();
    await notify({
      user: supervisor._id,
      title: 'Team supervision invitation',
      message: `${req.user.name} invited you to supervise ${team.name} for “${project.title}”.`,
      type: 'info',
      link: '/team'
    });
    await recordAudit({ actor: req.user.id, action: 'team.supervisor_invited', entityType: 'team', entityId: team._id, metadata: { project: project._id, supervisor: supervisor._id } });
    res.status(201).json({ success: true, data: await populateTeam(team._id) });
  } catch (error) {
    return sendServerError(res, error, 'Unable to invite this supervisor');
  }
};

exports.respondToSupervisorInvitation = async (req, res) => {
  try {
    const decision = req.body?.decision;
    if (!['accept', 'decline'].includes(decision)) return res.status(422).json({ success: false, error: 'Decision must be accept or decline' });
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    const invitation = team.supervisorInvitations.id(req.params.invitationId);
    if (!invitation || invitation.status !== 'pending') return res.status(404).json({ success: false, error: 'Pending invitation not found' });
    if (req.user.role !== 'supervisor' || idOf(invitation.supervisor) !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the invited supervisor may respond' });
    }
    const project = await Project.findById(team.project);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (decision === 'accept' && project.supervisor && idOf(project.supervisor) !== req.user.id) {
      return res.status(409).json({ success: false, error: 'This project was assigned to another supervisor before the invitation was accepted' });
    }

    invitation.status = decision === 'accept' ? 'accepted' : 'declined';
    invitation.respondedAt = new Date();
    if (decision === 'accept') {
      project.supervisor = req.user.id;
      project.supervisionSource = 'student_invitation';
      project.supervisorAssignedAt = new Date();
      project.supervisorAssignedBy = req.user.id;
      await project.save();
      team.supervisorInvitations.forEach((item) => {
        if (idOf(item._id) !== idOf(invitation._id) && item.status === 'pending') {
          item.status = 'cancelled';
          item.respondedAt = new Date();
        }
      });
      team.status = 'active';
      team.supervisor = req.user.id;
      const relatedTeams = await Team.find({ project: project._id, _id: { $ne: team._id } });
      await Promise.all(relatedTeams.map(async (relatedTeam) => {
        relatedTeam.supervisor = req.user.id;
        relatedTeam.supervisorInvitations.forEach((item) => {
          if (item.status === 'pending') {
            item.status = 'cancelled';
            item.respondedAt = new Date();
          }
        });
        if (relatedTeam.status === 'pending_approval') relatedTeam.status = 'forming';
        await relatedTeam.save();
      }));
    } else if (!team.supervisorInvitations.some((item) => item.status === 'pending')) {
      team.status = 'forming';
    }
    await team.save();
    await Promise.all(project.students.map((student) => notify({
      user: student,
      title: decision === 'accept' ? 'Supervisor invitation accepted' : 'Supervisor invitation declined',
      message: `${req.user.name} ${decision === 'accept' ? 'is now supervising' : 'declined the invitation for'} “${project.title}”.`,
      type: decision === 'accept' ? 'success' : 'warning',
      link: '/team'
    })));
    await recordAudit({ actor: req.user.id, action: decision === 'accept' ? 'team.supervisor_invitation_accepted' : 'team.supervisor_invitation_declined', entityType: 'team', entityId: team._id, metadata: { project: project._id, invitation: invitation._id } });
    res.json({ success: true, data: await populateTeam(team._id) });
  } catch (error) {
    return sendServerError(res, error, 'Unable to respond to this invitation');
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
    if (!canAccessProject(project, req.user) || (req.user.role !== 'admin' && project.supervisor?.toString() !== req.user.id)) return res.status(403).json({ success: false, error: 'Only the assigned supervisor may confirm a leader' });
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
