import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  writeBatch,
  orderBy,
  where,
  getDocs,
  getDoc,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType, logOut, loginWithId, registerWithId } from '../lib/firebase';
import { Patient, Visit, Department, VisitStatus, Order, UserProfile, UserRole } from '../types';

interface HMSContextType {
  patients: Patient[];
  visits: Visit[];
  activeDepartment: Department;
  showDashboard: boolean;
  currentUser: User | null;
  userProfile: UserProfile | null;
  doctors: UserProfile[];
  allUsers: UserProfile[];
  isAuthReady: boolean;
  systemHasUsers: boolean;
  setActiveDepartment: (dept: Department) => void;
  setShowDashboard: (show: boolean) => void;
  registerPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Promise<Patient>;
  createVisit: (patientId: string, doctorId?: string) => Promise<Visit>;
  createFollowUp: (patientId: string, date: string, doctorId?: string) => Promise<Visit>;
  updateVisitStatus: (visitId: string, status: VisitStatus, nextDept?: Department) => Promise<void>;
  updateVitals: (visitId: string, vitals: Visit['vitals']) => Promise<void>;
  updateSOAP: (visitId: string, soap: Visit['soapNotes'], diagnosis?: string) => Promise<void>;
  addOrder: (visitId: string, order: Omit<Order, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  updateOrder: (visitId: string, orderId: string, updates: Partial<Order>) => Promise<void>;
  markPaid: (visitId: string) => Promise<void>;
  deactivateVisit: (visitId: string) => Promise<void>;
  saveVitalsAndTransfer: (visitId: string, vitals: Visit['vitals'], nextDept: Department) => Promise<void>;
  clearAllData: () => Promise<void>;
  login: (id: string, pass: string) => Promise<void>;
  registerNewUser: (id: string, pass: string, name: string, role: UserRole, associatedDoctorId?: string) => Promise<void>;
  updateUserProfile: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUserProfile: (uid: string) => Promise<void>;
  logout: () => Promise<void>;
  provisionUserProfile: (name: string, role: UserRole, associatedDoctorId?: string) => Promise<void>;
}

const HMSContext = createContext<HMSContextType | undefined>(undefined);

export function HMSProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<Department>('Reception');
  const [showDashboard, setShowDashboard] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [systemHasUsers, setSystemHasUsers] = useState(true);

