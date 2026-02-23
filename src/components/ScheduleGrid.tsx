import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Wand2, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { ScheduleEntry, Employee, Role, ROLES, DAYS, CoverageRule } from '../types';

const PEAK = ['Fri', 'Sat', 'Sun'];

const ROLE_COLORS: { [key: string]: string } = {
  HOST: '#f72585',
  WAIT: '#4361ee',
  BRUN: '#06d6a0',
  KRUN: '#fb8500',
  BART: '#8338ec',
  MGR: '#118ab2',
};

const SHIFT_OPTIONS = ["3 PM", "4 PM", "5 PM", "5:30 PM", "6 PM", "LIBRE", "-", "VACATION"];

export default function ScheduleGrid() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rules, setRules] = useState<CoverageRule[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editCell, setEditCell] = useState<{ empId: number, date: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [weekStart]);

  const fetchData = async () => {
    const [schedRes, empRes, rulesRes] = await Promise.all([
      fetch(`/api/schedule/${weekStart}`),
      fetch('/api/employees'),
      fetch('/api/rules')
    ]);
    const schedData = await schedRes.json();
    const empData = await empRes.json();
    const rulesData = await rulesRes.json();
    setSchedule(schedData);
    setEmployees(empData);
    setRules(rulesData);
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    await fetch('/api/schedule/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart })
    });
    await fetchData();
    setIsGenerating(false);
  };

  const updateEntry = async (employee_id: number, date: string, status: string, shift_start: string | null) => {
    await fetch('/api/schedule/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id, date, status, shift_start })
    });
    setEditCell(null);
    fetchData();
  };

  const getEntry = (empId: number, dateIdx: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dateIdx);
    const dateStr = d.toISOString().split('T')[0];
    return schedule.find(s => s.employee_id === empId && s.date === dateStr);
  };

  const changeWeek = (offset: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + (offset * 7));
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const coverage = useMemo(() => {
    const result: any = {};
    DAYS.forEach((day, idx) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + idx);
      const dateStr = d.toISOString().split('T')[0];
      const isPeak = PEAK.includes(day);
      const dayType = isPeak ? 'weekend' : 'weekday';

      result[day] = {};
      Object.keys(ROLES).forEach(role => {
        const count = schedule.filter(s => s.role === role && s.date === dateStr && s.status === 'working').length;
        const rule = rules.find(r => r.role === role && r.day_type === dayType);
        const min = rule?.min_staff || 0;
        result[day][role] = { count, min, ok: count >= min };
      });
    });
    return result;
  }, [schedule, rules, weekStart]);

  const exportToCSV = () => {
    const headers = ['Name', 'Role', ...DAYS, 'Total Days'];
    const rows = employees.map(emp => {
      const empEntries = DAYS.map((_, i) => {
        const entry = getEntry(emp.id, i);
        return entry?.status === 'working' ? entry.shift_start || '5 PM' : entry?.status || 'LIBRE';
      });
      const workCount = schedule.filter(s => s.employee_id === emp.id && s.status === 'working').length;
      return [emp.name, ROLES[emp.role], ...empEntries, workCount];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `schedule_${weekStart}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-[#0d1420] px-4 py-2 rounded-2xl border border-[#1a2a44] shadow-sm">
          <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-[#1a2236] rounded-lg transition-colors text-[#4a5a7a]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-bold text-[#dde3f0] font-display uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-[#4361ee]" />
            Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <button onClick={() => changeWeek(1)} className="p-1 hover:bg-[#1a2236] rounded-lg transition-colors text-[#4a5a7a]">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="bg-[#0d1420] text-[#dde3f0] px-6 py-2.5 rounded-2xl font-bold font-display tracking-wider border border-[#1a2a44] hover:bg-[#1a2236] transition-all uppercase text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={generateSchedule}
            disabled={isGenerating}
            className="bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] text-white px-8 py-2.5 rounded-2xl font-black font-display tracking-[0.1em] hover:shadow-[0_8px_32px_rgba(67,97,238,0.33)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase"
          >
            <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : '⚡ Apply & Regenerate'}
          </button>
        </div>
      </div>

      <div className="bg-[#0d1420] rounded-2xl shadow-sm border border-[#1a2a44] overflow-x-auto">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#080c14] border-b border-[#1a2a44]">
              <th className="sticky left-0 z-10 bg-[#080c14] px-6 py-4 text-left text-[10px] font-black text-[#4a5a7a] uppercase tracking-[0.2em] border-r border-[#1a2a44] min-w-[200px]">
                Staff Member
              </th>
              {DAYS.map((day, i) => (
                <th key={day} className={`px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.1em] min-w-[110px] ${PEAK.includes(day) ? 'text-[#818cf8]' : 'text-[#4a5a7a]'}`}>
                  {day} {PEAK.includes(day) ? '🔥' : ''}
                  <div className="text-[9px] font-normal mt-1 opacity-60">
                    {new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + i)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </th>
              ))}
              <th className="px-4 py-4 text-[10px] font-black text-[#4a5a7a] uppercase tracking-[0.1em] text-center">Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2a44]">
            {Object.entries(ROLES).map(([roleCode, roleLabel]) => {
              const roleEmps = employees.filter(e => e.role === roleCode);
              if (roleEmps.length === 0) return null;

              return (
                <React.Fragment key={roleCode}>
                  <tr className="bg-[#0a1118]">
                    <td className="sticky left-0 z-10 bg-[#0a1118] px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-r border-[#1a2a44]" style={{ color: ROLE_COLORS[roleCode] }}>
                      {roleLabel}
                    </td>
                    {DAYS.map(day => {
                      const cov = coverage[day]?.[roleCode];
                      return (
                        <td key={day} className="px-4 py-2 text-center">
                          <div className={`text-[10px] font-bold ${cov?.ok ? 'text-[#06d6a0]' : 'text-[#f72585]'}`}>
                            {cov?.count}<span className="opacity-40 font-normal">/{cov?.min}</span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="bg-[#0a1118]"></td>
                  </tr>
                  {roleEmps.map(emp => {
                    const empEntries = schedule.filter(s => s.employee_id === emp.id);
                    const workCount = empEntries.filter(s => s.status === 'working').length;
                    
                    return (
                      <tr key={emp.id} className="hover:bg-[#1a2236]/30 transition-colors group">
                        <td className="sticky left-0 z-10 bg-[#0d1420] group-hover:bg-[#1a2236] px-6 py-4 border-r border-[#1a2a44] font-semibold text-[#c8d0e0]">
                          {emp.name}
                          <div className="text-[10px] text-[#4a5a7a] font-normal uppercase tracking-wider">{ROLES[emp.role]}</div>
                        </td>
                        {DAYS.map((day, i) => {
                          const entry = getEntry(emp.id, i);
                          const d = new Date(weekStart);
                          d.setDate(d.getDate() + i);
                          const dateStr = d.toISOString().split('T')[0];
                          const isPeak = PEAK.includes(day);
                          const isEditing = editCell?.empId === emp.id && editCell?.date === dateStr;
                          
                          let cellClass = "cell-libre";
                          let text = "LIBRE";
                          if (entry?.status === 'working') {
                            cellClass = isPeak ? "cell-working-peak" : "cell-working";
                            text = entry.shift_start || '5 PM';
                          } else if (entry?.status === 'VACATION') {
                            cellClass = "cell-vacation";
                            text = "VAC ✈️";
                          } else if (entry?.status === '-') {
                            cellClass = "cell-unavailable";
                            text = "—";
                          }

                          return (
                            <td 
                              key={i} 
                              className="px-2 py-2 text-center"
                            >
                              {isEditing ? (
                                <select 
                                  autoFocus
                                  className="w-full bg-[#1a2a44] border border-[#4361ee] text-white rounded-lg px-1 py-1 text-[11px] outline-none"
                                  defaultValue={entry?.status === 'working' ? entry.shift_start || '5 PM' : entry?.status || 'LIBRE'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const status = (val === 'LIBRE' || val === '-' || val === 'VACATION') ? val : 'working';
                                    const start = status === 'working' ? val : null;
                                    updateEntry(emp.id, dateStr, status, start);
                                  }}
                                  onBlur={() => setEditCell(null)}
                                >
                                  {SHIFT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <button
                                  onClick={() => setEditCell({ empId: emp.id, date: dateStr })}
                                  className={`w-full py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all hover:brightness-125 ${cellClass}`}
                                >
                                  {text}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 text-center">
                          <span className={`text-xs font-black ${workCount >= 6 ? 'text-[#f72585]' : workCount >= 5 ? 'text-[#fb8500]' : 'text-[#06d6a0]'}`}>
                            {workCount}/7
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0d1420] p-6 rounded-2xl border border-[#1a2a44]">
          <h3 className="text-[11px] font-black text-[#4a5a7a] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Coverage Summary
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(day => {
              const dayGaps = Object.keys(ROLES).filter(r => !coverage[day]?.[r]?.ok);
              const isPeak = PEAK.includes(day);
              return (
                <div key={day} className={`p-2 rounded-xl border ${dayGaps.length > 0 ? 'bg-[#f72585]/5 border-[#f72585]/20' : isPeak ? 'bg-[#4361ee]/5 border-[#4361ee]/20' : 'bg-[#080c14] border-[#1a2a44]'}`}>
                  <div className={`text-[10px] font-black text-center mb-1 ${isPeak ? 'text-[#818cf8]' : 'text-[#4a5a7a]'}`}>{day}</div>
                  {dayGaps.length === 0 ? (
                    <div className="flex justify-center"><CheckCircle2 className="w-3 h-3 text-[#06d6a0]" /></div>
                  ) : (
                    <div className="flex justify-center"><AlertCircle className="w-3 h-3 text-[#f72585]" /></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0d1420] p-6 rounded-2xl border border-[#1a2a44] flex items-center justify-center gap-8">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest">
            <div className="w-3 h-3 bg-[#06d6a015] border border-[#06d6a030] rounded-sm"></div>
            Working
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest">
            <div className="w-3 h-3 bg-[#4361ee25] border border-[#4361ee30] rounded-sm"></div>
            Peak Shift
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest">
            <div className="w-3 h-3 bg-[#ffffff0e] border border-[#1a2a44] rounded-sm"></div>
            LIBRE
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest">
            <div className="w-3 h-3 bg-[#fb850022] border border-[#fb850030] rounded-sm"></div>
            Vacation
          </div>
        </div>
      </div>
    </div>
  );
}
