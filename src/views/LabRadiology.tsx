import React, { useState } from 'react';
import { useHMS } from '../context/HMSContext';
import { Order } from '../types';
import { 
  FlaskConical, 
  LayoutDashboard, 
  CheckCircle2, 
  Upload, 
  Clock, 
  Shield,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function LabRadiology() {
  const { visits, patients, updateOrder, updateVisitStatus, activeDepartment } = useHMS();
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const selectedVisit = visits.find(v => v.id === selectedVisitId);
  const selectedPatient = selectedVisit ? patients.find(p => p.id === selectedVisit.patientId) : null;
  const selectedVisitData = selectedVisit && selectedPatient ? { visit: selectedVisit, patient: selectedPatient } : null;

  const [resultText, setResultText] = useState('');

  const activeVisits = visits.filter(v => 
    v.status !== 'Complete' && v.status !== 'Cancelled' && 
    (
      v.currentDepartment === activeDepartment || 
      v.orders.some(o => o.status === 'Ordered' && (
        (activeDepartment === 'Lab' && o.type === 'Laboratory') ||
        (activeDepartment === 'Radiology' && o.type === 'Radiology')
      ))
    )
  );

  const relevantOrders = selectedVisit?.orders.filter(o => 
    (activeDepartment === 'Lab' && o.type === 'Laboratory') ||
    (activeDepartment === 'Radiology' && o.type === 'Radiology')
  ) || [];

  const handleProcessOrder = async (order: Order) => {
    if (!selectedVisit || !resultText) return;
    
    await updateOrder(selectedVisit.id, order.id, {
      status: 'Completed',
      results: resultText
    });

    setResultText('');

    // Check if ALL orders of the CURRENT department type are done
    const allDeptDone = selectedVisit.orders
      .filter(o => o.type === (activeDepartment === 'Lab' ? 'Laboratory' : 'Radiology'))
      .every(o => o.id === order.id ? true : o.status === 'Completed');

    if (allDeptDone) {
      // Find what's next
      const nextRad = selectedVisit.orders.some(o => o.type === 'Radiology' && (o.id === order.id ? false : o.status === 'Ordered'));
      const nextLab = selectedVisit.orders.some(o => o.type === 'Laboratory' && (o.id === order.id ? false : o.status === 'Ordered'));

      if (activeDepartment === 'Lab' && nextRad) {
        await updateVisitStatus(selectedVisit.id, 'Waiting', 'Radiology');
      } else if (activeDepartment === 'Radiology' && nextLab) {
        await updateVisitStatus(selectedVisit.id, 'Waiting', 'Lab');
      } else {
        // Return to Reception Queue so they can be forwarded back to Doctor
        await updateVisitStatus(selectedVisit.id, 'Waiting', 'Reception');
      }
      setSelectedVisitId(null);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full p-2">
      {/* Search & Entry Queue */}
      <section className="col-span-12 lg:col-span-3 bento-card p-0 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", activeDepartment === 'Lab' ? "bg-emerald-500" : "bg-brand-blue")} />
              Diagnostic Queue
            </h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest leading-none">{activeDepartment}_Unit_v2</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
            <Search className="w-4 h-4" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {activeVisits.map(visit => {
            const patient = patients.find(p => p.id === visit.patientId);
            if (!patient) return null;
            const isSelected = selectedVisitData?.visit.id === visit.id;
            return (
              <button
                key={visit.id}
                onClick={() => setSelectedVisitId(visit.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all duration-300 relative group overflow-hidden",
                  selectedVisitId === visit.id 
                    ? "bg-slate-900 border-transparent text-white shadow-xl" 
                    : "bg-white border-slate-100 hover:border-slate-300 text-slate-600"
                )}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("text-[9px] font-mono font-black uppercase tracking-[0.2em]", isSelected ? "text-slate-500" : "text-brand-blue")}>
                      #{visit.token || '---'}
                    </span>
                    <Clock className={cn("w-3 h-3 opacity-40", isSelected ? "text-white" : "text-slate-400")} />
                  </div>
                  <h3 className="font-black tracking-tight text-sm uppercase italic truncate">{patient.firstName} {patient.lastName}</h3>
                  <div className={cn("mt-2 text-[9px] font-bold uppercase tracking-widest flex items-center justify-between", isSelected ? "text-white/40" : "text-slate-400")}>
                    <span>{patient.gender} • {2024 - new Date(patient.dob).getFullYear()}Y</span>
                    {isSelected && <ChevronRight className="w-3 h-3" />}
                  </div>
                </div>
              </button>
            );
          })}
          {activeVisits.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-100 rounded-3xl opacity-50">
              <FlaskConical className="w-8 h-8 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest italic opacity-40">Unit Standby</p>
            </div>
          )}
        </div>
      </section>

      {/* Lab / Radiology Workbench */}
      <section className="col-span-12 lg:col-span-6 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {!selectedVisitData ? (
             <motion.div 
               key="empty"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="bento-card-dark p-8 flex-1 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 blur-[120px] rounded-full" />
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8 relative rotate-12">
                   {activeDepartment === 'Lab' ? <FlaskConical className="w-10 h-10 text-emerald-500/40" /> : <LayoutDashboard className="w-10 h-10 text-brand-blue/40" />}
                </div>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">{activeDepartment} Workbench</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 text-center">Process inbound diagnostic requests for physician review</p>
                <div className="grid grid-cols-2 gap-8 text-center text-slate-600 max-w-sm">
                   <div><p className="text-[10px] font-black text-white/20 mb-1">UNIT_MODE</p><p className="text-xs font-bold uppercase tracking-widest text-emerald-500/50 italic">Processing</p></div>
                   <div><p className="text-[10px] font-black text-white/20 mb-1">VALIDATION</p><p className="text-xs font-bold uppercase tracking-widest text-brand-blue/50 italic">Active</p></div>
                </div>
             </motion.div>
          ) : (
            <motion.div 
              key={selectedVisitData.visit.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bento-card p-8 flex-1 flex flex-col"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                   <span className={cn("px-2 py-1 text-[10px] font-black rounded uppercase tracking-widest", activeDepartment === 'Lab' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-brand-blue")}>Active Test Session</span>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">{selectedVisitData.patient.firstName} {selectedVisitData.patient.lastName}</h2>
                   <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Ref_ID: {selectedVisitData.visit.id}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Vitals Context</p>
                   <div className="flex gap-4">
                      <div><p className="text-[8px] font-black text-slate-400 uppercase">Temp</p><p className="text-sm font-black italic">{selectedVisitData.visit.vitals?.temperature || '--'}</p></div>
                      <div><p className="text-[8px] font-black text-slate-400 uppercase">BP</p><p className="text-sm font-black italic">{selectedVisitData.visit.vitals?.bloodPressure || '--'}</p></div>
                   </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Pending Investigations</h4>
                {relevantOrders.map(order => (
                  <div key={order.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden group">
                     {order.status === 'Completed' && (
                       <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black uppercase tracking-widest">
                         <CheckCircle2 className="w-3 h-3" />
                         Results Uploaded
                       </div>
                     )}
                     <div className="flex items-center gap-3 mb-4">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", activeDepartment === 'Lab' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-brand-blue")}>
                           {activeDepartment === 'Lab' ? <FlaskConical className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                        </div>
                        <p className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{order.description}</p>
                     </div>
                     
                     {order.status !== 'Completed' ? (
                       <div className="space-y-4 pt-4 border-t border-slate-200/50">
                         <textarea 
                           value={resultText}
                           onChange={e => setResultText(e.target.value)}
                           placeholder="Enter technical findings..."
                           className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all resize-none"
                         />
                         <button 
                           onClick={() => handleProcessOrder(order)}
                           disabled={!resultText}
                           className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                         >
                           <Upload className="w-4 h-4" />
                           Execute Final Report
                         </button>
                       </div>
                     ) : (
                       <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                         <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Findings Repository</p>
                         <p className="text-xs font-bold text-slate-700 italic leading-relaxed">{order.results}</p>
                       </div>
                     )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Side Info / Biometrics */}
      <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
         <div className="bento-card-dark p-6 bg-brand-dark flex flex-col h-1/2 justify-between">
            <div>
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 italic">Secure Channel</h3>
              <div className="space-y-4">
                 <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Biometric Data</p>
                    <p className="text-xl font-black text-white italic tracking-tighter">{selectedVisitData ? `${2024 - new Date(selectedVisitData.patient.dob).getFullYear()}Y / ${selectedVisitData.patient.gender[0]}` : '--/--'}</p>
                 </div>
                 <div className="p-4 bg-brand-blue/10 border border-brand-blue/20 rounded-2xl flex items-center justify-between group cursor-help transition-all">
                    <div>
                      <p className="text-[8px] font-black text-brand-blue uppercase tracking-widest mb-1 italic">HL7 Protocol</p>
                      <p className="text-sm font-black text-white italic uppercase tracking-widest">ENABLED</p>
                    </div>
                    <Shield className="w-8 h-8 text-brand-blue/40 group-hover:scale-110 transition-transform" />
                 </div>
              </div>
            </div>
            <div className="text-right opacity-30">
               <p className="text-[10px] font-mono font-black uppercase text-white tracking-[0.3em]">UNIT_ACTIVE_002</p>
            </div>
         </div>
         <div className="bento-card flex-1 p-6 flex flex-col justify-between border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Unit Analytics</h3>
            <div className="space-y-3">
               {[
                 { label: 'Pending Tests', val: activeVisits.length },
                 { label: 'Avg Latency', val: '14 min' },
                 { label: 'Accuracy', val: '99.9%' }
               ].map(stat => (
                 <div key={stat.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 text-slate-600">
                   <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                   <span className="text-xs font-black italic text-brand-blue">{stat.val}</span>
                 </div>
               ))}
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl mt-6 border border-slate-100 italic">
               <p className="text-[9px] font-bold text-slate-500 leading-tight">Always verify reagents expiration before executing final reports.</p>
            </div>
         </div>
      </section>
    </div>
  );
}
