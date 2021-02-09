import { PatientsModel } from '../models/patients.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';
import { AppointmentActionsLookupsModel } from '../../lookups/models/appointment-actions.model';
import { AppointmentsModel } from '../models/appointments.model';

export class AppointmentResponseInterface {
  id: number;
  clinicId: number;
  patientId: number;
  doctorId: number;
  availabilityId: number;
  previousAppointment: number;
  createdBy: number;
  updatedBy: number;
  appointmentTypeId: number;
  date: Date;
  provisionalDate: Date;
  appointmentStatusId: number;
  cancelRescheduleText: string;
  cancelRescheduleReasonId: number;
  upcomingAppointment: boolean;
  canceledBy: number;
  canceledAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  deletedBy: number;
  patient: PatientsModel;
  appointmentType: AppointmentTypesLookupsModel;
  appointmentStatus: AppointmentStatusLookupsModel;
  cancelRescheduleReason: AppointmentActionsLookupsModel;
  primaryAction: AppointmentStatusLookupsModel;
  secondaryActions: AppointmentActionsLookupsModel[];
}
