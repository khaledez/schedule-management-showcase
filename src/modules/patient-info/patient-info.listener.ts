import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentsService } from '../appointments/appointments.service';
import { PatientInfoAttributes } from './patient-info.model';
import { PatientInfoService } from './patient-info.service';
import { patientInactiveStatuses } from '../../common/enums/patient-status';

const PATIENT_PROFILE_UPDATED_EVENT = 'patient_profile_updated';

export interface PatientInfoPayload {
  clinicId: number;
  id: number;
  dob: string;
  firstName: string;
  lastName: string;
  primaryHealthPlanNumber: string;
  doctorId?: number;
  legacyId?: string;
  userId?: number;
  statusHistory: {
    status: {
      code: string;
    };
  };

  errors?: unknown;
}

interface PatientProfileUpdatedEvent {
  eventName: 'patient_profile_updated';
  credentials: unknown;
  source: string;
  clinicId: number;
  patientId: number;
  data: PatientInfoPayload;
}

@Injectable()
export class PatientInfoListener {
  private readonly logger = new Logger(PatientInfoListener.name);

  constructor(
    @Inject(PatientInfoService)
    private readonly patientInfoSvc: PatientInfoService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @OnEvent(PATIENT_PROFILE_UPDATED_EVENT, { async: true })
  async handlePatientProfileUpdatedEvent(payload: PatientProfileUpdatedEvent) {
    this.logger.log({
      function: 'handlePatientProfileUpdatedEvent',
      payload,
    });

    if (payload.eventName !== 'patient_profile_updated') {
      return;
    }

    const patientAttr = patientInfoPayloadToAttributes(payload.data);

    try {
      if ((await this.patientInfoSvc.getById(payload.patientId)) === null) {
        // create patient
        await this.patientInfoSvc.create(patientAttr);
      } else {
        await this.patientInfoSvc.update(patientAttr);
      }

      if (patientInactiveStatuses.includes(patientAttr.statusCode)) {
        //Release patient appointment
        await this.appointmentsService.releasePatientAppointments(patientAttr);
      }
    } catch (error) {
      this.logger.error(error, 'while handlePatientProfileUpdatedEvent', JSON.stringify(payload));
    }
  }
}

export function patientInfoPayloadToAttributes(payload: PatientInfoPayload): PatientInfoAttributes {
  return {
    clinicId: payload.clinicId,
    id: payload.id,
    dob: payload.dob,
    fullName: `${payload.firstName} ${payload.lastName}`,
    primaryHealthPlanNumber: payload.primaryHealthPlanNumber,
    doctorId: payload.doctorId,
    statusCode: payload.statusHistory.status.code,
  };
}