  // Check if system has any users (for bootstrap)
  useEffect(() => {
    const checkUsers = async () => {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt'), where('role', '==', 'Admin'), limit(1)));
        setSystemHasUsers(!usersSnap.empty);
      } catch (error) {
        // If query fails, it might be due to rules. We'll default to login screen.
        console.warn("User check failed:", error);
        setSystemHasUsers(true); 
      }
    };
    checkUsers();
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const profileSnap = await getDoc(doc(db, 'users', user.uid));
          if (profileSnap.exists()) {
            const profile = profileSnap.data() as UserProfile;
            setUserProfile(profile);
            // Default active department based on role
            if (profile.role === 'Doctor') setActiveDepartment('Doctor');
            else if (profile.role === 'Nurse') setActiveDepartment('Nurse');
            else if (profile.role === 'Staff') setActiveDepartment('Reception');
            else if (profile.role === 'Admin') setActiveDepartment('Admin');
          } else {
            console.error(`User profile missing for UID: ${user.uid}`);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth profile fetch error:", error);
        handleFirestoreError(error, OperationType.GET, user ? `users/${user.uid}` : 'auth');
      } finally {
        setCurrentUser(user);
        setIsAuthReady(true);
      }
    });
  }, []);

  const login = async (id: string, pass: string) => {
    await loginWithId(id, pass);
  };

  const logout = async () => {
    await logOut();
  };

  const registerNewUser = async (id: string, pass: string, name: string, role: UserRole, associatedDoctorId?: string) => {
    let cred;
    try {
      cred = await registerWithId(id, pass);
    } catch (error) {
      // Auth registration failed
      throw error;
    }
 
    try {
      const profile: UserProfile = {
        uid: cred.user.uid,
        name,
        role,
        employeeId: id,
        createdAt: new Date().toISOString(),
        associatedDoctorId: associatedDoctorId || null
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setUserProfile(profile);
      setSystemHasUsers(true);
    } catch (error) {
      // Firestore profile creation failed - the user is in Auth but not DB.
      // We should attempt to delete the Auth user to allow retry.
      try {
        await cred.user.delete();
      } catch (deleteError) {
        console.error("Failed to rollback Auth user after Firestore failure:", deleteError);
      }
      handleFirestoreError(error, OperationType.WRITE, 'users');
      throw error;
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setPatients([]);
      setVisits([]);
      return;
    }

    const patientsRef = query(
      collection(db, 'patients'), 
      orderBy('createdAt', 'desc')
    );
    const unsubscribePatients = onSnapshot(patientsRef, (snapshot) => {
      const patientList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        };
      }) as Patient[];
      setPatients(patientList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'patients'));

    const visitsQuery = query(
      collection(db, 'visits'), 
      orderBy('createdAt', 'desc')
    );
    const unsubscribeVisits = onSnapshot(visitsQuery, (snapshot) => {
      const visitList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      }) as Visit[];
      setVisits(visitList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'visits'));

    return () => {
      unsubscribePatients();
      unsubscribeVisits();
    };
  }, [currentUser]);

  // Fetch All Users & Segment Doctors
  useEffect(() => {
    if (!currentUser) {
      setAllUsers([]);
      setDoctors([]);
      return;
    }
    
    // We fetch ALL users if the user is signed in. Rules allow list: if isSignedIn().
    // This simplifies the UI for searches and admin panels.
    const usersQuery = query(collection(db, 'users'), orderBy('name'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id // Ensure UID is always synced with Doc ID
      })) as UserProfile[];
      
      setAllUsers(userList);
      setDoctors(userList.filter(u => u.role === 'Doctor'));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => unsubscribeUsers();
  }, [currentUser]);

  const registerPatient = async (data: Omit<Patient, 'id' | 'createdAt'>) => {
    const mrn = `MRN-${Math.floor(1000 + Math.random() * 9000)}`;
    const path = `patients/${mrn}`;
    try {
      const newPatient = {
        ...data,
        middleName: data.middleName || null,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'patients', mrn), newPatient);
      return { id: mrn, ...newPatient } as unknown as Patient;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  };

  const createVisit = async (patientId: string, doctorId?: string) => {
    const visitId = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const path = `visits/${visitId}`;
    try {
      const newVisit = {
        patientId,
        status: 'Booked' as VisitStatus,
        currentDepartment: 'Reception' as Department,
        assignedDoctorId: doctorId || null,
        token: `T-${Math.floor(100 + Math.random() * 900)}`,
        orders: [],
        isPaid: false,
        vitals: null,
        soapNotes: null,
        diagnosis: null,
        scheduledDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'visits', visitId), newVisit);
      return { id: visitId, ...newVisit } as unknown as Visit;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  };

  const createFollowUp = async (patientId: string, date: string, doctorId?: string) => {
    const visitId = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const path = `visits/${visitId}`;
    try {
      const newVisit = {
        patientId,
        status: 'Waiting' as VisitStatus,
        currentDepartment: 'Doctor' as Department,
        assignedDoctorId: doctorId || null,
        token: `F-${Math.floor(100 + Math.random() * 900)}`,
        orders: [],
        isPaid: false,
        vitals: null,
        soapNotes: null,
        diagnosis: null,
        scheduledDate: date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'visits', visitId), newVisit);
      return { id: visitId, ...newVisit } as unknown as Visit;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  };

  const updateVisitStatus = async (visitId: string, status: VisitStatus, nextDept?: Department) => {
    const path = `visits/${visitId}`;
    try {
      await updateDoc(doc(db, 'visits', visitId), {
        status,
        currentDepartment: nextDept || activeDepartment,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateVitals = async (visitId: string, vitals: Visit['vitals']) => {
    const path = `visits/${visitId}`;
    try {
      await updateDoc(doc(db, 'visits', visitId), {
        vitals,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateSOAP = async (visitId: string, soap: Visit['soapNotes'], diagnosis?: string) => {
    const path = `visits/${visitId}`;
    try {
      await updateDoc(doc(db, 'visits', visitId), {
        soapNotes: soap,
        diagnosis: diagnosis || null,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const addOrder = async (visitId: string, order: Omit<Order, 'id' | 'timestamp' | 'status'>) => {
    const path = `visits/${visitId}`;
    try {
      const newOrder: Order = {
        ...order,
        id: `ORD-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date().toISOString(),
        status: 'Ordered'
      };
      await updateDoc(doc(db, 'visits', visitId), {
        orders: arrayUnion(newOrder),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateOrder = async (visitId: string, orderId: string, updates: Partial<Order>) => {
    const path = `visits/${visitId}`;
    try {
      // For simplicity in this demo, we replace the whole orders array
      // In a high-concurrency app, you'd use a subcollection
      const visit = visits.find(v => v.id === visitId);
      if (!visit) return;
      
      const newOrders = visit.orders.map(o => 
        o.id === orderId ? { ...o, ...updates } : o
      );
      
      await updateDoc(doc(db, 'visits', visitId), {
        orders: newOrders,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const markPaid = async (visitId: string) => {
    const path = `visits/${visitId}`;
    try {
      await updateDoc(doc(db, 'visits', visitId), {
        isPaid: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deactivateVisit = async (visitId: string) => {
    const path = `visits/${visitId}`;
    try {
      await updateDoc(doc(db, 'visits', visitId), {
        status: 'Cancelled',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const saveVitalsAndTransfer = async (visitId: string, vitals: Visit['vitals'], nextDept: Department) => {
    const path = `visits/${visitId}`;
    try {
      await updateDoc(doc(db, 'visits', visitId), {
        vitals,
        status: 'Waiting' as VisitStatus,
        currentDepartment: nextDept,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const clearAllData = async () => {
    try {
      const batch = writeBatch(db);
      
      // Add all visits to batch
      visits.forEach(v => {
        batch.delete(doc(db, 'visits', v.id));
      });
      
      // Add all patients to batch
      patients.forEach(p => {
        batch.delete(doc(db, 'patients', p.id));
      });
      
      await batch.commit();
      console.log('System reset successful: All records purged.');
    } catch (error) {
      console.error('System reset failed:', error);
      alert('Failed to reset system data. Check console for details.');
    }
  };

  const provisionUserProfile = async (name: string, role: UserRole, associatedDoctorId?: string) => {
    if (!currentUser) throw new Error("No authenticated user found.");
    
    // Extract employeeId from email if possible
    const employeeId = currentUser.email?.split('@')[0] || 'unknown';

    try {
      const profile: UserProfile = {
        uid: currentUser.uid,
        name,
        role,
        employeeId,
        createdAt: new Date().toISOString(),
        associatedDoctorId: associatedDoctorId || null
      };
      await setDoc(doc(db, 'users', currentUser.uid), profile);
      setUserProfile(profile);
      setSystemHasUsers(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
      throw error;
    }
  };

  const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
    try {
      // Sanitize updates - Firestore doesn't allow undefined values
      const sanitizedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'users', uid), sanitizedUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
      throw error;
    }
  };

  const deleteUserProfile = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users');
      throw error;
    }
  };

  return (
    <HMSContext.Provider value={{
      patients, visits, doctors, allUsers, activeDepartment, showDashboard, currentUser, userProfile, isAuthReady, systemHasUsers,
      setActiveDepartment, setShowDashboard,
      registerPatient, createVisit, createFollowUp, updateVisitStatus,
      updateVitals, updateSOAP, addOrder, updateOrder, markPaid, deactivateVisit, saveVitalsAndTransfer, clearAllData,
      login, registerNewUser, updateUserProfile, deleteUserProfile, logout, provisionUserProfile
    }}>
      {children}
    </HMSContext.Provider>
  );
}

export function useHMS() {
  const context = useContext(HMSContext);
  if (context === undefined) {
    throw new Error('useHMS must be used within a HMSProvider');
  }
  return context;
}
