import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ClipboardList, AlertTriangle } from 'lucide-react';
import { Employee, Role, ROLES, DAYS } from '../types';

const ROLE_COLORS: { [key: string]: string } = {
  HOST: '#f72585',
  WAIT: '#4361ee',
  BRUN: '#06d6a0',
  KRUN: '#fb8500',
  BART: '#8338ec',
  MGR: '#118ab2',
};

const PEAK = ['Fri', 'Sat', 'Sun'];

export default function RequestsManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('LIBRE');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [empRes, reqRes] = await Promise.all([
      fetch('/api/employees'),
      fetch('/api/requests')
    ]);
    const empData = await empRes.json();
    const reqData = await reqRes.json();
    setEmployees(empData);
    setRequests(reqData);
  };

  const addRequest = async () => {
    if (!selectedEmpId || !selectedDate) return;
    await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: selectedEmpId, date: selectedDate, type: selectedType })
    });
    fetchData();
  };

  const deleteRequest = async (id: number) => {
    await fetch(`/api/requests/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const isPeak = selectedDate ? PEAK.includes(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(selectedDate).getUTCDay()]) : false;

  return (
    <div className="space-y-6">
      <div className="bg-[#0d1420] p-6 rounded-2xl shadow-sm border border-[#1a2a44]">
        <h2 className="text-lg font-bold font-display uppercase tracking-wider mb-6 flex items-center gap-2 text-white">
          <ClipboardList className="w-5 h-5 text-[#4361ee]" />
          Add Day-Off Request
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest ml-1">Employee</label>
            <select
              className="w-full bg-[#080c14] px-4 py-2 rounded-xl border border-[#1a2a44] text-[#dde3f0] focus:outline-none"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(Number(e.target.value))}
            >
              <option value="">Select Staff...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({ROLES[emp.role]})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest ml-1">Date</label>
            <input
              type="date"
              className="w-full bg-[#080c14] px-4 py-2 rounded-xl border border-[#1a2a44] text-[#dde3f0] focus:outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest ml-1">Type</label>
            <select
              className="w-full bg-[#080c14] px-4 py-2 rounded-xl border border-[#1a2a44] text-[#dde3f0] focus:outline-none"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="LIBRE">Day Off (LIBRE)</option>
              <option value="unavailable">Unavailable (-)</option>
              <option value="VACATION">Full Week Vacation</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={addRequest}
              className="w-full bg-[#4361ee] text-white px-6 py-2 rounded-xl font-bold font-display tracking-wider hover:bg-[#3a0ca3] transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(67,97,238,0.2)]"
            >
              <Plus className="w-4 h-4" /> ADD REQUEST
            </button>
          </div>
        </div>

        {isPeak && (
          <div className="mt-4 p-4 bg-[#f72585]/10 border border-[#f72585]/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#f72585] shrink-0 mt-0.5" />
            <div className="text-xs text-[#f72585]">
              <p className="font-bold uppercase tracking-wider mb-1">Peak Day Warning</p>
              <p className="opacity-80">This date falls on a weekend (Fri-Sun). Removing staff here may drop coverage below minimum. The auto-generator will try to compensate.</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#0d1420] rounded-2xl shadow-sm border border-[#1a2a44] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#080c14] border-b border-[#1a2a44]">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Employee</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Position</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2a44]">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#4a5a7a]">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-xs">No pending requests</p>
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-[#1a2236]/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-[#dde3f0]">{req.name}</td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${ROLE_COLORS[req.role]}20`, color: ROLE_COLORS[req.role] }}
                    >
                      {ROLES[req.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#dde3f0] font-mono text-sm">
                    {new Date(req.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      req.type === 'VACATION' ? 'bg-[#fb850020] text-[#fb8500]' : 
                      req.type === 'LIBRE' ? 'bg-[#06d6a020] text-[#06d6a0]' : 'bg-[#ffffff10] text-[#888]'
                    }`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteRequest(req.id)}
                      className="p-2 text-[#4a5a7a] hover:text-[#f72585] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
