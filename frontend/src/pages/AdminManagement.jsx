import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

const AdminManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState({ code: '', name: '' });
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [usersResponse, departmentsResponse] = await Promise.all([apiFetch('/api/admin/users'), apiFetch('/api/admin/departments')]);
      setUsers(usersResponse.data || []);
      setDepartments(departmentsResponse.data || []);
    } catch (error) { setMessage(error.message); }
  };
  useEffect(() => { load(); }, []);

  const toggleUser = async (user) => {
    try {
      await apiFetch(`/api/admin/users/${user._id}/status`, { method: 'PATCH', body: JSON.stringify({ status: user.status === 'inactive' ? 'active' : 'inactive' }) });
      await load();
    } catch (error) { setMessage(error.message); }
  };
  const toggleSupervisor = async (user) => {
    try {
      const role = user.role === 'supervisor' ? 'student' : 'supervisor';
      await apiFetch(`/api/admin/users/${user._id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
      await load();
    } catch (error) { setMessage(error.message); }
  };
  const createDepartment = async (event) => {
    event.preventDefault();
    try {
      await apiFetch('/api/admin/departments', { method: 'POST', body: JSON.stringify(department) });
      setDepartment({ code: '', name: '' }); await load();
    } catch (error) { setMessage(error.message); }
  };

  return <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8"><header><p className="text-primary text-sm font-semibold uppercase tracking-wider">Institutional controls</p><h1 className="mt-1 text-3xl font-bold">Users and departments</h1><p className="mt-2 text-secondary">Deactivate access or provision supervisor roles without erasing academic history.</p></header>{message && <p role="status" className="rounded-xl border border-error/30 bg-error/10 p-3 text-error">{message}</p>}<div className="grid lg:grid-cols-2 gap-6"><section className="rounded-2xl border border-outline-variant/30 bg-surface p-6"><h2 className="mb-4 text-xl font-bold">Departments</h2><form onSubmit={createDepartment} className="flex flex-wrap gap-3"><input required value={department.code} onChange={(event) => setDepartment({ ...department, code: event.target.value })} placeholder="Code" className="min-w-24 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-3"/><input required value={department.name} onChange={(event) => setDepartment({ ...department, name: event.target.value })} placeholder="Department name" className="flex-[2] rounded-xl border border-outline-variant bg-surface-container-lowest p-3"/><button className="rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary">Add</button></form><ul className="mt-5 space-y-2">{departments.map((item) => <li key={item._id} className="flex justify-between rounded-lg bg-surface-container-low p-3"><span>{item.name}</span><span className="text-secondary">{item.code}</span></li>)}</ul></section><section className="rounded-2xl border border-outline-variant/30 bg-surface p-6"><h2 className="mb-4 text-xl font-bold">Account access</h2><div className="max-h-[480px] space-y-3 overflow-y-auto">{users.map((user) => <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3"><div><p className="font-semibold">{user.name}</p><p className="text-sm text-secondary">{user.email} · {user.role}</p></div><div className="flex gap-2">{user.role !== 'admin' && <button onClick={() => toggleSupervisor(user)} className="rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary">{user.role === 'supervisor' ? 'Make student' : 'Make supervisor'}</button>}<button onClick={() => toggleUser(user)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${user.status === 'inactive' ? 'bg-primary text-on-primary' : 'border border-error text-error'}`}>{user.status === 'inactive' ? 'Restore' : 'Deactivate'}</button></div></div>)}</div></section></div></div>;
};

export default AdminManagement;
