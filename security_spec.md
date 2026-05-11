# Security Specification - CareSync HMS

## Data Invariants
1. Patients must have a unique MRN (Document ID).
2. Visits must have a unique CR Number (Document ID).
3. A client cannot register a patient without being authenticated.
4. A patient's `ownerId` must match the `uid` of the authenticated user who created it.
5. Visit records must be linked to a valid patient MRN.
6. Only staff (authenticated users) can read and write patient and visit data.
7. Role-based access (optional but recommended): Staff roles should restrict which fields can be updated in a visit (e.g., Nurses update vitals, Doctors update SOAP).
8. Every write must include `updatedAt` set to `request.time`.
9. `createdAt` must be immutable.

## The "Dirty Dozen" Payloads

### 1-4: Patient Identity & Integrity
1. **P1: Rogue MRN Registration**: Unauthenticated MRN creation.
2. **P2: MRN Hijacking**: User A attempts to update a patient record registered by User B.
3. **P3: Shadow Field Injection**: Attempting to add an `isAdmin: true` field to a patient document.
4. **P4: Immortal Field Mutation**: Attempting to change the `createdAt` timestamp of a patient.

### 5-8: Visit Lifecycle & State
5. **P5: Orphaned Visit**: Creating a visit for a non-existent `patientId`.
6. **P6: Unauthorized Diagnosis**: A non-doctor role attempting to update `diagnosis`. (If roles implemented).
7. **P7: Payment Spoofing**: Attempting to mark a visit as `isPaid: true` without being in the Reception department/role.
8. **P8: Token Manipulation**: Attempting to change a visit's `token` after it has been issued.

### 9-12: System & Resource Guards
9. **P9: Denial of Wallet (ID Poisoning)**: Creating a patient with a 1MB string as the ID.
10. **P10: Bulk Extraction**: Unauthenticated query for all patients.
11. **P11: History Erasure**: Attempting to delete a patient record (HMS rules forbid deletion for compliance).
12. **P12: Timestamp Spoofing**: Sending a client-side `updatedAt` that doesn't match `request.time`.
