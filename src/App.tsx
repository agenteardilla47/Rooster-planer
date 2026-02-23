import React, { useState } from 'react';
import { Users, Settings2, CalendarDays, LayoutDashboard, LogOut, ClipboardList, BarChart3, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StaffManager from './components/StaffManager';
import RulesConfig from './components/RulesConfig';
import ScheduleGrid from './components/ScheduleGrid';
import RequestsManager from './components/RequestsManager';
import PublishView from './components/PublishView';
import FairnessView from './components/FairnessView';

type Tab = 'schedule' | 'staff' | 'rules' | 'requests' | 'publish' | 'fairness';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');

  const navItems = [
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'publish', label: 'Publish', icon: BarChart3 },
    { id: 'fairness', label: 'Fairness', icon: Scale },
    { id: 'requests', label: 'Requests', icon: ClipboardList },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'rules', label: 'Rules', icon: Settings2 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-[#dde3f0]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0d1a2e] to-[#080c14] border-b border-[#1a2a44] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-center pt-5 pb-0">
            <div>
              <div className="text-[11px] font-bold text-[#4361ee] uppercase tracking-[0.25em] mb-1">
                Élévation Rooftop
              </div>
              <h1 className="text-3xl font-black font-display tracking-tight text-white uppercase">
                Planificación Semanal
              </h1>
              <div className="text-xs text-[#4a5a7a] mt-1">
                Feb 23 – Mar 1, 2026
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold text-[#4a5a7a] uppercase tracking-widest">Manager View</p>
                <p className="text-sm font-medium text-[#c8d0e0]">Admin User</p>
              </div>
              <button className="p-2 text-[#4a5a7a] hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-2 mt-5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                  activeTab === item.id
                    ? 'bg-[#0d1420] text-white border-[#4361ee]'
                    : 'text-[#4a5a7a] hover:text-white hover:bg-[#1a2236] border-transparent'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#4361ee]' : 'text-[#4a5a7a]'}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'schedule' && <ScheduleGrid />}
            {activeTab === 'staff' && <StaffManager />}
            {activeTab === 'rules' && <RulesConfig />}
            {activeTab === 'requests' && <RequestsManager />}
            {activeTab === 'publish' && <PublishView />}
            {activeTab === 'fairness' && <FairnessView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
