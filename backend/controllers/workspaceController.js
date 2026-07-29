const WorkspaceDocument = require('../models/WorkspaceDocument');
const { Project, canAccessProject } = require('../utils/projectAccess');

const allowedKinds = new Set(['paper', 'code']);
const allowedFields = ['title', 'kind', 'language', 'content', 'overleafUrl'];

const getAccessibleProject = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  if (!canAccessProject(project, user)) {
    const error = new Error('Not authorized to access this project workspace');
    error.statusCode = 403;
    throw error;
  }
  return project;
};

const validateDocument = (data, partial = false) => {
  if (!partial && (!data.title || !data.kind)) {
    const error = new Error('title and kind are required');
    error.statusCode = 422;
    throw error;
  }
  if (data.kind && !allowedKinds.has(data.kind)) {
    const error = new Error('kind must be paper or code');
    error.statusCode = 422;
    throw error;
  }
  if (data.overleafUrl) {
    try {
      const url = new URL(data.overleafUrl);
      if (url.protocol !== 'https:') throw new Error('Invalid protocol');
    } catch {
      const error = new Error('Overleaf link must be a valid HTTPS URL');
      error.statusCode = 422;
      throw error;
    }
  }
};

exports.listDocuments = async (req, res) => {
  try {
    await getAccessibleProject(req.params.projectId, req.user);
    const documents = await WorkspaceDocument.find({ project: req.params.projectId })
      .select('title kind language overleafUrl createdBy createdAt updatedAt')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const document = await WorkspaceDocument.findById(req.params.id).populate('createdBy', 'name');
    if (!document) return res.status(404).json({ success: false, error: 'Workspace document not found' });
    await getAccessibleProject(document.project, req.user);
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.createDocument = async (req, res) => {
  try {
    await getAccessibleProject(req.params.projectId, req.user);
    const data = {};
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) data[field] = req.body[field]; });
    validateDocument(data);
    const document = await WorkspaceDocument.create({ ...data, project: req.params.projectId, createdBy: req.user.id });
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const document = await WorkspaceDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, error: 'Workspace document not found' });
    await getAccessibleProject(document.project, req.user);
    const updates = {};
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    validateDocument(updates, true);
    const updated = await WorkspaceDocument.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await WorkspaceDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, error: 'Workspace document not found' });
    const project = await getAccessibleProject(document.project, req.user);
    const canDelete = req.user.role === 'admin' || project.supervisor?.toString() === req.user.id || document.createdBy.toString() === req.user.id;
    if (!canDelete) return res.status(403).json({ success: false, error: 'Only the author, supervisor, or an administrator can delete this document' });
    await document.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};
