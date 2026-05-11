import React, { useState } from 'react';
import { useHMS } from '../context/HMSContext';
import { SOAPNotes } from '../types';
import { 
  Activity, 
  CheckCircle2, 
  Plus,
  Microscope,
  Clock,
  Thermometer,
  Shield,
  Search,
  ChevronRight,
  HeartPulse,
  Weight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export function Doctor() {
  const { visits, patients, updateSOAP, updateVisitStatus, addOrder, createFollowUp } = useHMS();
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const selectedVisit = visits.find(v => v.id === selectedVisitId);
  const selectedPatient = selectedVisit ? patients.find(p => p.id === selectedVisit.patientId) : null;
  const selectedVisitData = selectedVisit && selectedPatient ? { visit: selectedVisit, patient: selectedPatient } : null;

  const [soap, setSoap] = useState<SOAPNotes>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });
  const [diagnosis, setDiagnosis] = useState('');
  const [activeTab, setActiveTab] = useState<'soap' | 'orders' | 'pharmacy' | 'vitals' | 'history'>('soap');
  const [orderDesc, setOrderDesc] = useState('');
  const [selectedOrderType, setSelectedOrderType] = useState<'Laboratory' | 'Radiology' | 'Pharmacy'>('Laboratory');
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const activeVisits = visits.filter(v => v.currentDepartment === 'Doctor' && v.status !== 'Complete' && v.status !== 'Cancelled');

  const patientHistory = selectedVisitData 
    ? visits.filter(v => v.patientId === selectedVisitData.patient.id && v.id !== selectedVisitData.visit.id)
    : [];

  const handleSaveSOAP = async () => {
    if (!selectedVisitData) return;
    await updateSOAP(selectedVisit.id, soap, diagnosis);
  };

  const handleAddOrder = async () => {
    if (!selectedVisit || !orderDesc) return;
    await addOrder(selectedVisit.id, { type: selectedOrderType, description: orderDesc });
    setOrderDesc('');
  };

  const concludeVisit = async (requireFollowUp: boolean) => {
    if (!selectedVisit || !selectedPatient) return;
    await handleSaveSOAP();
    
    if (requireFollowUp) {
      // Create a NEW visit record for the follow up date
      await createFollowUp(selectedPatient.id, followUpDate);
      // Mark current visit as complete
      await updateVisitStatus(selectedVisit.id, 'Complete');
      alert(`Follow-up scheduled for ${followUpDate}. A new waiting entry has been created.`);
    } else {
      const hasPharma = selectedVisit.orders.some(o => o.type === 'Pharmacy' && o.status === 'Ordered');
      const hasLabs = selectedVisit.orders.some(o => o.type === 'Laboratory' && o.status === 'Ordered');
      const hasRad = selectedVisit.orders.some(o => o.type === 'Radiology' && o.status === 'Ordered');

      if (hasPharma) {
        await updateVisitStatus(selectedVisit.id, 'Waiting', 'Pharmacy');
      } else if (hasLabs) {
        await updateVisitStatus(selectedVisit.id, 'Waiting', 'Lab');
      } else if (hasRad) {
        await updateVisitStatus(selectedVisit.id, 'Waiting', 'Radiology');
      } else {
        await updateVisitStatus(selectedVisit.id, 'Complete');
      }
    }
    
    setSelectedVisitId(null);
    setShowFollowUpPicker(false);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full p-2">
      {/* Patient Queue Dashboard */}
      <section className="col-span-12 lg:col-span-3 bento-card p-0 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
              Inbound Queue
            </h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest leading-none">Physician Block 102</p>
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
                onClick={() => {
                  setSelectedVisitId(visit.id);
                  setSoap(visit.soapNotes || { subjective: '', objective: '', assessment: '', plan: '' });
                  setDiagnosis(visit.diagnosis || '');
                }}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all duration-300 relative group overflow-hidden",
                  selectedVisitId === visit.id 
                    ? "bg-brand-blue border-transparent text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)]" 
                    : "bg-white border-slate-100 hover:border-brand-blue/30 text-slate-600"
                )}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("text-[9px] font-mono font-black uppercase tracking-[0.2em]", isSelected ? "text-white/60" : "text-brand-blue")}>
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
              <Microscope className="w-8 h-8 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest italic opacity-40">Block Idle</p>
            </div>
          )}
        </div>
      </section>

      {/* Workbench Context */}
      <section className="col-span-12 lg:col-span-9 flex flex-col gap-6">
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
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-8 relative">
                 <Microscope className="w-10 h-10 text-white/10" />
                 <div className="absolute inset-0 border-t-2 border-brand-blue rounded-full opacity-40 animate-spin" />
               </motion.div>
               <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">Physician Workbench</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">Awaiting encrypted biometrics stream...</p>
               <div className="grid grid-cols-3 gap-8 text-center text-slate-600 max-w-md">
                 <div><p className="text-[10px] font-black text-white/20 mb-1">NODE_STAT</p><p className="text-xs font-bold uppercase tracking-widest text-emerald-500/50 italic">Operational</p></div>
                 <div><p className="text-[10px] font-black text-white/20 mb-1">ENCRYPTION</p><p className="text-xs font-bold uppercase tracking-widest text-brand-blue/50 italic">AES-256</p></div>
                 <div><p className="text-[10px] font-black text-white/20 mb-1">LIMS_SYNC</p><p className="text-xs font-bold uppercase tracking-widest text-white/30 italic">Connected</p></div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key={selectedVisitData.visit.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-12 gap-6 h-full"
            >
              {/* SOAP & Diagnosis */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 h-full">
                <div className="bento-card p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="px-2 py-1 bg-blue-50 text-brand-blue text-[10px] font-black rounded uppercase tracking-widest">Active Consultation</span>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">{selectedVisitData.patient.firstName} {selectedVisitData.patient.lastName}</h2>
                      <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Visit_UID: {selectedVisitData.visit.id}</p>
                    </div>
                    <div className="flex gap-2">
                       <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        {(['vitals', 'soap', 'orders', 'pharmacy', 'history'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                              activeTab === tab ? "bg-white text-brand-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                          >
                            {tab}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {activeTab === 'soap' && (
                      <div className="grid grid-cols-2 gap-6 pb-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Subjective // History</label>
                          <textarea 
                            value={soap.subjective}
                            onChange={e => setSoap({...soap, subjective: e.target.value})}
                            placeholder="S: Patient states..."
                            className="w-full min-h-[200px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all resize-y"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Objective // Examination</label>
                          <textarea 
                            value={soap.objective}
                            onChange={e => setSoap({...soap, objective: e.target.value})}
                            placeholder="O: On examination..."
                            className="w-full min-h-[200px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all resize-y"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Assessment // Diagnosis</label>
                          <textarea 
                            value={soap.assessment}
                            onChange={e => setSoap({...soap, assessment: e.target.value})}
                            placeholder="A: Differential..."
                            className="w-full min-h-[200px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all resize-y"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Plan // Treatment</label>
                          <textarea 
                            value={soap.plan}
                            onChange={e => setSoap({...soap, plan: e.target.value})}
                            placeholder="P: Initiate..."
                            className="w-full min-h-[200px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all resize-y"
                          />
                        </div>
                        <div className="col-span-2 space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Clinical Case Definition</label>
                          <div className="relative">
                            <input 
                              value={diagnosis}
                              onChange={e => setDiagnosis(e.target.value)}
                              placeholder="Case Definition..."
                              className="w-full pl-12 pr-4 py-4 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl text-brand-blue font-black uppercase text-sm tracking-widest focus:bg-white outline-none transition-all"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-brand-blue text-white rounded flex items-center justify-center font-black text-[10px] italic">ICD</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'vitals' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-8 overflow-y-auto max-h-[400px] custom-scrollbar">
                        {[
                          { icon: Thermometer, label: 'Temp', value: selectedVisitData.visit.vitals?.temperature, unit: '°C' },
                          { icon: Activity, label: 'BP', value: selectedVisitData.visit.vitals?.bloodPressure, unit: 'mmHg' },
                          { icon: HeartPulse, label: 'Pulse', value: selectedVisitData.visit.vitals?.pulse, unit: 'BPM' },
                          { icon: Weight, label: 'Weight', value: selectedVisitData.visit.vitals?.weight, unit: 'KG' },
                          { icon: Activity, label: 'Height', value: selectedVisitData.visit.vitals?.height, unit: 'cm' },
                          { icon: Activity, label: 'Respiratory', value: selectedVisitData.visit.vitals?.respiratoryRate, unit: 'BPM' },
                          { icon: Activity, label: 'O2 Sat', value: selectedVisitData.visit.vitals?.oxygenSaturation, unit: '%' },
                        ].map(vital => (
                          <div key={vital.label} className="p-6 bento-card-dark bg-slate-900 border-white/5 text-center group hover:scale-[1.05] transition-all min-h-[160px]">
                            <vital.icon className="w-5 h-5 text-slate-600 mx-auto mb-4 group-hover:text-brand-blue" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{vital.label}</p>
                            <p className="text-2xl font-black text-white tracking-tighter italic">{vital.value || '--'}</p>
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">{vital.unit}</p>
                          </div>
                        ))}
                        {!selectedVisitData.visit.vitals && (
                           <div className="col-span-full p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl opacity-40">
                             <p className="text-[10px] font-black uppercase tracking-widest">No vitals recived from TRIAGE sector</p>
                           </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'orders' && (
                       <div className="space-y-6 pb-8">
                          <div className="bento-card p-6 border-brand-blue/10 bg-slate-50/50">
                             <div className="flex gap-2 mb-4">
                               {['Laboratory', 'Radiology'].map(type => (
                                 <button
                                   key={type}
                                   onClick={() => setSelectedOrderType(type as 'Laboratory' | 'Radiology')}
                                   className={cn(
                                     "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                     selectedOrderType === type 
                                       ? "bg-brand-blue text-white border-transparent" 
                                       : "bg-white text-slate-400 border-slate-100 hover:border-brand-blue/30"
                                   )}
                                 >
                                   {type}
                                 </button>
                               ))}
                             </div>
                             <div className="flex gap-4">
                               <input 
                                 value={orderDesc}
                                 onChange={e => setOrderDesc(e.target.value)}
                                 placeholder={`Specify ${selectedOrderType} details...`}
                                 className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                               />
                               <button 
                                 onClick={handleAddOrder}
                                 disabled={!orderDesc}
                                 className="px-6 py-3 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-blue/20"
                               >
                                 Push Order
                               </button>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                               {selectedVisitData.visit.orders.filter(o => o.type !== 'Pharmacy').map(order => {
                                 const isCompleted = order.status === 'Completed';
                                 const isExpanded = expandedOrderId === order.id;
                                 return (
                                   <div 
                                     key={order.id} 
                                     onClick={() => isCompleted && setExpandedOrderId(isExpanded ? null : order.id)}
                                     className={cn(
                                       "p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 shadow-sm",
                                       isCompleted ? "bg-emerald-50/50 border-emerald-100 cursor-pointer hover:bg-emerald-100/50" : "bg-white border-slate-100",
                                       isExpanded && "ring-2 ring-emerald-500/20"
                                     )}
                                   >
                                     <div className="flex items-start justify-between">
                                       <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                              "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest",
                                              order.type === 'Laboratory' ? "bg-purple-50 text-purple-500" :
                                              order.type === 'Radiology' ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
                                            )}>
                                              {order.type}
                                            </span>
                                            <span className={cn(
                                              "text-[9px] font-black uppercase tracking-widest",
                                              isCompleted ? "text-emerald-600" : "text-slate-300"
                                            )}>
                                              // {order.status}
                                            </span>
                                          </div>
                                          <p className="text-xs font-bold text-slate-800 leading-tight italic">{order.description}</p>
                                       </div>
                                       <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", 
                                         isCompleted ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
                                       )} />
                                     </div>

                                     {(order.results && isExpanded) && (
                                       <motion.div 
                                         initial={{ opacity: 0, height: 0 }}
                                         animate={{ opacity: 1, height: 'auto' }}
                                         className="pt-3 border-t border-emerald-100/50"
                                       >
                                         <p className="text-[8px] font-black text-brand-blue uppercase tracking-widest mb-2 italic flex items-center gap-1">
                                           <CheckCircle2 className="w-2.5 h-2.5" /> Diagnostic Report Stream:
                                         </p>
                                         <div className="bg-white/50 p-3 rounded-xl border border-emerald-50 text-[11px] font-bold text-slate-600 leading-relaxed italic">
                                           {order.results}
                                         </div>
                                       </motion.div>
                                     )}
                                     
                                     {(isCompleted && !isExpanded) && (
                                       <p className="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest text-center mt-1 animate-pulse">Click to view findings</p>
                                     )}
                                   </div>
                                 );
                               })}
                             {selectedVisitData.visit.orders.filter(o => o.type !== 'Pharmacy').length === 0 && (
                                <div className="col-span-2 p-12 text-center text-slate-300 border border-dashed border-slate-200 rounded-3xl">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">No diagnostic orders in current buffer</p>
                                </div>
                             )}
                          </div>
                       </div>
                    )}
                    {activeTab === 'pharmacy' && (
                       <div className="space-y-6 pb-8">
                          <div className="bento-card p-6 border-brand-blue/10 bg-slate-50/50">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic mb-4 block">New Prescription</label>
                             <div className="flex gap-4">
                               <input 
                                 value={orderDesc}
                                 onChange={e => setOrderDesc(e.target.value)}
                                 placeholder="Medication name, dosage, frequency..."
                                 className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                 onFocus={() => setSelectedOrderType('Pharmacy')}
                               />
                               <button 
                                 onClick={handleAddOrder}
                                 disabled={!orderDesc}
                                 className="px-6 py-3 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-blue/20"
                               >
                                 Add to RX
                               </button>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                               {selectedVisitData.visit.orders.filter(o => o.type === 'Pharmacy').map(order => (
                                 <div key={order.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center group hover:border-brand-blue/30 transition-all">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                                        <Plus className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight italic">{order.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                                          <span className={cn("text-[8px] font-black uppercase tracking-widest", order.status === 'Dispensed' ? "text-emerald-500" : "text-amber-500")}>
                                            {order.status}
                                          </span>
                                        </div>
                                      </div>
                                   </div>
                                   <Clock className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                 </div>
                               ))}
                             {selectedVisitData.visit.orders.filter(o => o.type === 'Pharmacy').length === 0 && (
                                <div className="p-12 text-center text-slate-300 border border-dashed border-slate-200 rounded-3xl">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">No medications prescribed yet</p>
                                </div>
                             )}
                          </div>
                       </div>
                    )}
                    {activeTab === 'history' && (
                      <div className="space-y-4 pb-8 h-full overflow-y-auto max-h-[500px] custom-scrollbar">
                        {patientHistory.slice().reverse().map(prevVisit => (
                          <div key={prevVisit.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                              <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Visit: {format(new Date(prevVisit.createdAt), 'MMM d, yyyy')}</span>
                              <span className="text-[8px] font-mono font-bold text-slate-300">#{prevVisit.id.slice(-6)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Diagnosis</p>
                                <p className="text-xs font-black text-slate-800 uppercase italic truncate">{prevVisit.diagnosis || '---'}</p>
                              </div>
                              <div className="space-y-1 text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{prevVisit.status}</p>
                              </div>
                            </div>
                            {prevVisit.soapNotes && (
                              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                <div>
                                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Assessment</p>
                                  <p className="text-[10px] text-slate-600 line-clamp-2 italic">{prevVisit.soapNotes.assessment}</p>
                                </div>
                                <div>
                                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Plan</p>
                                  <p className="text-[10px] text-slate-600 line-clamp-2 italic">{prevVisit.soapNotes.plan}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {patientHistory.length === 0 && (
                          <div className="h-64 flex flex-col items-center justify-center text-slate-300 border border-dashed border-slate-200 rounded-3xl opacity-50">
                            <Clock className="w-8 h-8 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest italic">No clinical history records</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50 flex gap-4 relative">
                    {showFollowUpPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-0 right-0 mb-4 bento-card-dark p-6 z-50 shadow-2xl"
                      >
                         <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 italic">Specify Follow-up Matrix</h4>
                         <input 
                            type="date"
                            value={followUpDate}
                            onChange={e => setFollowUpDate(e.target.value)}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold focus:bg-white/10 outline-none transition-all mb-4"
                         />
                         <div className="flex gap-2">
                           <button 
                            onClick={() => setShowFollowUpPicker(false)}
                            className="flex-1 py-3 border border-white/10 text-white/40 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white/5"
                           >
                            Cancel
                           </button>
                           <button 
                            onClick={() => concludeVisit(true)}
                            className="flex-[2] py-3 bg-brand-blue text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-brand-blue/90"
                           >
                            Confirm Visit Log
                           </button>
                         </div>
                      </motion.div>
                    )}
                    <button 
                      onClick={() => setShowFollowUpPicker(!showFollowUpPicker)}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                    >
                      <Plus className="w-4 h-4" />
                      Set Follow-up
                    </button>
                    <button 
                      onClick={() => concludeVisit(false)}
                      className="flex-[2] py-4 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Authorize & Finalize
                    </button>
                  </div>
                </div>
              </div>

              {/* Side Panels */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full">
                 <div className="bento-card-dark p-6 bg-brand-dark flex flex-col h-1/2">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">Patient Biometrics</h3>
                    <div className="space-y-4">
                       <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic text-right">Age Sector</p>
                          <p className="text-xl font-black text-white italic tracking-tighter">{2024 - new Date(selectedVisitData.patient.dob).getFullYear()} Years <span className="text-slate-700 font-normal">Old</span></p>
                       </div>
                       <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic text-right">Registry Date</p>
                          <p className="text-xs font-black text-slate-400 italic tracking-widest uppercase">{format(new Date(selectedVisitData.patient.createdAt), 'MMM d, yyyy')}</p>
                       </div>
                       <div className="p-4 bg-brand-blue/10 border border-brand-blue/20 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="text-[8px] font-black text-brand-blue uppercase tracking-widest mb-1 italic">Identity Status</p>
                            <p className="text-sm font-black text-white italic uppercase tracking-widest">VERIFIED</p>
                          </div>
                          <Shield className="w-8 h-8 text-brand-blue/40" />
                       </div>
                    </div>
                 </div>
                 <div className="bento-card-dark flex-1 p-6 relative overflow-hidden group border-slate-800">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl" />
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 animate-pulse">Critical Alerts // Block 102</h3>
                    <div className="flex flex-col items-center justify-center h-48 opacity-20 group-hover:opacity-40 transition-opacity">
                       <Activity className="w-12 h-12 text-white mb-4" />
                       <p className="text-[10px] font-black text-white uppercase tracking-widest italic text-center">No anomalies<br/>detected in current<br/>session stream</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
