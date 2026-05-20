import React, { useState } from 'react';
import { useHMS } from '../context/HMSContext';
import { Patient, Visit } from '../types';
import { UserPlus, Search, Calendar, Phone, Users, Shield, SearchIcon, ChevronRight, Stethoscope, Activity, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Reception() {
  const { registerPatient, createVisit, patients, visits, doctors, updateVisitStatus, deactivateVisit } = useHMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: 'Male' as const,
    mobile: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = await registerPatient(formData);
    await createVisit(patient.id, selectedDoctorId || undefined);
    setFormData({ firstName: '', middleName: '', lastName: '', dob: '', gender: 'Male', mobile: '' });
    setSelectedDoctorId('');
  };

  const filteredPatients = searchQuery.length > 2 
    ? patients.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mobile.includes(searchQuery)
      )
    : patients.slice(-10);

  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const handlePatientClick = (patient: Patient, activeVisit: Visit | undefined) => {
    if (activeVisit) {
      if (selectedPatientId === patient.id) {
        if (confirmCancelId === patient.id) {
          deactivateVisit(activeVisit.id).then(() => {
            setConfirmCancelId(null);
            setSelectedPatientId(null);
          });
        } else {
          setConfirmCancelId(patient.id);
        }
      } else {
        setSelectedPatientId(patient.id);
        setConfirmCancelId(null);
      }
    } else {
      // Just select the patient to show "Start Visit" UI
      setSelectedPatientId(patient.id === selectedPatientId ? null : patient.id);
      setConfirmCancelId(null);
    }
  };

  const handleStartExistingVisit = async (patientId: string) => {
    try {
      await createVisit(patientId, selectedDoctorId || undefined);
      // Reset selected doctor after creation
      setSelectedDoctorId('');
      setSelectedPatientId(null);
    } catch (err) {
      console.error("Failed to create visit:", err);
    }
  };

  const activeVisits = visits.filter(v => v.status !== 'Complete' && v.status !== 'Cancelled');
  const activeReceptionVisits = activeVisits.filter(v => v.currentDepartment === 'Reception');

  const PatientQueueCard = ({ visit, patient }: { visit: Visit, patient: Patient, key?: React.Key }) => (
    <motion.div 
      layout
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative group"
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest">{visit.token}</span>
        <div className="flex gap-1">
          <button 
            onClick={() => updateVisitStatus(visit.id, 'Waiting', 'Nurse')}
            title="Forward to Nursing"
            className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-blue hover:border-brand-blue transition-all"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => updateVisitStatus(visit.id, 'Waiting', 'Doctor')}
            title="Forward to Doctor"
            className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-blue hover:border-brand-blue transition-all"
          >
            <Stethoscope className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={async () => {
              if (window.confirm(`إزالة ${patient.firstName} من قائمة الانتظار؟`)) {
                await deactivateVisit(visit.id);
              }
            }}
            title="Remove from Queue"
            className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-500 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <h4 className="text-[10px] font-black uppercase tracking-tight truncate">{patient.firstName} {patient.lastName}</h4>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Logged: Just Now</p>
        {visit.assignedDoctorId && (
          <span className="text-[8px] font-black text-brand-blue uppercase tracking-widest italic flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-brand-blue animate-pulse" />
            Dr. {doctors.find(d => d.uid === visit.assignedDoctorId)?.name || 'Ahmed'}
          </span>
        )}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-blue rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );

  return (
    <div className="grid grid-cols-12 gap-6 h-auto lg:h-full p-2">
      {/* Search & Database Queue */}
      <section className="col-span-12 lg:col-span-3 bento-card p-0 flex flex-col overflow-hidden h-[450px] lg:h-full">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
              Patient Registry
            </h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest leading-none">Global_Index_Live</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
             <SearchIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="px-4 pt-4">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 group-focus-within:text-brand-blue" />
              <input 
                placeholder="Search Database..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 mt-2">
           {filteredPatients.slice().reverse().map(patient => {
              const activeVisit = activeVisits.find(v => v.patientId === patient.id);
              return (
                <div
                  key={patient.id}
                  onClick={() => handlePatientClick(patient, activeVisit)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handlePatientClick(patient, activeVisit);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "w-full p-4 rounded-2xl border text-left transition-all duration-300 group cursor-pointer relative",
                    selectedPatientId === patient.id 
                      ? "border-brand-blue bg-blue-50/30 ring-1 ring-brand-blue/20" 
                      : "border-slate-100 bg-white hover:border-brand-blue/30 hover:shadow-lg"
                  )}
                >
                  {confirmCancelId === patient.id && (
                    <div className="absolute inset-0 bg-red-600/95 z-10 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-white text-[10px] font-black uppercase tracking-widest mb-2">إلغاء الزيارة؟</p>
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientClick(patient, activeVisit);
                          }}
                          className="flex-1 bg-white text-red-600 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest"
                        >
                          نعم، اغل
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmCancelId(null);
                          }}
                          className="flex-1 bg-black/20 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-black/30"
                        >
                          تراجع
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-mono font-black text-brand-blue uppercase tracking-[0.2em]">{patient.id}</span>
                    {activeVisit && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase tracking-widest animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="font-black tracking-tight text-sm uppercase italic truncate">{patient.firstName} {patient.lastName}</h3>
                  <div className="mt-2 text-[9px] font-bold uppercase tracking-widest flex items-center justify-between text-slate-400">
                    <span>{patient.gender} • {2024 - new Date(patient.dob).getFullYear()}Y</span>
                    <ChevronRight className={cn("w-3 h-3 text-brand-blue transition-transform", selectedPatientId === patient.id && "rotate-90")} />
                  </div>

                  <AnimatePresence>
                    {selectedPatientId === patient.id && !activeVisit && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Assign Doctor / اختيار الطبيب</label>
                            <select 
                              value={selectedDoctorId}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedDoctorId(e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-brand-blue"
                            >
                              <option value="">Next Available / أي طبيب</option>
                              {doctors.map(d => (
                                <option key={d.uid} value={d.uid}>Dr. {d.name}</option>
                              ))}
                            </select>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartExistingVisit(patient.id);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-dark text-white rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Start New Visit</span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {selectedPatientId === patient.id && activeVisit && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic text-center">Forward To Department</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateVisitStatus(activeVisit.id, 'Waiting', 'Nurse');
                                setSelectedPatientId(null);
                              }}
                              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                            >
                              <Activity className="w-4 h-4" />
                              <span className="text-[8px] font-black uppercase tracking-tighter">Nursing</span>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateVisitStatus(activeVisit.id, 'Waiting', 'Doctor');
                                setSelectedPatientId(null);
                              }}
                              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90 transition-colors"
                            >
                              <Stethoscope className="w-4 h-4" />
                              <span className="text-[8px] font-black uppercase tracking-tighter">Doctor</span>
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`هل أنت متأكد من إزالة ${patient.firstName} ${patient.lastName} من قائمة الانتظار؟`)) {
                                  await deactivateVisit(activeVisit.id);
                                  setSelectedPatientId(null);
                                }
                              }}
                              className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors mt-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Remove From Queue</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
           })}
           {filteredPatients.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-100 rounded-3xl opacity-50">
                <Users className="w-8 h-8 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest italic opacity-40">No hits found</p>
              </div>
           )}
        </div>
      </section>

      {/* Registration Workbench */}
      <section className="col-span-12 lg:col-span-6 flex flex-col gap-6">
         <div className="bento-card p-8 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-10">
              <div>
                 <span className="px-2 py-1 bg-blue-50 text-brand-blue text-[10px] font-black rounded uppercase tracking-widest">Master Registry</span>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">Patient Intake</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Initialize encrypted medical record node</p>
              </div>
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                 <UserPlus className="w-6 h-6 text-white" />
              </div>
            </div>

            <form onSubmit={handleRegister} className="grid grid-cols-2 gap-6 flex-1">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">First Identity</label>
                  <input 
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    placeholder="First Name"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Last Identity</label>
                  <input 
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    placeholder="Last Name"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Temporal Node (DOB)</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      required
                      type="date"
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Biological Sex</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all appearance-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
               </div>
               <div className="col-span-2 space-y-2 mt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Communication Link (Mobile)</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      required
                      type="tel"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                      placeholder="+1 (000) 000-0000"
                    />
                  </div>
               </div>

               <div className="col-span-2 space-y-2 mt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Assign Doctor // الطبيب المطلوب</label>
                  <select 
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Next Available / الطبيب التالي</option>
                    {doctors.map(doc => (
                      <option key={doc.uid} value={doc.uid}>
                        Dr. {doc.name}
                      </option>
                    ))}
                  </select>
               </div>

               <div className="col-span-2 mt-auto pt-8">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-brand-dark text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4"
                  >
                    Sync Master Record & Open Visit
                  </button>
               </div>
            </form>
         </div>
      </section>

      {/* Analytics & Feed */}
      <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
         <div className="bento-card-dark p-6 bg-brand-dark flex flex-col h-1/2 justify-between">
            <div>
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 italic">Registry Status</h3>
              <div className="space-y-4">
                 <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic text-right">Population</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{patients.length} <span className="text-slate-700 font-normal">Identities</span></p>
                 </div>
                 <div className="p-4 bg-brand-blue/10 border border-brand-blue/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-brand-blue uppercase tracking-widest mb-1 italic">Central Sync</p>
                      <p className="text-sm font-black text-white italic uppercase tracking-widest">ACTIVE</p>
                    </div>
                    <Shield className="w-8 h-8 text-brand-blue/40" />
                 </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-500/50 uppercase tracking-widest mt-6">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Live Data Feed Ready
            </div>
         </div>

         <div className="bento-card flex-1 p-6 relative overflow-hidden flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Live Desk Queue</h3>
              <div className="px-2 py-1 bg-brand-blue/10 text-brand-blue text-[8px] font-black rounded uppercase tracking-widest">
                {activeReceptionVisits.length} Pending
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
              {/* Unassigned / Next Available */}
              {(activeReceptionVisits.filter(v => !v.assignedDoctorId).length > 0) && (
                <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                   <div className="flex items-center justify-between px-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Next Available / عام</span>
                     <span className="px-2 py-0.5 bg-slate-50 text-[9px] font-black text-slate-400 rounded-full">{activeReceptionVisits.filter(v => !v.assignedDoctorId).length}</span>
                   </div>
                   <div className="space-y-3">
                     {activeReceptionVisits.filter(v => !v.assignedDoctorId).map(visit => {
                       const patient = patients.find(p => p.id === visit.patientId);
                       if (!patient) return null;
                       return (
                         <PatientQueueCard key={visit.id} visit={visit} patient={patient} />
                       );
                     })}
                   </div>
                </div>
              )}

              {/* Grouped by Doctor */}
              {doctors.map(doctor => {
                const doctorQueue = activeReceptionVisits.filter(v => v.assignedDoctorId === doctor.uid);
                if (doctorQueue.length === 0) return null;

                return (
                  <div key={doctor.uid} className="p-4 bg-white border border-brand-blue/10 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest italic">Dr. {doctor.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-brand-blue/5 text-[9px] font-black text-brand-blue rounded-full">{doctorQueue.length}</span>
                    </div>
                    <div className="space-y-3">
                      {doctorQueue.map(visit => {
                        const patient = patients.find(p => p.id === visit.patientId);
                        if (!patient) return null;
                        return (
                          <PatientQueueCard key={visit.id} visit={visit} patient={patient} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {activeReceptionVisits.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40 py-10">
                   <ArrowRight className="w-8 h-8 mb-4 rotate-45" />
                   <p className="text-[9px] font-black uppercase tracking-widest italic">Clear Desk</p>
                </div>
              )}
            </div>
         </div>
      </section>
    </div>
  );
}
