export enum PatientStatus {
  INACTIVE = 'INACTIVE',
  RELEASED = 'RELEASED',
  DECEASED = 'DECEASED',
  ACTIVE = 'ACTIVE',
}

export const patientInactiveStatuses = [
  PatientStatus.INACTIVE.toString(),
  PatientStatus.RELEASED.toString(),
  PatientStatus.DECEASED.toString(),
];
