const Resource = require('../models/Resource');

exports.getAllResources = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;

    const resources = await Resource.find(filter).populate('project', 'title').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createResource = async (req, res) => {
  try {
    const resource = await Resource.create({ ...req.body, uploadedBy: req.user.id });
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });

    // Only the uploader, or a supervisor/admin, may delete a resource
    const isUploader = resource.uploadedBy && resource.uploadedBy.toString() === req.user.id;
    if (req.user.role === 'student' && !isUploader) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this resource' });
    }

    await resource.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
