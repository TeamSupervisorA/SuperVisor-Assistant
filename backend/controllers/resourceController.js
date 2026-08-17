const Resource = require('../models/Resource');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const { sendServerError } = require('../utils/errorResponse');
const { recordAudit } = require('../services/auditService');

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
    } else {
      filter.project = { $in: await projectIdsForUser(req.user) };
    }
    if (req.user.role === 'student') filter.visibility = { $in: ['project', 'institution'] };

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
    if (project.status !== 'active') {
      return res.status(409).json({ success: false, error: 'Shared project resources open when the project becomes active' });
    }
    if (req.body.visibility === 'institution' && req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Only institution administrators can publish institution-wide resources' });
    if (req.body.visibility === 'supervisors' && !['supervisor', 'admin'].includes(req.user.role)) return res.status(403).json({ success: false, error: 'Only supervisors can publish supervisor-only resources' });
    let replaces = null;
    let version = 1;
    if (req.body.replaces) {
      replaces = await Resource.findOne({ _id: req.body.replaces, project: project._id });
      if (!replaces) return res.status(422).json({ success: false, error: 'The resource version being replaced does not belong to this project' });
      version = replaces.version + 1;
    }
    const allowed = ['title', 'type', 'url', 'project', 'category', 'size', 'visibility'];
    const input = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const resource = await Resource.create({ ...input, uploadedBy: req.user.id, replaces: replaces?._id || null, version });
    await recordAudit({ actor: req.user.id, action: 'resource.created', entityType: 'resource', entityId: resource._id, metadata: { project: project._id, version, replaces: replaces?._id || null } });
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
    await recordAudit({ actor: req.user.id, action: 'resource.deleted', entityType: 'resource', entityId: resource._id, metadata: { project: project._id, version: resource.version } });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
