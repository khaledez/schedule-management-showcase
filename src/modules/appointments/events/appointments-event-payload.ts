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
  appointmentStatus?: LookupModelPayload;
  appointmentType?: LookupModelPayload;
  appointmentDateTime: string;
}

export interface LookupModelPayload {
  code: string;
  nameEn: string;
  nameFr: string;
}
