import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

const AdminManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [supervision, setSupervision] = useState({ supervisors: [], projects: [] });
  const [department, setDepartment] = useState({ code: '', name: '' });
  const [allocations, setAllocations] = useState({});
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    try {
      const [usersResponse, departmentsResponse, supervisionResponse] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/departments'),
        apiFetch('/api/admin/supervision')
      ]);
      setUsers(usersResponse.data || []);
      setDepartments(departmentsResponse.data || []);
      setSupervision(supervisionResponse.data || { supervisors: [], projects: [] });
      setMessage('');
    } catch (error) { setMessage(error.message); }
  };
  useEffect(() => { load(); }, []);

  const toggleUser = async (user) => {
    try {
      setBusyId(user._id);
      await apiFetch(`/api/admin/users/${user._id}/status`, { method: 'PATCH', body: JSON.stringify({ status: user.status === 'inactive' ? 'active' : 'inactive' }) });
      await load();
    } catch (error) { setMessage(error.message); } finally { setBusyId(''); }
  };
  const toggleSupervisor = async (user) => {
    try {
      setBusyId(user._id);
      const role = user.role === 'supervisor' ? 'student' : 'supervisor';
      await apiFetch(`/api/admin/users/${user._id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
      await load();
    } catch (error) { setMessage(error.message); } finally { setBusyId(''); }
  };
  const createDepartment = async (event) => {
    event.preventDefault();
    try {
      await apiFetch('/api/admin/departments', { method: 'POST', body: JSON.stringify(department) });
      setDepartment({ code: '', name: '' }); setNotice('Department added.'); await load();
    } catch (error) { setMessage(error.message); }
  };
  const setAllocation = (projectId, patch) => setAllocations((current) => ({ ...current, [projectId]: { ...(current[projectId] || {}), ...patch } }));
  const assignSupervisor = async (project) => {
    const allocation = allocations[project._id] || {};
    const supervisorId = allocation.supervisorId || project.supervisor?._id;
    if (!supervisorId) { setMessage('Choose a supervisor before assigning this project.'); return; }
    setBusyId(project._id); setMessage(''); setNotice('');
    try {
      await apiFetch(`/api/admin/projects/${project._id}/supervisor`, {
        method: 'PUT',
        body: JSON.stringify({ supervisorId, section: allocation.section ?? project.section ?? '', department: allocation.department ?? project.department ?? '' })
      });
      setNotice(`Supervisor allocation saved for “${project.title}”. Related teams and permissions were synchronized.`);
      await load();
    } catch (error) { setMessage(error.message); } finally { setBusyId(''); }
  };

  const unassignedCount = supervision.projects.filter((project) => !project.supervisor).length;
  const overloadedCount = supervision.supervisors.filter((supervisor) => supervisor.activeProjects >= (supervisor.maxActiveTeams || 6)).length;

  return <div className="mx-auto max-w-[1500px] space-y-8 p-6 md:p-10">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-primary">Institutional controls</p><h1 className="mt-1 text-3xl font-black">Academic operations</h1><p className="mt-2 text-secondary">Provision roles, organize departments, and assign accountable supervision with a visible workload trail.</p></header>
    {message && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 p-3 text-error">{message}</p>}
    {notice && <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-primary">{notice}</p>}

    <section className="rounded-3xl border border-outline-variant/30 bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-tertiary">Supervision allocation</p><h2 className="mt-1 text-2xl font-black">Projects, sections, and teams</h2><p className="mt-1 text-sm text-secondary">An assignment updates the project and every related team, then notifies affected users.</p></div><div className="flex gap-2"><span className="rounded-full bg-error/10 px-3 py-1.5 text-xs font-bold text-error">{unassignedCount} unassigned</span><span className="rounded-full bg-tertiary-container px-3 py-1.5 text-xs font-bold text-tertiary">{overloadedCount} at capacity</span></div></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[1000px] border-separate border-spacing-y-2 text-left text-sm"><thead className="text-xs uppercase tracking-wider text-secondary"><tr><th className="px-3">Project / teams</th><th className="px-3">Department</th><th className="px-3">Section</th><th className="px-3">Supervisor / workload</th><th className="px-3">Action</th></tr></thead><tbody>{supervision.projects.map((project) => <tr key={project._id} className="bg-surface-container-low"><td className="rounded-l-xl px-3 py-3"><p className="font-bold">{project.title}</p><p className="mt-1 text-xs text-secondary">{project.students?.length || 0} student(s) · {project.teams?.length || 0} team(s) · {project.proposalState?.replace('_', ' ')}</p></td><td className="px-3 py-3"><input value={allocations[project._id]?.department ?? project.department ?? ''} onChange={(event) => setAllocation(project._id, { department: event.target.value })} placeholder="Department" className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2" /></td><td className="px-3 py-3"><input value={allocations[project._id]?.section ?? project.section ?? ''} onChange={(event) => setAllocation(project._id, { section: event.target.value })} placeholder="e.g. CSE-4A" className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2" /></td><td className="px-3 py-3"><select value={allocations[project._id]?.supervisorId ?? project.supervisor?._id ?? ''} onChange={(event) => setAllocation(project._id, { supervisorId: event.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2"><option value="">Choose supervisor</option>{supervision.supervisors.map((supervisor) => <option key={supervisor._id} value={supervisor._id}>{supervisor.name} · {supervisor.department || 'No department'} · {supervisor.activeProjects}/{supervisor.maxActiveTeams || 6} projects</option>)}</select></td><td className="rounded-r-xl px-3 py-3"><button disabled={busyId === project._id} onClick={() => assignSupervisor(project)} className="rounded-lg bg-primary px-4 py-2 font-bold text-on-primary disabled:opacity-60">{project.supervisor ? 'Update' : 'Assign'}</button></td></tr>)}</tbody></table>{supervision.projects.length === 0 && <p className="py-8 text-center text-secondary">No active or proposed projects need allocation.</p>}</div>
    </section>

    <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-outline-variant/30 bg-surface p-6"><h2 className="mb-4 text-xl font-bold">Departments</h2><form onSubmit={createDepartment} className="flex flex-wrap gap-3"><input required value={department.code} onChange={(event) => setDepartment({ ...department, code: event.target.value })} placeholder="Code" className="min-w-24 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-3"/><input required value={department.name} onChange={(event) => setDepartment({ ...department, name: event.target.value })} placeholder="Department name" className="flex-[2] rounded-xl border border-outline-variant bg-surface-container-lowest p-3"/><button className="rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary">Add</button></form><ul className="mt-5 space-y-2">{departments.map((item) => <li key={item._id} className="flex justify-between rounded-lg bg-surface-container-low p-3"><span>{item.name}</span><span className="text-secondary">{item.code}</span></li>)}</ul></section>
      <section className="rounded-2xl border border-outline-variant/30 bg-surface p-6"><h2 className="mb-1 text-xl font-bold">Account access</h2><p className="mb-4 text-sm text-secondary">Supervisor removal is blocked while projects remain assigned.</p><div className="max-h-[480px] space-y-3 overflow-y-auto">{users.map((user) => <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3"><div><p className="font-semibold">{user.name}</p><p className="text-sm text-secondary">{user.email} · {user.role}</p></div><div className="flex gap-2">{user.role !== 'admin' && <button disabled={busyId === user._id} onClick={() => toggleSupervisor(user)} className="rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary">{user.role === 'supervisor' ? 'Make student' : 'Make supervisor'}</button>}<button disabled={busyId === user._id} onClick={() => toggleUser(user)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${user.status === 'inactive' ? 'bg-primary text-on-primary' : 'border border-error text-error'}`}>{user.status === 'inactive' ? 'Restore' : 'Deactivate'}</button></div></div>)}</div></section></div>
  </div>;
};

export default AdminManagement;
