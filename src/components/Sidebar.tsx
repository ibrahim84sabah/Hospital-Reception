import React from 'react';
import { 
  Users, 
  Stethoscope, 
  Microscope, 
  FlaskConical, 
  Pill, 
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { useHMS } from '../context/HMSContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Department } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const DEPARTMENTS: { id: Department; label: string; icon: React.ElementType }[] = [
  { id: 'Reception', label: 'Reception', icon: Users },
  { id: 'Nurse', label: 'Triage (Nursing)', icon: Stethoscope },
  { id: 'Doctor', label: 'Doctor Workbench', icon: Microscope },
  { id: 'Lab', label: 'Laboratory', icon: FlaskConical },
  { id: 'Radiology', label: 'Radiology', icon: LayoutDashboard },
  { id: 'Pharmacy', label: 'Pharmacy', icon: Pill },
];

const SYSTEM_UNITS: { id: Department; label: string; icon: React.ElementType }[] = [
  { id: 'Logs', label: 'Operational Logs', icon: Terminal },
];

export function Sidebar() {
  const { activeDepartment, setActiveDepartment, setShowDashboard } = useHMS();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeptClick = (deptId: Department) => {
    setActiveDepartment(deptId);
    setShowDashboard(false);
  };

  return (
    <aside className="w-68 bg-brand-dark text-slate-400 flex flex-col h-screen sticky top-0 z-20 border-r border-slate-800">
      <div className="p-8 flex-grow overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/30 transform rotate-3">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black tracking-tighter text-base leading-none uppercase">CareSync</h2>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] mt-1">NODE_V1</p>
          </div>
        </div>

        <nav className="space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 ml-2">Operational Units</p>
            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              const isActive = activeDepartment === dept.id;
              
              return (
                <button
                  key={dept.id}
                  onClick={() => handleDeptClick(dept.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative group overflow-hidden",
                    isActive 
                      ? "bg-brand-blue/10 text-brand-blue shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                      : "hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeDept"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue"
                    />
                  )}
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-brand-blue" : "text-slate-500"
                  )} />
                  <span className="tracking-tight">{dept.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-40" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 ml-2">System Control</p>
            {SYSTEM_UNITS.map((dept) => {
              const Icon = dept.icon;
              const isActive = activeDepartment === dept.id;
              
              return (
                <button
                  key={dept.id}
                  onClick={() => handleDeptClick(dept.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative group overflow-hidden",
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                      : "hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeDept"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"
                    />
                  )}
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-emerald-500" : "text-slate-500"
                  )} />
                  <span className="tracking-tight">{dept.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-40" />}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-slate-800/50">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 text-slate-500 hover:text-red-400 transition-all font-bold text-sm group w-full px-4 py-2"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-red-400/10 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="tracking-tight">System Logout</span>
        </button>
      </div>
    </aside>
  );
}
