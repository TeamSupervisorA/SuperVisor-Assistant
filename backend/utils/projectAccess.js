const Project = require('../models/Project');

const idOf = (ref) => (ref && ref._id ? ref._id : ref)?.toString();

const canAccessProject = (project, user) => {
  if (!project || !user) return false;
  if (user.role === 'admin') return true;
  if (idOf(project.supervisor) === user.id) return true;
  return project.students.some((student) => idOf(student) === user.id);
};

const projectIdsForUser = async (user) => {
  if (user.role === 'admin') return null;
  const query = user.role === 'supervisor'
    ? { supervisor: user.id }
    : { students: user.id };
  const projects = await Project.find(query).select('_id');
  return projects.map((project) => project._id);
};

module.exports = { Project, idOf, canAccessProject, projectIdsForUser };
