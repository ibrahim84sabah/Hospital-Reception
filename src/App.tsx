/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HMSProvider, useHMS } from './context/HMSContext';
import { Sidebar } from './components/Sidebar';
import { Reception } from './views/Reception';
import { Nursing } from './views/Nursing';
import { Doctor } from './views/Doctor';
import { LabRadiology } from './views/LabRadiology';
import { Pharmacy } from './views/Pharmacy';
import { Dashboard } from './views/Dashboard';
import { OperationalLogs } from './views/OperationalLogs';
import { 
  LayoutGrid,
  Stethoscope
} from 'lucide-react';
import { signInWithGoogle } from './lib/firebase';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';

function AppContent() {
  const { activeDepartment, currentUser, isAuthReady, showDashboard, setShowDashboard } = useHMS();

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-dark">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-brand-blue/20 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white font-black text-xl tracking-tighter uppercase italic">Initializing Operational AI</p>
            <p className="text-slate-500 font-mono text-[10px] mt-1">v1.0.4-integrated // LIMS_READY</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-dark overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="z-10 w-full max-w-sm p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl text-center">
          <div className="w-20 h-20 bg-brand-blue rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-brand-blue/50 transform -rotate-3">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">CareSync <span className="text-brand-blue italic">X</span></h1>
          <p className="text-slate-400 mb-8 font-medium text-sm tracking-wide uppercase">Hospital Operations OS</p>
          
          <button 
            onClick={() => signInWithGoogle()}
            className="w-full flex items-center justify-center gap-3 bg-white text-brand-dark py-4 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95 shadow-xl hover:shadow-brand-blue/20"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="google" />
            SIGN IN TO NODE
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-4 text-[9px] text-white/30 uppercase tracking-widest font-bold">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> SECURE</span>
            <span className="w-1 h-1 rounded-full bg-white/10"></span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span> ENCRYPTED</span>
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (showDashboard) return <Dashboard />;
    
    switch (activeDepartment) {
      case 'Reception': return <Reception />;
      case 'Nurse': return <Nursing />;
      case 'Doctor': return <Doctor />;
      case 'Lab': 
      case 'Radiology': return <LabRadiology />;
      case 'Pharmacy': return <Pharmacy />;
      case 'Logs': return <OperationalLogs />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg font-sans text-slate-900 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-brand-dark flex items-center justify-between px-8 shrink-0 z-10 shadow-lg">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowDashboard(true)}
              className={cn(
                "flex items-center gap-2 group transition-all",
                showDashboard ? "opacity-100" : "opacity-60 hover:opacity-100"
              )}
            >
              <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center shadow-lg shadow-brand-blue/30 group-hover:rotate-6 transition-transform">
                <LayoutGrid className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-white font-black text-xl tracking-tighter">
                HOSPITAL.AI <span className="text-brand-blue font-normal font-mono text-[10px] tracking-normal ml-1">OPERATIONS ENGINE</span>
              </h1>
            </button>
            
            <div className="w-px h-6 bg-slate-800" />
            
            {!showDashboard ? (
              <div className="flex items-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                {activeDepartment} UNIT
              </div>
            ) : (
              <button 
                onClick={() => setShowDashboard(false)}
                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
              >
                Return to Active Unit
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex gap-6 text-[9px] font-mono font-bold tracking-widest">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="system-status-dot bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                SYSTEM ACTIVE
              </div>
              <div className="flex items-center gap-2 text-brand-blue">
                <span className="system-status-dot bg-brand-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                LIMS CONNECTED
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800"></div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end leading-none">
                <span className="text-white text-xs font-bold tracking-tight italic">{currentUser.displayName || 'Staff Node'}</span>
                <span className="text-[8px] text-slate-500 font-mono tracking-[0.2em] font-black uppercase mt-0.5">ID: {currentUser.uid.substring(0, 8)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden flex items-center justify-center transition-transform hover:scale-110">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="avatar" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-sm font-black text-brand-blue">{currentUser.displayName?.[0] || currentUser.email?.[0]}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={showDashboard ? 'dashboard' : activeDepartment}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="h-8 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[9px] font-black text-slate-400 shrink-0 uppercase tracking-[0.2em]">
          <div className="flex gap-8">
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              NODE: US-EAST-HMIS-01
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              PING: 14MS
            </span>
          </div>
          <div className="flex items-center gap-2 italic">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            PATIENT_DATA_STREAM_ENC_AES256
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HMSProvider>
      <AppContent />
    </HMSProvider>
  );
}
