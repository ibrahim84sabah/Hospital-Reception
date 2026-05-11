import React from 'react';
import { useHMS } from '../context/HMSContext';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { visits, patients } = useHMS();
  
  const activeVisits = visits.filter(v => v.status !== 'Complete' && v.status !== 'Cancelled');
  const completedToday = visits.filter(v => v.status === 'Complete').length;

  const getDeptCount = (dept: string) => visits.filter(v => v.currentDepartment === dept && v.status !== 'Complete' && v.status !== 'Cancelled').length;

  return (
    <div className="grid grid-cols-12 grid-rows-6 gap-4 h-full">
      {/* Overview Card */}
      <section className="col-span-12 lg:col-span-4 row-span-3 bento-card p-6 flex flex-col justify-between">
        <div>
          <span className="px-2 py-1 bg-blue-50 text-brand-blue text-[10px] font-black rounded uppercase tracking-[0.2em]">Active Session</span>
          <h2 className="text-2xl font-black mt-6 tracking-tight">HOSPITAL <span className="text-slate-400 font-normal">OVERVIEW</span></h2>
          <p className="text-sm text-slate-500 mt-1">Real-time operational metrics for Node US-EAST</p>
        </div>

        <div className="space-y-6 mt-8">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-blue" />
              </div>
              <span className="font-bold text-slate-700">Total Patients</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">{patients.length}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <span className="font-bold text-slate-700">Active Visits</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">{activeVisits.length}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-widest">Completed Today</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-emerald-600 font-mono">{completedToday}</span>
          </div>
        </div>
      </section>

      {/* System Status / Network */}
      <section className="col-span-12 lg:col-span-8 row-span-2 bento-card-dark p-6 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <h3 className="font-black text-xs uppercase tracking-widest">Operational Network Status</h3>
            </div>
            <div className="flex gap-4 text-[10px] font-mono text-slate-500">
              <span>LIMS: CONNECTED</span>
              <span>RIS: OPTIMIZED</span>
              <span>PACS: ACTIVE</span>
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-4 gap-4">
            {['Reception', 'Nurse', 'Doctor', 'Pharmacy'].map((dept) => (
              <div key={dept} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors group-hover:scale-[1.02]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{dept}</span>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-black tracking-tighter text-white">{getDeptCount(dept)}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-brand-blue transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Department Load Heatmap */}
      <section className="col-span-12 lg:col-span-6 row-span-3 bento-card p-6">
        <h3 className="font-black text-xs text-slate-400 uppercase tracking-[0.2em] mb-6">Department Load Heatmap</h3>
        <div className="space-y-4">
          {[
            { name: 'Pharmacy Unit', count: getDeptCount('Pharmacy'), max: 10, color: 'bg-emerald-500' },
            { name: 'Triage Center', count: getDeptCount('Nurse'), max: 10, color: 'bg-brand-blue' },
            { name: 'Physician Block', count: getDeptCount('Doctor'), max: 10, color: 'bg-amber-500' },
            { name: 'Reception Deck', count: getDeptCount('Reception'), max: 10, color: 'bg-slate-900' },
            { name: 'Radiology Block', count: getDeptCount('Radiology'), max: 10, color: 'bg-indigo-500' },
            { name: 'Laboratory Block', count: getDeptCount('Lab'), max: 10, color: 'bg-purple-500' },
          ].map((dept) => (
            <div key={dept.name} className="space-y-2 p-1 rounded-lg transition-all">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-600">{dept.name}</span>
                <span className="text-slate-400 font-mono">{dept.count}/{dept.max} Patients</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (dept.count / dept.max) * 100)}%` }}
                  className={cn("h-full rounded-full shadow-lg", dept.color)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Insights Card */}
      <section className="col-span-12 lg:col-span-6 row-span-3 bento-card p-6 bg-gradient-to-br from-white to-slate-50 flex flex-col justify-between">
        <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">System Insights & Intelligence</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20 rotate-12">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 italic">Security Protocol Active</h4>
          <p className="text-xs font-bold text-slate-500 leading-relaxed mb-6 max-w-xs">
            Operational security audit complete. All 256-bit AES data streams are synchronized with remote medical nodes.
            <span className="text-emerald-600 ml-1">ZDT Connectivity Verified.</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button className="py-3 bg-brand-blue text-white rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-brand-blue/90 transition-all shadow-xl shadow-brand-blue/20">
            Network Audit
          </button>
          <button className="py-3 bg-slate-900 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
            Enc. Keys
          </button>
        </div>
      </section>
    </div>
  );
}
