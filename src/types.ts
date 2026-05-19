export type VisitStatus = 'Booked' | 'Waiting' | 'In Progress' | 'Complete' | 'Follow-up' | 'Cancelled';

export type Department = 'Reception' | 'Nurse' | 'Doctor' | 'Lab' | 'Radiology' | 'Pharmacy' | 'Logs' | 'Admin';

export type UserRole = 'Admin' | 'Doctor' | 'Nurse' | 'Staff';

export interface LabTestMetadata {
  name: string;
  section: string;
  parameter: string;
  range: string;
  unit: string;
  specimen: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  role: UserRole;
  employeeId: string;
  createdAt: string;
}

export interface Vitals {
  temperature: string;
  bloodPressure: string;
  height: string;
  weight: string;
  pulse: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
  timestamp: string;
}

export interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface Order {
  id: string;
  type: 'Laboratory' | 'Radiology' | 'Pharmacy';
  description: string;
  selectedTests?: string[];
  testResults?: Record<string, string>;
  status: 'Ordered' | 'Ready' | 'Dispensed' | 'Completed' | 'Pending';
  results?: string;
  timestamp: string;
  medicationId?: string;
  sig?: string;
}

export interface Patient {
  id: string; // MRN
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  itemName: string;
  itemType: string;
  itemCategory: string;
  drugFormName: string;
  drugMeasurement: string;
  genericName: string;
  strength: string;
  usage: string;
  stock: number;
}

export interface Visit {
  id: string; // CR Number / Visit ID
  patientId: string;
  status: VisitStatus;
  currentDepartment: Department;
  token: string;
  vitals?: Vitals | null;
  soapNotes?: SOAPNotes | null;
  diagnosis?: string | null;
  orders: Order[];
  isPaid: boolean;
  scheduledDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HMSState {
  patients: Patient[];
  visits: Visit[];
  activePatientId?: string;
  activeVisitId?: string;
}
