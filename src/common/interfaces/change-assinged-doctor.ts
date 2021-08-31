export interface ChangeAssingedDoctorPayload {
  clinicId: number;
  doctorId: number;
  patientId: number;
  appointmentId?: number;
  reason?: string;
}
