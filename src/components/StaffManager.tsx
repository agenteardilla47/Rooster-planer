import React, { useState, useEffect } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { Employee, Role, ROLES } from '../types';

const ROLE_COLORS: { [key: string]: string } = {
  HOST: '#f72585',
  WAIT: '#4361ee',
  BRUN: '#06d6a0',
  KRUN: '#fb8500',
  BART: '#8338ec',
  MGR: '#118ab2',
};

export default function StaffManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('WAIT');
  const [newPref, setNewPref] = useState('5 PM');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    setEmployees(data);
  };

  const addEmployee = async () => {
    if (!newName) return;
    await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, role: newRole, preferred_start: newPref })
    });
    setNewName('');
    fetchEmployees();
  };

  const deleteEmployee = async (id: number) => {
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    fetchEmployees();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0d1420] p-6 rounded-2xl shadow-sm border border-[#1a2a44]">
        <h2 className="text-lg font-bold font-display uppercase tracking-wider mb-4 flex items-center gap-2 text-white">
          <UserPlus className="w-5 h-5 text-[#4361ee]" />
          Add New Staff Member
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest ml-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Jhonny G."
              className="w-full bg-[#080c14] px-4 py-2 rounded-xl border border-[#1a2a44] text-[#dde3f0] focus:outline-none focus:ring-2 focus:ring-[#4361ee]/20"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest ml-1">Position</label>
            <select
              className="w-full bg-[#080c14] px-4 py-2 rounded-xl border border-[#1a2a44] text-[#dde3f0] focus:outline-none focus:ring-2 focus:ring-[#4361ee]/20"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
            >
              {Object.entries(ROLES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest ml-1">Pref. Start</label>
            <input
              type="text"
              placeholder="e.g. 5 PM"
              className="w-full bg-[#080c14] px-4 py-2 rounded-xl border border-[#1a2a44] text-[#dde3f0] font-mono focus:outline-none focus:ring-2 focus:ring-[#4361ee]/20"
              value={newPref}
              onChange={(e) => setNewPref(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addEmployee}
              className="w-full bg-[#4361ee] text-white px-6 py-2 rounded-xl font-bold font-display tracking-wider hover:bg-[#3a0ca3] transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(67,97,238,0.2)]"
            >
              <Plus className="w-4 h-4" /> ADD STAFF
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0d1420] rounded-2xl shadow-sm border border-[#1a2a44] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#080c14] border-b border-[#1a2a44]">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Position</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Pref. Start</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2a44]">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-[#1a2236]/30 transition-colors">
                <td className="px-6 py-4 font-semibold text-[#dde3f0]">{emp.name}</td>
                <td className="px-6 py-4">
                  <span 
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${ROLE_COLORS[emp.role]}20`, color: ROLE_COLORS[emp.role] }}
                  >
                    {ROLES[emp.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#4a5a7a] font-mono text-sm">{emp.preferred_start}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-[#06d6a015] text-[#06d6a0] text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => deleteEmployee(emp.id)}
                    className="p-2 text-[#4a5a7a] hover:text-[#f72585] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
