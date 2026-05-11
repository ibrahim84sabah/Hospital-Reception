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
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Patient, Visit, Department, VisitStatus, Order } from '../types';

interface HMSContextType {
  patients: Patient[];
  visits: Visit[];
  activeDepartment: Department;
  showDashboard: boolean;
  currentUser: User | null;
  isAuthReady: boolean;
  setActiveDepartment: (dept: Department) => void;
  setShowDashboard: (show: boolean) => void;
  registerPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Promise<Patient>;
  createVisit: (patientId: string) => Promise<Visit>;
  createFollowUp: (patientId: string, date: string) => Promise<Visit>;
  updateVisitStatus: (visitId: string, status: VisitStatus, nextDept?: Department) => Promise<void>;
  updateVitals: (visitId: string, vitals: Visit['vitals']) => Promise<void>;
  updateSOAP: (visitId: string, soap: Visit['soapNotes'], diagnosis?: string) => Promise<void>;
  addOrder: (visitId: string, order: Omit<Order, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  updateOrder: (visitId: string, orderId: string, updates: Partial<Order>) => Promise<void>;
  markPaid: (visitId: string) => Promise<void>;
  deactivateVisit: (visitId: string) => Promise<void>;
  saveVitalsAndTransfer: (visitId: string, vitals: Visit['vitals'], nextDept: Department) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const HMSContext = createContext<HMSContextType | undefined>(undefined);

export function HMSProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<Department>('Reception');
  const [showDashboard, setShowDashboard] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setPatients([]);
      setVisits([]);
      return;
    }

    const patientsRef = query(
      collection(db, 'patients'), 
      where('hospitalId', '==', 'default')
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
      where('hospitalId', '==', 'default'),
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

  const registerPatient = async (data: Omit<Patient, 'id' | 'createdAt'>) => {
    const mrn = `MRN-${Math.floor(1000 + Math.random() * 9000)}`;
    const path = `patients/${mrn}`;
    try {
      const newPatient = {
        ...data,
        middleName: data.middleName || null,
        ownerId: auth.currentUser?.uid,
        hospitalId: 'default',
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'patients', mrn), newPatient);
      return { id: mrn, ...newPatient } as unknown as Patient;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  };

  const createVisit = async (patientId: string) => {
    const visitId = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const path = `visits/${visitId}`;
    try {
      const newVisit = {
        patientId,
        hospitalId: 'default',
        status: 'Booked' as VisitStatus,
        currentDepartment: 'Reception' as Department,
        token: `T-${Math.floor(100 + Math.random() * 900)}`,
        orders: [],
        isPaid: false,
        vitals: null,
        soapNotes: null,
        diagnosis: null,
        scheduledDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'visits', visitId), newVisit);
      return { id: visitId, ...newVisit } as unknown as Visit;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  };

  const createFollowUp = async (patientId: string, date: string) => {
    const visitId = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const path = `visits/${visitId}`;
    try {
      const newVisit = {
        patientId,
        hospitalId: 'default',
        status: 'Waiting' as VisitStatus,
        currentDepartment: 'Doctor' as Department,
        token: `F-${Math.floor(100 + Math.random() * 900)}`,
        orders: [],
        isPaid: false,
        vitals: null,
        soapNotes: null,
        diagnosis: null,
        scheduledDate: date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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

  return (
    <HMSContext.Provider value={{
      patients, visits, activeDepartment, showDashboard, currentUser, isAuthReady, setActiveDepartment, setShowDashboard,
      registerPatient, createVisit, createFollowUp, updateVisitStatus,
      updateVitals, updateSOAP, addOrder, updateOrder, markPaid, deactivateVisit, saveVitalsAndTransfer, clearAllData
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
