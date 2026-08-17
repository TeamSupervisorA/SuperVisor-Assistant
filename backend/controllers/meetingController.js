const Meeting = require('../models/Meeting');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const { sendServerError } = require('../utils/errorResponse');
const { recordAudit } = require('../services/auditService');

const attendeesBelongToProject = (attendees, project) => {
  if (!attendees) return true;
  const allowed = new Set([...(project.students || []).map((id) => id.toString()), project.supervisor?.toString()].filter(Boolean));
  return attendees.every((attendee) => allowed.has(attendee.toString()));
};

exports.getAllMeetings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      const project = await Project.findById(req.query.project);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(project, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this project\'s meetings' });
      }
      filter.project = req.query.project;
    } else {
      filter.project = { $in: await projectIdsForUser(req.user) };
    }

    const meetings = await Meeting.find(filter)
      .populate('project', 'title')
      .populate('organizer', 'name role')
      .populate('attendees', 'name role')
      .populate('followUpActions.owner', 'name')
      .sort({ startsAtUtc: 1, date: 1 });
    res.status(200).json({ success: true, count: meetings.length, data: meetings });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load meetings');
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const project = await Project.findById(req.body.project);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to create a meeting for this project' });
    }
    if (project.status !== 'active') {
      return res.status(409).json({ success: false, error: 'Project meetings open after supervision and proposal approval activate the project' });
    }
    if (!attendeesBelongToProject(req.body.attendees, project)) {
      return res.status(422).json({ success: false, error: 'Meeting attendees must belong to the project' });
    }
    if (!String(req.body.agenda || '').trim()) {
      return res.status(422).json({ success: false, error: 'Add an agenda so every participant knows the decisions needed' });
    }
    const allowedFields = ['title', 'date', 'time', 'startsAtUtc', 'timezone', 'type', 'project', 'attendees', 'agenda', 'meetingLink', 'location', 'notes', 'minutes', 'followUpActions'];
    const input = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
    input.startsAtUtc = new Date(input.startsAtUtc || `${input.date}T${input.time}`);
    if (Number.isNaN(input.startsAtUtc.getTime())) return res.status(422).json({ success: false, error: 'Provide a valid meeting date and time' });
    input.date = input.startsAtUtc;
    if (!input.attendees?.length) {
      input.attendees = [...new Set([...(project.students || []).map(String), project.supervisor?.toString()].filter(Boolean))];
    }
    const meeting = await Meeting.create({ ...input, organizer: req.user.id });
    await recordAudit({ actor: req.user.id, action: 'meeting.created', entityType: 'meeting', entityId: meeting._id, metadata: { project: project._id, timezone: meeting.timezone } });
    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Only the organizer, that project's supervisor, or an admin may modify a meeting.
const canModifyMeeting = (meeting, project, user) =>
  (user.role === 'admin' && canAccessProject(project, user)) ||
  (project.supervisor && project.supervisor.toString() === user.id) ||
  (meeting.organizer && meeting.organizer.toString() === user.id);

exports.updateMeeting = async (req, res) => {
  try {
    let meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });

    const project = await Project.findById(meeting.project);
    if (!canAccessProject(project, req.user) || !canModifyMeeting(meeting, project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this meeting' });
    }
    const allowedFields = ['title', 'date', 'time', 'startsAtUtc', 'timezone', 'type', 'status', 'attendees', 'agenda', 'meetingLink', 'location', 'notes', 'minutes', 'followUpActions', 'cancellationReason'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
    if (!attendeesBelongToProject(updates.attendees, project)) {
      return res.status(422).json({ success: false, error: 'Meeting attendees must belong to the project' });
    }
    if (updates.status === 'Cancelled' && !String(updates.cancellationReason || '').trim()) {
      return res.status(422).json({ success: false, error: 'Cancelled meetings require a reason' });
    }
    if (updates.startsAtUtc || updates.date || updates.time) {
      const nextStart = new Date(updates.startsAtUtc || `${updates.date || meeting.date.toISOString().slice(0, 10)}T${updates.time || meeting.time}`);
      if (Number.isNaN(nextStart.getTime())) return res.status(422).json({ success: false, error: 'Provide a valid meeting date and time' });
      if (nextStart.getTime() !== new Date(meeting.startsAtUtc || meeting.date).getTime()) updates.rescheduledFrom = meeting.startsAtUtc || meeting.date;
      updates.startsAtUtc = nextStart;
      updates.date = nextStart;
    }

    meeting = await Meeting.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });
    await recordAudit({ actor: req.user.id, action: 'meeting.updated', entityType: 'meeting', entityId: meeting._id, metadata: { project: project._id, fields: Object.keys(updates) } });
    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });

    const project = await Project.findById(meeting.project);
    if (!canAccessProject(project, req.user) || !canModifyMeeting(meeting, project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this meeting' });
    }

    await meeting.deleteOne();
    await recordAudit({ actor: req.user.id, action: 'meeting.deleted', entityType: 'meeting', entityId: meeting._id, metadata: { project: project._id } });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
