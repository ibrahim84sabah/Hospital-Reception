import React, { useState } from 'react';
import { useHMS } from '../context/HMSContext';
import { 
  Pill, 
  CheckCircle2, 
  CreditCard,
  Clock,
  Shield,
  Search,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Pharmacy() {
  const { visits, patients, updateOrder, updateVisitStatus, markPaid } = useHMS();
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const selectedVisit = visits.find(v => v.id === selectedVisitId);
  const selectedPatient = selectedVisit ? patients.find(p => p.id === selectedVisit.patientId) : null;
  const selectedVisitData = selectedVisit && selectedPatient ? { visit: selectedVisit, patient: selectedPatient } : null;

  const activeVisits = visits.filter(v => 
    v.status !== 'Complete' && v.status !== 'Cancelled' && 
    (
      v.currentDepartment === 'Pharmacy' || 
      v.orders.some(o => o.status === 'Ordered' && o.type === 'Pharmacy')
    )
  );
  const prescriptions = selectedVisit?.orders.filter(o => o.type === 'Pharmacy') || [];

  const handleDispense = async (orderId: string) => {
    if (!selectedVisit) return;
    await updateOrder(selectedVisit.id, orderId, { status: 'Dispensed' });
  };

  const finalizeVisit = async () => {
    if (!selectedVisit) return;
    if (selectedVisit.isPaid) {
      await updateVisitStatus(selectedVisit.id, 'Complete');
      setSelectedVisitId(null);
    } else {
      alert("Please process payment at the pharmacy desk before closing the visit.");
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full p-2">
      {/* Pharmacy Queue */}
      <section className="col-span-12 lg:col-span-3 bento-card p-0 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              RX Fulfillment
            </h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest leading-none">Pharmacy_Unit_44</p>
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
                    <span className={cn("text-[9px] font-mono font-black uppercase tracking-[0.2em]", isSelected ? "text-slate-500" : "text-orange-500")}>
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
              <Pill className="w-8 h-8 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest italic opacity-40">Unit Idle</p>
            </div>
          )}
        </div>
      </section>

      {/* RX Workbench */}
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
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 blur-[120px] rounded-full" />
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8 relative -rotate-6">
                   <Pill className="w-10 h-10 text-orange-500/40" />
                </div>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">Pharmacy Workbench</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 text-center">Dispense verified prescriptions & authorize collection</p>
                <div className="grid grid-cols-2 gap-8 text-center text-slate-600 max-w-sm">
                   <div><p className="text-[10px] font-black text-white/20 mb-1">UNIT_MODE</p><p className="text-xs font-bold uppercase tracking-widest text-orange-500/50 italic">Fullfillment</p></div>
                   <div><p className="text-[10px] font-black text-white/20 mb-1">INVENTORY</p><p className="text-xs font-bold uppercase tracking-widest text-brand-blue/50 italic">Live_Sync</p></div>
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
                   <span className={cn("px-2 py-1 text-[10px] font-black rounded uppercase tracking-widest", selectedVisitData.visit.isPaid ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600")}>
                     {selectedVisitData.visit.isPaid ? 'Payment Received' : 'Action Required: Payment'}
                   </span>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">{selectedVisitData.patient.firstName} {selectedVisitData.patient.lastName}</h2>
                   <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Visit_UID: {selectedVisitData.visit.id}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Diagnosis Context</p>
                   <p className="text-sm font-black text-slate-800 italic uppercase truncate max-w-[200px]">{selectedVisitData.visit.diagnosis || 'NOT_RECORDED'}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Prescription Stream</h4>
                {prescriptions.map(order => (
                  <div key={order.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-orange-500/30 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                           <Pill className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{order.description}</p>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Dispensing Node_RX4</p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-3">
                        {order.status === 'Dispensed' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Dispensed
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDispense(order.id)}
                            className="px-6 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                          >
                            Execute Fulfillment
                          </button>
                        )}
                     </div>
                  </div>
                ))}
                {prescriptions.length === 0 && (
                   <div className="p-12 text-center text-slate-300 border border-dashed border-slate-200 rounded-3xl opacity-40 italic">
                      <p className="text-[10px] font-black uppercase tracking-widest">No verified RX in consultation log</p>
                   </div>
                )}
              </div>

              {!selectedVisit.isPaid && (
                 <div className="mt-8 p-6 bg-brand-blue rounded-3xl text-white flex items-center justify-between shadow-2xl shadow-brand-blue/20">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="font-black text-sm uppercase tracking-widest text-white/90">Point of Sale Override</h4>
                          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Process collection payment</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => markPaid(selectedVisit.id)}
                      className="bg-white text-brand-blue px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg"
                    >
                      Authorize Payment
                    </button>
                 </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-50 flex justify-end">
                <button 
                  onClick={finalizeVisit}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl shadow-slate-200"
                >
                  Finalize & Terminate Visit
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Analytics & Meta */}
      <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
         <div className="bento-card-dark p-6 bg-brand-dark flex flex-col h-1/2">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 italic">Registry Biometrics</h3>
            <div className="space-y-4">
               <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Patient Sector</p>
                  <p className="text-xl font-black text-white italic tracking-tighter">{selectedVisitData ? `${2024 - new Date(selectedVisitData.patient.dob).getFullYear()}Y / ${selectedVisitData.patient.gender[0]}` : '--/--'}</p>
               </div>
               <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-2xl flex items-center justify-between group">
                  <div>
                    <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1 italic">Security Status</p>
                    <p className="text-sm font-black text-white italic uppercase tracking-widest">CONFIRMED</p>
                  </div>
                  <Shield className="w-8 h-8 text-orange-500/40 group-hover:scale-110 transition-transform" />
               </div>
            </div>
         </div>
         <div className="bento-card flex-1 p-6 flex flex-col justify-between border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Inventory Telemetry</h3>
            <div className="space-y-3">
               {[
                 { label: 'Stock Level', val: '88.4%', trend: 'up' },
                 { label: 'Avg Fulfillment', val: '6.2m', trend: 'down' },
                 { label: 'POS Clearance', val: '100%', trend: 'stable' }
               ].map(stat => (
                 <div key={stat.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 text-slate-600">
                   <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-black italic text-brand-blue">{stat.val}</span>
                      {stat.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-500" />}
                   </div>
                 </div>
               ))}
            </div>
            <div className="p-4 bg-orange-50/50 rounded-2xl mt-6 border border-orange-100 italic">
               <p className="text-[9px] font-bold text-orange-800 leading-tight">Verified prescriptions must be dispensed within the session timeframe to avoid LIMS timeout.</p>
            </div>
         </div>
      </section>
    </div>
  );
}
