const Project = require('../models/Project');

const idOf = (ref) => (ref && ref._id ? ref._id : ref)?.toString();

const tenantId = (value) => {
  if (value && typeof value === 'object') {
    if (typeof value.get === 'function' && value.schema?.path?.('institution')) {
      return idOf(value.get('institution')) || 'legacy';
    }
    if (Object.prototype.hasOwnProperty.call(value, 'institution') || Object.prototype.hasOwnProperty.call(value._doc || {}, 'institution')) {
      return idOf(value.institution) || 'legacy';
    }
  }
  return idOf(value) || 'legacy';
};
const sameInstitution = (left, right) => tenantId(left) === tenantId(right);

const canAccessProject = (project, user) => {
  if (!project || !user) return false;
  if (!sameInstitution(project, user)) return false;
  if (user.role === 'admin') return true;
  if (idOf(project.supervisor) === user.id) return true;
  return project.students.some((student) => idOf(student) === user.id);
};

const projectIdsForUser = async (user) => {
  const institution = user.institution || null;
  if (user.role === 'admin') {
    const projects = await Project.find({ institution }).select('_id');
    return projects.map((project) => project._id);
  }
  const roleQuery = user.role === 'supervisor'
    ? { supervisor: user.id }
    : { students: user.id };
  const query = { $and: [{ institution }, roleQuery] };
  const projects = await Project.find(query).select('_id');
  return projects.map((project) => project._id);
};

module.exports = { Project, idOf, tenantId, sameInstitution, canAccessProject, projectIdsForUser };
