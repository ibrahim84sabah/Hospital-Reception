import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useHMS } from '../context/HMSContext';
import { AlertTriangle, Trash2 } from 'lucide-react';

export function OperationalLogs() {
  const { clearAllData, patients, visits } = useHMS();
  const [isConfirming, setIsConfirming] = useState(false);

  const handlePurge = async () => {
    await clearAllData();
    setIsConfirming(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase italic text-brand-dark">
            Operational <span className="text-brand-blue">Security Logs</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">System Audit & Control Panel</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsConfirming(true)}
            className="px-6 py-2 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-rose-100 uppercase tracking-widest flex items-center gap-2 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge All Records
          </button>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Buffer: Active
          </div>
        </div>
      </div>

      {isConfirming && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-rose-600 rounded-[2rem] text-white shadow-2xl shadow-rose-200"
        >
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center shrink-0">
               <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black uppercase italic mb-2 tracking-tight">Destructive Action Warning</h3>
              <p className="text-sm font-bold text-rose-50 leading-relaxed mb-6">
                You are about to purge <span className="underline decoration-2 underline-offset-4">{patients.length} patients</span> and <span className="underline decoration-2 underline-offset-4">{visits.length} session logs</span> from the secure core. 
                This action is irreversible and will result in a total state reset.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={handlePurge}
                  className="px-8 py-3 bg-white text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all shadow-xl"
                >
                  Confirm Full Purge
                </button>
                <button 
                  onClick={() => setIsConfirming(false)}
                  className="px-8 py-3 bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-800 transition-all"
                >
                  Abrupt Abort
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <section className="flex-1 bento-card-dark bg-brand-dark border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-0">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/2">
          <span className="text-[10px] font-mono font-bold text-brand-blue uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
            OPERATIONAL_LOG // REAL_TIME_STREAM
          </span>
          <div className="flex gap-6 text-[9px] font-mono text-slate-500 uppercase font-black">
            <span>Kernel: v1.0.4-i</span>
            <span>Node: SECTOR-7G</span>
            <span>Uptime: 14:22:01</span>
          </div>
        </div>
        <div className="p-8 font-mono text-[12px] leading-relaxed flex-grow overflow-y-auto custom-scrollbar bg-[rgba(15,23,42,0.5)]">
          <div className="space-y-3">
            {[
              { time: '12:01:42', type: 'AUTH_VERIFIED', service: 'GOOGLE_IAM', status: 'GRANTED', color: 'text-emerald-400' },
              { time: '12:02:15', type: 'DB_CONNECTION', service: 'FIRESTORE', status: 'ESTABLISHED', color: 'text-brand-blue' },
              { time: '12:04:33', type: 'LIMS_SYNC', records: 14, latency: '12ms', status: 'SYNCED', color: 'text-brand-blue' },
              { time: '12:05:12', type: 'DB_QUERY', path: '/visits', op: 'LIST', status: 'SUCCESS', color: 'text-amber-400' },
              { time: '12:08:44', type: 'ENCRYPTION_WAVE', algo: 'AES-256', bits: 256, status: 'LOCKED', color: 'text-emerald-400' },
              { time: '12:10:01', type: 'HMR_SYNC', status: 'DISABLED', platform: 'AIS_CORE', color: 'text-slate-400' },
              { time: '12:12:55', type: 'PATIENT_WRITE', id: 'MRN-8842', status: 'COMMITTED', color: 'text-brand-blue' },
              { time: '12:15:20', type: 'DEPT_TRANSFER', from: 'Reception', to: 'Nurse', id: 'VIS-9921', color: 'text-amber-400' },
              { time: '12:18:11', type: 'VITAL_PUSH', id: 'VIS-9921', status: 'VALIDATED', color: 'text-emerald-400' },
              { time: '12:20:45', type: 'DOCTOR_WORKBENCH', action: 'SOAP_INIT', status: 'ACTIVE', color: 'text-brand-blue' },
            ].map((log, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex gap-6 items-start py-1.5 border-b border-white/2 last:border-0 hover:bg-white/2 transition-colors"
              >
                <span className="text-slate-600 shrink-0 tabular-nums">{log.time}</span>
                <div className={log.color}>
                  <span className="text-slate-500 italic">event:</span> {JSON.stringify(log)}
                </div>
              </motion.div>
            ))}
            <div className="flex gap-6 items-start py-4 animate-pulse">
              <span className="text-slate-600 shrink-0">12:22:00</span>
              <div className="text-slate-400 font-black italic">
                <span className="bg-slate-800 px-3 py-1 rounded-lg text-slate-500 mr-2 not-italic tracking-tighter">_ SYSTEM_AWAITING</span> INBOUND DATA STREAM FROM REMOTE SENSORS...
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-900 border-t border-white/5 flex gap-8">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Network Stability: 99.9%</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AES-256 Tunnel Active</span>
           </div>
        </div>
      </section>
    </div>
  );
}
