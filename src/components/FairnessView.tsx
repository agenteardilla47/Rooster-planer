import React, { useState, useEffect, useMemo } from 'react';
import { Scale, Calendar } from 'lucide-react';
import { ScheduleEntry, Employee, ROLES } from '../types';

const PEAK = ['Fri', 'Sat', 'Sun'];

export default function FairnessView() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchData();
  }, [weekStart]);

  const fetchData = async () => {
    const [schedRes, empRes] = await Promise.all([
      fetch(`/api/schedule/${weekStart}`),
      fetch('/api/employees')
    ]);
    const schedData = await schedRes.json();
    const empData = await empRes.json();
    setSchedule(schedData);
    setEmployees(empData);
  };

  const fairnessData = useMemo(() => {
    const data = employees.map(emp => {
      const empEntries = schedule.filter(s => s.employee_id === emp.id);
      const weekendShifts = empEntries.filter(s => {
        const day = new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' });
        return PEAK.includes(day) && s.status === 'working';
      }).length;

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        weekendShifts
      };
    });

    return data.sort((a, b) => b.weekendShifts - a.weekendShifts);
  }, [employees, schedule]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 bg-[#0d1420] px-4 py-2 rounded-2xl border border-[#1a2a44] shadow-sm">
          <Calendar className="w-4 h-4 text-[#4361ee]" />
          <span className="font-bold text-[#dde3f0] font-display uppercase tracking-wider">
            Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest">
          <Scale className="w-4 h-4 text-[#4361ee]" />
          Weekend Fairness Tracker
        </div>
      </div>

      <div className="bg-[#0d1420] rounded-2xl shadow-sm border border-[#1a2a44] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#080c14] border-b border-[#1a2a44]">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Employee</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest">Position</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest text-center">Weekend Days Worked</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#4a5a7a] uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2a44]">
            {fairnessData.map((data) => {
              let rowClass = "hover:bg-[#1a2236]/30";
              let statusLabel = "";
              let statusClass = "";

              if (data.weekendShifts === 3) {
                rowClass = "bg-[#f72585]/5 hover:bg-[#f72585]/10";
                statusLabel = "High Load";
                statusClass = "text-[#f72585] bg-[#f72585]/10";
              } else if (data.weekendShifts === 0) {
                rowClass = "bg-[#06d6a0]/5 hover:bg-[#06d6a0]/10";
                statusLabel = "Resting";
                statusClass = "text-[#06d6a0] bg-[#06d6a0]/10";
              }

              return (
                <tr key={data.id} className={`${rowClass} transition-colors`}>
                  <td className="px-6 py-4 font-semibold text-[#dde3f0]">{data.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-[#4a5a7a] uppercase tracking-wider">
                      {ROLES[data.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {[1, 2, 3].map(i => (
                        <div 
                          key={i}
                          className={`w-2 h-2 rounded-full ${i <= data.weekendShifts ? 'bg-[#4361ee]' : 'bg-[#1a2a44]'}`}
                        />
                      ))}
                      <span className="ml-2 font-mono font-bold text-[#dde3f0]">{data.weekendShifts}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {statusLabel && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}`}>
                        {statusLabel}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-[#0d1420] rounded-xl border border-[#1a2a44] flex items-center gap-6">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest">
          <div className="w-3 h-3 bg-[#f72585]/20 border border-[#f72585]/40 rounded-sm"></div>
          3/3 Weekend Days (Red)
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest">
          <div className="w-3 h-3 bg-[#06d6a0]/20 border border-[#06d6a0]/40 rounded-sm"></div>
          0/3 Weekend Days (Green)
        </div>
        <div className="ml-auto text-[10px] text-[#4a5a7a] font-medium italic">
          * Weekend days are Friday, Saturday, and Sunday.
        </div>
      </div>
    </div>
  );
}
