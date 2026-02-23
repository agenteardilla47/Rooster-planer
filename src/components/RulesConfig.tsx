import React, { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { CoverageRule, Role, ROLES } from '../types';

const ROLE_COLORS: { [key: string]: string } = {
  HOST: '#f72585',
  WAIT: '#4361ee',
  BRUN: '#06d6a0',
  KRUN: '#fb8500',
  BART: '#8338ec',
  MGR: '#118ab2',
};

export default function RulesConfig() {
  const [rules, setRules] = useState<CoverageRule[]>([]);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const res = await fetch('/api/rules');
    const data = await res.json();
    setRules(data);
  };

  const updateRule = async (role: Role, day_type: 'weekday' | 'weekend', min_staff: number) => {
    await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, day_type, min_staff })
    });
    fetchRules();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0d1420] p-6 rounded-2xl shadow-sm border border-[#1a2a44]">
        <h2 className="text-lg font-bold font-display uppercase tracking-wider mb-8 flex items-center gap-2 text-white">
          <Settings2 className="w-5 h-5 text-[#4a5a7a]" />
          Coverage Requirements
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-[10px] font-black text-[#4a5a7a] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4a5a7a]"></div>
              Weekday (Mon-Thu)
            </h3>
            <div className="space-y-3">
              {Object.entries(ROLES).map(([code, label]) => {
                const rule = rules.find(r => r.role === code && r.day_type === 'weekday');
                return (
                  <div key={code} className="flex items-center justify-between p-4 bg-[#080c14] rounded-xl border border-[#1a2a44] group hover:border-[#4361ee]/30 transition-colors">
                    <span className="font-bold text-[#c8d0e0] flex items-center gap-3">
                      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: ROLE_COLORS[code] }}></div>
                      {label}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[#4a5a7a] uppercase">Min Staff</span>
                      <input
                        type="number"
                        className="w-16 bg-[#0d1420] px-3 py-1.5 rounded-lg border border-[#1a2a44] text-center font-mono text-[#dde3f0] focus:outline-none focus:ring-1 focus:ring-[#4361ee]"
                        value={rule?.min_staff || 0}
                        onChange={(e) => updateRule(code as Role, 'weekday', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-[#4361ee] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4361ee]"></div>
              Weekend (Fri-Sun) 🔥
            </h3>
            <div className="space-y-3">
              {Object.entries(ROLES).map(([code, label]) => {
                const rule = rules.find(r => r.role === code && r.day_type === 'weekend');
                return (
                  <div key={code} className="flex items-center justify-between p-4 bg-[#080c14] rounded-xl border border-[#1a2a44] group hover:border-[#4361ee]/30 transition-colors">
                    <span className="font-bold text-[#c8d0e0] flex items-center gap-3">
                      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: ROLE_COLORS[code] }}></div>
                      {label}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[#4a5a7a] uppercase">Min Staff</span>
                      <input
                        type="number"
                        className="w-16 bg-[#0d1420] px-3 py-1.5 rounded-lg border border-[#1a2a44] text-center font-mono text-[#dde3f0] focus:outline-none focus:ring-1 focus:ring-[#4361ee]"
                        value={rule?.min_staff || 0}
                        onChange={(e) => updateRule(code as Role, 'weekend', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
