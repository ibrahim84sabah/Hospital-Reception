import React, { useState } from 'react';
import { useHMS } from '../context/HMSContext';
import { UserRole } from '../types';
import { Plus, Users, Shield, UserCog, Key } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

export function Admin() {
  const { registerNewUser, userProfile } = useHMS();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'settings'>('users');
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Staff');
  const [isRegistering, setIsRegistering] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setAllUsers(snap.docs.map(d => d.data()) as UserProfile[]);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setIsRegistering(true);
    try {
      await registerNewUser(newUserId, newUserPass, newUserName, newUserRole);
      setMsg({ type: 'success', text: `User ${newUserId} registered successfully.` });
      setNewUserId('');
      setNewUserPass('');
      setNewUserName('');
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMsg({ type: 'error', text: err.message || 'Failed to register user.' });
    } finally {
      setIsRegistering(false);
    }
  };

  if (userProfile?.role !== 'Admin') {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center p-12 bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-20" />
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-sm font-medium">This module requires Administrative clearance levels. Restricted node access detected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Control <span className="text-brand-blue">Center</span></h2>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Personnel / Infrastructure / Node Governance</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
           <button 
             onClick={() => setActiveSubTab('users')}
             className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeSubTab === 'users' ? "bg-white text-brand-blue shadow-lg" : "text-slate-400 hover:text-slate-600"
             )}
           >
             <Users className="w-4 h-4" />
             Personnel
           </button>
           <button 
             onClick={() => setActiveSubTab('settings')}
             className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeSubTab === 'settings' ? "bg-white text-brand-blue shadow-lg" : "text-slate-400 hover:text-slate-600"
             )}
           >
             <UserCog className="w-4 h-4" />
             Infrastructure
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-6">
         {/* Sidebar for Registration */}
         <div className="col-span-4 h-full overflow-y-auto pr-2">
            <div className="bento-card p-6 bg-slate-50 border-brand-blue/10">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Enroll Staff</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Generate new node credentials</p>
                  </div>
               </div>

               <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff ID</label>
                    <input 
                      required
                      value={newUserId}
                      onChange={e => setNewUserId(e.target.value)}
                      placeholder="e.g. DOC-101"
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      placeholder="e.g. Dr. John Doe"
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
                    <select 
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue transition-all appearance-none"
                    >
                      <option value="Staff">Staff / Reception</option>
                      <option value="Nurse">Nursing Staff</option>
                      <option value="Doctor">Clinical Doctor</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Password</label>
                    <div className="relative">
                      <input 
                        required
                        type="password"
                        value={newUserPass}
                        onChange={e => setNewUserPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                      />
                      <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    </div>
                  </div>

                  <button 
                    disabled={isRegistering}
                    className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isRegistering ? 'Generating...' : 'Finalize Enrollment'}
                  </button>

                  {msg && (
                    <div className={cn(
                      "p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2",
                      msg.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                    )}>
                      {msg.text}
                    </div>
                  )}
               </form>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="col-span-8 h-full overflow-hidden flex flex-col gap-6">
            <div className="bento-card flex-1 p-8 bg-white overflow-hidden flex flex-col">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
                        <Users className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Registry</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Personnel Directory</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex -space-x-3">
                        {allUsers.slice(0, 5).map((u, i) => (
                          <div key={i} className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-black text-brand-blue">
                            {u.name[0]}
                          </div>
                        ))}
                        {allUsers.length > 5 && (
                          <div className="w-10 h-10 rounded-xl bg-brand-blue text-white border-2 border-white flex items-center justify-center text-[10px] font-black">
                             +{allUsers.length - 5}
                          </div>
                        )}
                     </div>
                     <div className="w-px h-8 bg-slate-100 mx-2" />
                     <button onClick={fetchUsers} className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline">Sync Node</button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
                  <div className="grid grid-cols-2 gap-4">
                     {allUsers.map((u, i) => (
                       <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-[2rem] group hover:border-brand-blue/30 transition-all flex justify-between items-start">
                          <div className="flex gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand-blue">
                                {u.role === 'Admin' ? <Shield className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-800 tracking-tight">{u.name}</p>
                                <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mt-0.5">{u.role}</p>
                                <p className="text-[9px] font-mono text-slate-400 mt-2 uppercase">ID: {u.employeeId}</p>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
