const Meeting = require('../models/Meeting');

exports.getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find().populate('project', 'title').sort({ date: 1 });
    res.status(200).json({ success: true, count: meetings.length, data: meetings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.create(req.body);
    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
