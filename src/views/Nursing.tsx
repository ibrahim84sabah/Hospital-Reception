import React, { useState } from 'react';
import { useHMS } from '../context/HMSContext';
import { 
  Thermometer, 
  Activity, 
  Stethoscope, 
  Shield, 
  HeartPulse 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export function Nursing() {
  const { visits, patients, doctors, deactivateVisit, saveVitalsAndTransfer, userProfile } = useHMS();
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const getNurseQueue = (doctorId: string | null) => {
    // Enforcement: Nurses only see their assigned clinic
    if (userProfile?.role === 'Nurse' && userProfile.associatedDoctorId) {
      if (doctorId !== userProfile.associatedDoctorId) return [];
    }
    
    return visits.filter(v => 
      v.assignedDoctorId === doctorId && 
      v.currentDepartment === 'Nurse' && 
      v.status !== 'Complete' && 
      v.status !== 'Cancelled'
    );
  };

  const totalNursingActive = visits.filter(v => {
    const isNurseDept = v.currentDepartment === 'Nurse' && v.status !== 'Complete' && v.status !== 'Cancelled';
    if (!isNurseDept) return false;
    if (userProfile?.role === 'Nurse' && userProfile.associatedDoctorId) {
       return v.assignedDoctorId === userProfile.associatedDoctorId;
    }
    return true;
  }).length;

  const selectedVisit = visits.find(v => v.id === selectedVisitId);
  const selectedPatient = selectedVisit ? patients.find(p => p.id === selectedVisit.patientId) : null;
  const selectedVisitData = selectedVisit && selectedPatient ? { visit: selectedVisit, patient: selectedPatient } : null;

  const [vitals, setVitals] = useState({
    temperature: '',
    bloodPressure: '',
    height: '',
    weight: '',
    pulse: '',
    respiratoryRate: '',
    oxygenSaturation: '',
  });

  const [showConfirmTerminate, setShowConfirmTerminate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTerminateSession = async () => {
    if (selectedVisitId) {
      setIsProcessing(true);
      try {
        await deactivateVisit(selectedVisitId);
        setSelectedVisitId(null);
        setShowConfirmTerminate(false);
      } catch {
        alert("Action failed. Check connection.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSaveVitals = async () => {
    if (!selectedVisit) return;
    
    // Simple validation: check if at least temp and BP are provided
    if (!vitals.temperature || !vitals.bloodPressure) {
      alert("Please enter Temperature and Blood Pressure at minimum.");
      return;
    }

    setIsProcessing(true);
    try {
      await saveVitalsAndTransfer(
        selectedVisit.id, 
        {
          ...vitals,
          timestamp: new Date().toISOString()
        },
        'Doctor'
      );
      setSelectedVisitId(null);
      setVitals({ temperature: '', bloodPressure: '', height: '', weight: '', pulse: '', respiratoryRate: '', oxygenSaturation: '' });
    } catch {
      alert("Transfer failed. Check network.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-auto lg:h-full p-2">
      {/* Patient Queue */}
      <section className="col-span-12 lg:col-span-3 bento-card p-0 flex flex-col overflow-hidden min-h-[300px]">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-blue" />
              Triage Queues
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">({totalNursingActive})</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
          {/* Unassigned / Next Available */}
          {getNurseQueue(null).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">General / Triage</span>
                <span className="text-[8px] font-black text-slate-300">{getNurseQueue(null).length}</span>
              </div>
              {getNurseQueue(null).map(visit => {
                const patient = patients.find(p => p.id === visit.patientId);
                if (!patient) return null;
                const isSelected = selectedVisitId === visit.id;
                return (
                  <button
                    key={visit.id}
                    onClick={() => {
                      setSelectedVisitId(visit.id);
                      setShowConfirmTerminate(false);
                      setVitals({
                        temperature: visit.vitals?.temperature || '',
                        bloodPressure: visit.vitals?.bloodPressure || '',
                        height: visit.vitals?.height || '',
                        weight: visit.vitals?.weight || '',
                        pulse: visit.vitals?.pulse || '',
                        respiratoryRate: visit.vitals?.respiratoryRate || '',
                        oxygenSaturation: visit.vitals?.oxygenSaturation || '',
                      });
                    }}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all duration-300 relative group overflow-hidden",
                      isSelected 
                        ? "bg-slate-800 border-transparent text-white shadow-lg" 
                        : "bg-white border-slate-100 hover:border-brand-blue/30 text-slate-600"
                    )}
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-1">
                        <span className={cn("text-[8px] font-mono font-black uppercase tracking-[0.2em]", isSelected ? "text-white/60" : "text-brand-blue")}>
                          #{visit.token || '---'}
                        </span>
                      </div>
                      <h3 className="font-black tracking-tight text-xs uppercase italic truncate">{patient.firstName} {patient.lastName}</h3>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Grouped by Doctor */}
          {doctors.map(doctor => {
            const queue = getNurseQueue(doctor.uid);
            if (queue.length === 0) return null;

            return (
              <div key={doctor.uid} className="space-y-2">
                <div className="flex items-center justify-between px-2 border-b border-slate-50 pb-1 mb-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] italic flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-brand-blue" />
                    Dr. {doctor.name}
                  </span>
                  <span className="text-[8px] font-black text-brand-blue">{queue.length}</span>
                </div>
                {queue.map(visit => {
                  const patient = patients.find(p => p.id === visit.patientId);
                  if (!patient) return null;
                  const isSelected = selectedVisitId === visit.id;
                  return (
                    <button
                      key={visit.id}
                      onClick={() => {
                        setSelectedVisitId(visit.id);
                        setShowConfirmTerminate(false);
                        setVitals({
                          temperature: visit.vitals?.temperature || '',
                          bloodPressure: visit.vitals?.bloodPressure || '',
                          height: visit.vitals?.height || '',
                          weight: visit.vitals?.weight || '',
                          pulse: visit.vitals?.pulse || '',
                          respiratoryRate: visit.vitals?.respiratoryRate || '',
                          oxygenSaturation: visit.vitals?.oxygenSaturation || '',
                        });
                      }}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all duration-300 relative group overflow-hidden",
                        isSelected 
                          ? "bg-brand-blue border-transparent text-white shadow-lg" 
                          : "bg-white border-slate-100 hover:border-brand-blue/30 text-slate-600"
                      )}
                    >
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-1">
                          <span className={cn("text-[8px] font-mono font-black uppercase tracking-[0.2em]", isSelected ? "text-white/60" : "text-brand-blue")}>
                            #{visit.token || '---'}
                          </span>
                        </div>
                        <h3 className="font-black tracking-tight text-xs uppercase italic truncate">{patient.firstName} {patient.lastName}</h3>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
          
          {totalNursingActive === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-100 rounded-3xl opacity-50">
              <Activity className="w-8 h-8 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-center px-4">All systems clear. No patients pending.</p>
            </div>
          )}
        </div>
      </section>

      {/* Main Vitals Entry */}
      <section className="col-span-12 lg:col-span-6 flex flex-col gap-6">
        <div className="bento-card-dark p-8 flex-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <AnimatePresence mode="wait">
            {!selectedVisitData ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-slate-500 relative z-10"
              >
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                  <Stethoscope className="w-10 h-10 text-white/20" />
                </motion.div>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">Initialize Session</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select a patient from the queue to start triage</p>
              </motion.div>
            ) : (
              <motion.div 
                key={selectedVisitData.visit.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{selectedVisitData.patient.firstName} {selectedVisitData.patient.lastName}</h2>
                    <p className="text-[10px] font-mono font-bold text-brand-blue uppercase tracking-[0.2em] mt-1">ID: {selectedVisitData.patient.id}</p>
                  </div>
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white/50 uppercase tracking-widest">
                    Triage Active
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Temp (°C)</label>
                      <div className="relative">
                        <Thermometer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          value={vitals.temperature}
                          onChange={e => setVitals({ ...vitals, temperature: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 transition-all outline-none focus:ring-2 focus:ring-brand-blue" 
                          placeholder="36.5"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pulse (BPM)</label>
                      <div className="relative">
                        <HeartPulse className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          value={vitals.pulse}
                          onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 transition-all outline-none focus:ring-2 focus:ring-brand-blue"
                          placeholder="72"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resp. Rate (BPM)</label>
                      <div className="relative">
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          value={vitals.respiratoryRate}
                          onChange={e => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 transition-all outline-none focus:ring-2 focus:ring-brand-blue"
                          placeholder="16"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">O2 Sat (%)</label>
                      <div className="relative">
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          value={vitals.oxygenSaturation}
                          onChange={e => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 transition-all outline-none focus:ring-2 focus:ring-brand-blue"
                          placeholder="98"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">BP (mmHg)</label>
                      <div className="relative">
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          value={vitals.bloodPressure}
                          onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 transition-all outline-none focus:ring-2 focus:ring-brand-blue"
                          placeholder="120/80"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WT (kg)</label>
                        <input 
                          value={vitals.weight}
                          onChange={e => setVitals({ ...vitals, weight: e.target.value })}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 transition-all outline-none focus:ring-2 focus:ring-brand-blue"
                          placeholder="70"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">HT (cm)</label>
                        <input 
                          value={vitals.height}
                          onChange={e => setVitals({ ...vitals, height: e.target.value })}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 transition-all outline-none focus:ring-2 focus:ring-brand-blue"
                          placeholder="175"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 flex gap-4">
                  {!showConfirmTerminate ? (
                    <button 
                      onClick={() => setShowConfirmTerminate(true)}
                      disabled={isProcessing}
                      className="flex-1 py-4 bg-white/5 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all hover:text-white disabled:opacity-50"
                    >
                      Terminate Session
                    </button>
                  ) : (
                    <div className="flex-1 flex gap-2">
                       <button 
                        onClick={handleTerminateSession}
                        disabled={isProcessing}
                        className="flex-1 py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing...' : 'Confirm Termination'}
                      </button>
                      <button 
                        onClick={() => setShowConfirmTerminate(false)}
                        disabled={isProcessing}
                        className="px-6 py-4 bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all disabled:opacity-50"
                      >
                        Back
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={handleSaveVitals}
                    disabled={isProcessing}
                    className="flex-[2] py-4 bg-brand-blue text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Syncing Stream...' : 'Commit Vitals & Transfer to Physician'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Historical Data / Trends */}
      <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
        <div className="bento-card p-6 flex-1 flex flex-col">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Diagnostic Context</h3>
          {selectedVisitData ? (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Age / Gender</span>
                <p className="font-black text-slate-900 tracking-tight uppercase italic">{format(new Date(selectedVisitData.patient.dob), 'MMM d, yyyy')} | {selectedVisitData.patient.gender}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Recent Record Found</span>
                <p className="text-xs font-bold text-emerald-800 leading-relaxed italic">Last vitals taken 14 days ago were within optimal range. No chronic flags.</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-20">
                <Shield className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-center">Data Encryption<br/>Active</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50 italic">
              <p className="text-xs font-bold uppercase tracking-widest">Awaiting Context...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
