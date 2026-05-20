import React, { useState } from 'react';
import { useHMS } from '../context/HMSContext';
import { UserRole, UserProfile } from '../types';
import { Plus, Users, Shield, UserCog, Key, Trash2, Edit2, X, Save } from 'lucide-react';
import { cn } from '../lib/utils';

export function Admin() {
  const { registerNewUser, userProfile, doctors, allUsers, updateUserProfile, deleteUserProfile } = useHMS();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'settings'>('users');
  
  // Registration State
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Staff');
  const [associatedDoctorId, setAssociatedDoctorId] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Edit State
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Staff');
  const [editDocId, setEditDocId] = useState('');
  
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);
  
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setIsRegistering(true);
    try {
      await registerNewUser(newUserId, newUserPass, newUserName, newUserRole, newUserRole === 'Nurse' ? associatedDoctorId : undefined);
      setMsg({ type: 'success', text: `User ${newUserId} registered successfully.` });
      setNewUserId('');
      setNewUserPass('');
      setNewUserName('');
      setAssociatedDoctorId('');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMsg({ type: 'error', text: err.message || 'Failed to register user.' });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStartEdit = (u: UserProfile) => {
    setEditingUid(u.uid);
    setEditName(u.name);
    setEditRole(u.role);
    setEditDocId(u.associatedDoctorId || '');
  };

  const handleSaveEdit = async () => {
    if (!editingUid) return;
    setMsg(null);
    try {
      await updateUserProfile(editingUid, {
        name: editName,
        role: editRole,
        associatedDoctorId: editRole === 'Nurse' ? (editDocId || null) : null
      });
      setEditingUid(null);
      setMsg({ type: 'success', text: 'Personnel record updated successfully.' });
    } catch (e) {
      console.error(e);
      setMsg({ type: 'error', text: 'Failed to update user profile.' });
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === userProfile?.uid) {
      setMsg({ type: 'error', text: 'Cannot delete your own administrative account.' });
      return;
    }

    setMsg(null);
    try {
      await deleteUserProfile(uid);
      setMsg({ type: 'success', text: 'Personnel record removed from system.' });
      setConfirmDeleteUid(null);
    } catch (e) {
      console.error(e);
      setMsg({ type: 'error', text: 'Failed to delete user profile. Check permissions.' });
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
    <div className="h-full flex flex-col gap-6 lg:overflow-hidden overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Control <span className="text-brand-blue">Center</span></h2>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Personnel / Infrastructure / Node Governance</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl self-start md:self-auto">
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

      <div className="flex-1 lg:overflow-hidden grid grid-cols-12 gap-6 h-auto">
         {/* Sidebar for Registration */}
         <div className="col-span-12 lg:col-span-4 lg:h-full overflow-y-auto pr-2">
            <div className="bento-card p-6 bg-slate-50 border-brand-blue/10">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center shrink-0">
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
                      className="w-full px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      placeholder="e.g. Dr. John Doe"
                      className="w-full px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
                    <select 
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue transition-all appearance-none"
                    >
                      <option value="Staff">Staff / Reception</option>
                      <option value="Nurse">Nursing Staff</option>
                      <option value="Doctor">Clinical Doctor</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>

                  {newUserRole === 'Nurse' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Assign to Doctor Clinic</label>
                       <select 
                         value={associatedDoctorId}
                         onChange={e => setAssociatedDoctorId(e.target.value)}
                         className="w-full px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue transition-all appearance-none"
                       >
                         <option value="">General (No specific doctor)</option>
                         {doctors.map(doc => (
                           <option key={doc.uid} value={doc.uid}>Clinic: Dr. {doc.name}</option>
                         ))}
                       </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Password</label>
                    <div className="relative">
                      <input 
                        required
                        type="password"
                        value={newUserPass}
                        onChange={e => setNewUserPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue transition-all"
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
         <div className="col-span-12 lg:col-span-8 lg:h-full overflow-hidden flex flex-col gap-6 min-h-[500px]">
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
                     <button onClick={() => window.location.reload()} className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline">Hard Refresh</button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                     {allUsers.map((u) => {
                       const isEditing = editingUid === u.uid;
                       return (
                         <div key={u.uid} className={cn(
                           "p-5 border rounded-[2rem] transition-all flex flex-col gap-4",
                           isEditing ? "bg-white border-brand-blue ring-2 ring-brand-blue/10 scale-[1.02] shadow-xl" : "bg-slate-50 border-slate-100"
                         )}>
                            <div className="flex justify-between items-start">
                               <div className="flex gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center",
                                    isEditing ? "bg-brand-blue text-white" : "bg-white text-brand-blue"
                                  )}>
                                     {u.role === 'Admin' ? <Shield className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                  </div>
                                  <div className="flex-1">
                                     {isEditing ? (
                                       <div className="space-y-3">
                                          <input 
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue"
                                            placeholder="Name"
                                          />
                                          <div className="flex gap-2">
                                            <select 
                                              value={editRole}
                                              onChange={e => setEditRole(e.target.value as UserRole)}
                                              className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none appearance-none"
                                            >
                                              <option value="Staff">Staff</option>
                                              <option value="Nurse">Nurse</option>
                                              <option value="Doctor">Doctor</option>
                                              <option value="Admin">Admin</option>
                                            </select>
                                            {editRole === 'Nurse' && (
                                              <select 
                                                value={editDocId}
                                                onChange={e => setEditDocId(e.target.value)}
                                                className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none appearance-none"
                                              >
                                                <option value="">General</option>
                                                {doctors.map(d => (
                                                  <option key={d.uid} value={d.uid}>Dr. {d.name}</option>
                                                ))}
                                              </select>
                                            )}
                                          </div>
                                       </div>
                                     ) : (
                                       <>
                                          <p className="text-sm font-black text-slate-800 tracking-tight">{u.name}</p>
                                          <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mt-0.5">{u.role}</p>
                                          {u.associatedDoctorId && (
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">
                                              Clinic: Dr. {doctors.find(d => d.uid === u.associatedDoctorId)?.name || 'Ahmed'}
                                            </p>
                                          )}
                                          <p className="text-[9px] font-mono text-slate-400 mt-2 uppercase">ID: {u.employeeId}</p>
                                       </>
                                     )}
                                  </div>
                               </div>

                               <div className="flex gap-1 items-center">
                                  {isEditing ? (
                                    <>
                                       <button 
                                         onClick={handleSaveEdit}
                                         className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                       >
                                          <Save className="w-4 h-4" />
                                       </button>
                                       <button 
                                         onClick={() => setEditingUid(null)}
                                         className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                       >
                                          <X className="w-4 h-4" />
                                       </button>
                                    </>
                                  ) : confirmDeleteUid === u.uid ? (
                                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-100 animate-in fade-in zoom-in-95">
                                       <button 
                                         onClick={() => handleDeleteUser(u.uid)}
                                         className="px-3 py-1 bg-red-500 text-white text-[8px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors"
                                       >
                                          Confirm Delete
                                       </button>
                                       <button 
                                         onClick={() => setConfirmDeleteUid(null)}
                                         className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50"
                                       >
                                          <X className="w-3 h-3" />
                                       </button>
                                    </div>
                                  ) : (
                                    <>
                                       <button 
                                         onClick={() => handleStartEdit(u)}
                                         className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-brand-blue hover:border-brand-blue transition-all"
                                       >
                                          <Edit2 className="w-3.5 h-3.5" />
                                       </button>
                                       <button 
                                         onClick={() => setConfirmDeleteUid(u.uid)}
                                         className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-red-500 hover:border-red-500 transition-all"
                                       >
                                          <Trash2 className="w-3.5 h-3.5" />
                                       </button>
                                    </>
                                  )}
                               </div>
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

