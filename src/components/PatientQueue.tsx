import React from 'react';
import { useHMS } from '../context/HMSContext';
import { Visit, Patient } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PatientQueueProps {
  filterByDept?: boolean;
  onSelect?: (visit: Visit, patient: Patient) => void;
  title?: string;
}

export function PatientQueue({ filterByDept = true, onSelect, title = "Current Queue" }: PatientQueueProps) {
  const { visits, patients, activeDepartment } = useHMS();

  const filteredVisits = visits.filter(v => 
    (!filterByDept || v.currentDepartment === activeDepartment) && 
    v.status !== 'Complete' && v.status !== 'Cancelled'
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          {title}
        </h3>
        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          {filteredVisits.length} Waiting
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredVisits.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center text-slate-400 italic text-sm"
            >
              No patients in current queue
            </motion.div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredVisits.map((visit) => {
                const patient = patients.find(p => p.id === visit.patientId);
                if (!patient) return null;

                return (
                  <motion.div
                    layout
                    key={visit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => onSelect?.(visit, patient)}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-blue-600">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono text-slate-400">{patient.id}</span>
                            <span>•</span>
                            <span>{format(new Date(patient.dob), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {visit.token}
                        </span>
                        <div className="flex items-center gap-1">
                          {!visit.isPaid && (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" title="Payment Pending" />
                          )}
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm",
                            visit.status === 'Waiting' ? "bg-amber-100 text-amber-700" :
                            visit.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {visit.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
