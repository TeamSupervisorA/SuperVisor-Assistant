const Meeting = require('../models/Meeting');

exports.getAllMeetings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;

    const meetings = await Meeting.find(filter).populate('project', 'title').sort({ date: 1 });
    res.status(200).json({ success: true, count: meetings.length, data: meetings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.create({ ...req.body, organizer: req.user.id });
    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Only the organizer, or a supervisor/admin, may modify a meeting
const canModifyMeeting = (meeting, user) =>
  user.role === 'admin' ||
  user.role === 'supervisor' ||
  (meeting.organizer && meeting.organizer.toString() === user.id);

exports.updateMeeting = async (req, res) => {
  try {
    let meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });

    if (!canModifyMeeting(meeting, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this meeting' });
    }

    meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });

    if (!canModifyMeeting(meeting, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this meeting' });
    }

    await meeting.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
