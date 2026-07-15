const Team = require('../models/Team');

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('project', 'title').populate('supervisor', 'name email').populate('members.user', 'name email');
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
    const team = await Team.create(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
