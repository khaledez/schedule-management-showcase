export class AppointmentsEventPayload {
  eventName: string;
  changeType: string;
  source: string;
  clinicId: number;
  patientId: number;
  triggeringMMXUser?: number;
  doctorsAffected: number[];
  appointmentsAffected: number[];
  appointment: EventAppointmentPayload;
  previousAppointment?: EventAppointmentPayload;
  appointmentBeforeUpdate?: EventAppointmentPayload;
}

export interface EventAppointmentPayload {
  appointmentId: number;
  staffId: number;
  appointmentStatus: EventAppointmentStatusPayload;
  appointmentDateTime: string;
}

export interface EventAppointmentStatusPayload {
  code: string;
  nameEn: string;
  nameFr: string;
}
