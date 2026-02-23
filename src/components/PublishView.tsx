import React, { useState, useEffect, useRef } from 'react';
import { Download, Share2, Calendar, Phone } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ScheduleEntry, Employee, Role, ROLES, DAYS } from '../types';

const ROLE_COLORS: { [key: string]: string } = {
  HOST: '#f72585',
  WAIT: '#4361ee',
  BRUN: '#06d6a0',
  KRUN: '#fb8500',
  BART: '#8338ec',
  MGR: '#118ab2',
};

export default function PublishView() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const downloadImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#080c14',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `roster_${weekStart}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getDaySchedule = (dayIdx: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIdx);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayEntries = schedule.filter(s => s.date === dateStr && s.status === 'working');
    
    // Group by role
    const grouped: { [key: string]: any[] } = {};
    Object.keys(ROLES).forEach(role => {
      const entries = dayEntries.filter(e => e.role === role);
      if (entries.length > 0) grouped[role] = entries;
    });
    
    return grouped;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 bg-[#0d1420] px-4 py-2 rounded-2xl border border-[#1a2a44]">
          <Calendar className="w-4 h-4 text-[#4361ee]" />
          <span className="font-bold text-[#dde3f0] font-display uppercase tracking-wider">
            Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <button
          onClick={downloadImage}
          disabled={isExporting}
          className="bg-[#4361ee] text-white px-6 py-2.5 rounded-2xl font-black font-display tracking-wider hover:bg-[#3a0ca3] transition-all flex items-center gap-2 shadow-[0_4px_16px_rgba(67,97,238,0.2)] disabled:opacity-50"
        >
          <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
          {isExporting ? 'EXPORTING...' : 'DOWNLOAD FOR WHATSAPP'}
        </button>
      </div>

      <div className="flex justify-center">
        {/* The actual exportable area */}
        <div 
          ref={exportRef}
          className="w-full max-w-[450px] bg-[#080c14] p-8 border border-[#1a2a44] rounded-3xl shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="text-[10px] font-black text-[#4361ee] uppercase tracking-[0.3em] mb-1">Élévation Rooftop</div>
            <h1 className="text-2xl font-black font-display text-white uppercase tracking-tight">Staff Roster</h1>
            <div className="text-[11px] text-[#4a5a7a] font-bold uppercase tracking-widest mt-1">
              {new Date(weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — {
                new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              }
            </div>
            <div className="h-px w-12 bg-[#4361ee] mx-auto mt-4"></div>
          </div>

          <div className="space-y-8">
            {DAYS.map((day, idx) => {
              const grouped = getDaySchedule(idx);
              const d = new Date(weekStart);
              d.setDate(d.getDate() + idx);
              const isWeekend = ['Fri', 'Sat', 'Sun'].includes(day);

              return (
                <div key={day} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest ${
                      isWeekend ? 'bg-[#4361ee] text-white' : 'bg-[#1a2a44] text-[#4a5a7a]'
                    }`}>
                      {day} {d.getDate()}
                    </div>
                    <div className="h-px flex-1 bg-[#1a2a44]"></div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 pl-2">
                    {Object.entries(grouped).map(([role, entries]) => (
                      <div key={role} className="space-y-1.5">
                        <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: ROLE_COLORS[role] }}>
                          {ROLES[role as Role]}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {entries.map(entry => (
                            <div key={entry.id} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#dde3f0]">{entry.name}</span>
                              <span className="text-[10px] font-mono text-[#4a5a7a]">{entry.shift_start || '5 PM'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 pt-6 border-t border-[#1a2a44] text-center">
            <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-[#4a5a7a] uppercase tracking-widest">
              <Phone className="w-3 h-3" />
              Contact Manager for changes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
