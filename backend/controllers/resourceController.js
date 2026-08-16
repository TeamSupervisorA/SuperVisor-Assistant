const Resource = require('../models/Resource');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const { sendServerError } = require('../utils/errorResponse');

exports.getAllResources = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      const project = await Project.findById(req.query.project);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(project, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this project\'s resources' });
      }
      filter.project = req.query.project;
    } else if (req.user.role !== 'admin') {
      filter.project = { $in: await projectIdsForUser(req.user) };
    }

    const resources = await Resource.find(filter).populate('project', 'title').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load resources');
  }
};

exports.createResource = async (req, res) => {
  try {
    const project = await Project.findById(req.body.project);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to add resources to this project' });
    }
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

    const project = await Project.findById(resource.project);
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this resource' });
    }

    // Only the uploader, the project's supervisor, or an admin may delete a resource
    const isUploader = resource.uploadedBy && resource.uploadedBy.toString() === req.user.id;
    const isProjectSupervisor = project?.supervisor?.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isUploader && !isProjectSupervisor) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this resource' });
    }

    await resource.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
