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
import { Admin } from './views/Admin';
import { 
  LayoutGrid,
  Shield,
  User,
  Lock,
  ArrowRight,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';
import { UserRole } from './types';

function AppContent() {
  const { 
    activeDepartment, 
    currentUser, 
    userProfile,
    isAuthReady, 
    systemHasUsers,
    showDashboard, 
    setShowDashboard, 
    login,
    registerNewUser,
    logout,
    provisionUserProfile
  } = useHMS();

  const [id, setId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [adminName, setAdminName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Profile Provisioning State
  const [provisionName, setProvisionName] = React.useState('');
  const [provisionRole, setProvisionRole] = React.useState<UserRole>('Doctor');
  const [isProvisioning, setIsProvisioning] = React.useState(false);
  const [provisionError, setProvisionError] = React.useState<string | null>(null);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionName.trim()) return;
    setIsProvisioning(true);
    setProvisionError(null);
    try {
      await provisionUserProfile(provisionName, provisionRole);
    } catch (error: unknown) {
      const err = error as { message?: string };
      let message = err.message || 'Provisioning failed.';
      try {
        const parsed = JSON.parse(message);
        message = parsed.error || message;
      } catch { /* not json */ }
      setProvisionError(message);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthError(null);
      setIsSubmitting(true);
      await login(id, password);
    } catch (error: unknown) {
      const err = error as { message?: string };
      let message = err.message || 'Authentication failed.';
      try { 
        const parsed = JSON.parse(message);
        message = parsed.error || message;
      } catch { /* not json */ }

      if (message.includes('auth/operation-not-allowed')) {
        setAuthError(`ERROR: "Email/Password" login is DISABLED in Firebase. Please enable it in Firebase Console > Authentication > Sign-in method (Project ID: gen-lang-client-0022848386).`);
      } else if (message.includes('auth/invalid-credential')) {
        setAuthError('Invalid Staff ID or Password.');
      } else {
        setAuthError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthError(null);
      setIsSubmitting(true);
      await registerNewUser(id, password, adminName, 'Admin');
    } catch (error: unknown) {
      const err = error as { message?: string };
      let message = err.message || 'Setup failed.';
      try { 
        const parsed = JSON.parse(message);
        message = parsed.error || message;
      } catch { /* not json */ }

      if (message.includes('auth/operation-not-allowed')) {
        setAuthError(`CRITICAL: "Email/Password" provider is DISABLED. You MUST enable it in Firebase Console > Authentication > Sign-in method to continue (Project ID: gen-lang-client-0022848386).`);
      } else {
        setAuthError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <p className="text-slate-500 font-mono text-[10px] mt-1">v1.1.0 // ACCESS_PROTOCOL_SECURE</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-dark overflow-hidden relative p-4">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        
        <div className="z-10 w-full max-w-md">
          {/* Header/Brand */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-brand-blue rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-brand-blue/50 transform -rotate-3">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">CareSync <span className="text-brand-blue italic">X</span></h1>
            <p className="text-slate-400 font-medium text-xs tracking-widest uppercase italic">Secure Node Access Terminal</p>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-10">
            {systemHasUsers ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="text-center mb-6">
                   <h2 className="text-white font-black text-lg uppercase tracking-tight">System Login</h2>
                   <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Encrypted Node Authentication</p>
                </div>

                <div className="space-y-4">
                   <div className="relative">
                      <input 
                        required
                        type="text"
                        value={id}
                        onChange={e => setId(e.target.value)}
                        placeholder="STAFF ID"
                        className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 font-bold focus:ring-2 focus:ring-brand-blue transition-all"
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                   </div>

                   <div className="relative">
                      <input 
                        required
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="PASS KEY"
                        className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 font-bold focus:ring-2 focus:ring-brand-blue transition-all"
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                   </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-blue/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? 'Verifying...' : (
                    <>
                      Access Node
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSetupAdmin} className="space-y-6">
                <div className="text-center mb-6">
                   <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3">
                      <p className="text-amber-500 text-[9px] font-black uppercase tracking-widest">Master Node Setup</p>
                   </div>
                   <h2 className="text-white font-black text-lg uppercase tracking-tight">Initialize System</h2>
                   <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Create First Admin Account</p>
                </div>

                <div className="space-y-4">
                   <div className="relative">
                      <input 
                        required
                        type="text"
                        value={adminName}
                        onChange={e => setAdminName(e.target.value)}
                        placeholder="FULL NAME"
                        className="w-full pl-6 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 font-bold focus:ring-2 focus:ring-brand-blue transition-all"
                      />
                   </div>
                   <div className="relative">
                      <input 
                        required
                        type="text"
                        value={id}
                        onChange={e => setId(e.target.value)}
                        placeholder="ADMIN ID (e.g. MASTER-1)"
                        className="w-full pl-6 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 font-bold focus:ring-2 focus:ring-brand-blue transition-all"
                      />
                   </div>
                   <div className="relative">
                      <input 
                        required
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="SECURE PASSWORD"
                        className="w-full pl-6 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 font-bold focus:ring-2 focus:ring-brand-blue transition-all"
                      />
                   </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isSubmitting ? 'Initializing...' : 'Initialize Master Node'}
                </button>
              </form>
            )}

            {authError && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1 italic">Auth Exception</p>
                <p className="text-[11px] text-red-200 font-mono break-all">{authError}</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-[9px] text-white/30 uppercase tracking-widest font-bold">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> PROTOCOL_V4</span>
            <span className="w-1 h-1 rounded-full bg-white/10"></span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span> AES_AUTH</span>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser && !userProfile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-dark px-4 py-10 overflow-y-auto">
        <div className="flex flex-col items-center gap-6 max-w-md w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-10"
          >
            {isAuthReady ? (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl mx-auto flex items-center justify-center text-red-500">
                  <Shield className="w-8 h-8" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-white font-black text-xl uppercase tracking-tight">Clinical Identity Missing</h2>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed uppercase tracking-widest px-4">
                    Authenticated session detected, but your Clinical Profile is not in the registry. Complete enrollment to proceed.
                  </p>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                   <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-tighter">
                      <span className="text-slate-500">Authentication ID</span>
                      <span className="text-slate-300">{currentUser.uid.substring(0, 12)}...</span>
                   </div>
                   <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-tighter">
                      <span className="text-slate-500">Node Reachability</span>
                      <span className="text-green-500">Protocol Secure</span>
                   </div>
                </div>

                <form onSubmit={handleProvision} className="space-y-4 pt-4 border-t border-white/10">
                  <div className="text-left space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Staff Legal Name</label>
                    <input 
                      type="text"
                      required
                      value={provisionName}
                      onChange={(e) => setProvisionName(e.target.value)}
                      placeholder="ENTER FULL NAME"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-medium focus:ring-1 focus:ring-brand-blue outline-none transition-all placeholder:text-white/10"
                    />
                  </div>
                  <div className="text-left space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Assigned Unit</label>
                    <select 
                      value={provisionRole}
                      onChange={(e) => setProvisionRole(e.target.value as UserRole)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-medium focus:ring-1 focus:ring-brand-blue outline-none transition-all appearance-none"
                    >
                      <option value="Doctor">Clinical Physician (Doctor)</option>
                      <option value="Nurse">Nursing Staff (Nurse)</option>
                      <option value="Staff">Administrative & Support (Staff)</option>
                      <option value="Admin">System Administrator (Admin)</option>
                    </select>
                  </div>

                  {provisionError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-500 text-center font-mono uppercase leading-tight">
                      Enrollment Failure: {provisionError}
                    </div>
                  )}

                  <button 
                    disabled={isProvisioning || !provisionName}
                    type="submit"
                    className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
                  >
                    {isProvisioning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Finalize Clinical Identity
                  </button>
                </form>
                
                <button 
                  onClick={() => logout()}
                  className="w-full py-3 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  Terminate Incomplete Session
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                <div className="space-y-2">
                   <p className="text-white font-black text-xs uppercase tracking-widest italic animate-pulse">Syncing Security Profile...</p>
                   <p className="text-slate-500 font-mono text-[9px] uppercase">Node Handshake in Progress</p>
                </div>
              </div>
            )}
          </motion.div>
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
      case 'Admin': return <Admin />;
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
              <div className="flex items-center gap-4 text-brand-blue font-bold text-xs uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-white">وحدة {activeDepartment === 'Doctor' ? 'الطبيب' : activeDepartment}</span>
                  <span className="text-[8px] opacity-60">{activeDepartment} UNIT</span>
                </div>
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
                {userProfile.role} MODE
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800"></div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end leading-none">
                <span className="text-white text-xs font-bold tracking-tight italic">{userProfile.name}</span>
                <span className="text-[8px] text-slate-500 font-mono tracking-[0.2em] font-black uppercase mt-0.5">ID: {userProfile.employeeId}</span>
              </div>
              <button 
                onClick={() => logout()}
                className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden flex items-center justify-center transition-all hover:scale-110 hover:border-red-500/50 group"
              >
                <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-500 transition-colors" />
              </button>
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
