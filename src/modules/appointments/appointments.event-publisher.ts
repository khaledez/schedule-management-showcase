import { IIdentity } from '@monmedx/monmedx-common';
import { Injectable, Logger } from '@nestjs/common';
import { SCHEDULE_MGMT_TOPIC } from '../../common/constants';
import { ErrorCodes } from '../../common/enums';
import { AppointmentsRequestData } from '../appointment-requests/models';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentsModelAttributes } from './appointments.model';
import { AppointmentsEventPayload, LookupModelPayload } from './events/appointments-event-payload';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { snsTopic } = require('@monmedx/monmedx-pubsub');

export enum AppointmentsEventName {
  APPOINTMENT_SET_PROVISIONAL = 'APPOINTMENT_SET_PROVISIONAL',
  APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_CANCELED = 'APPOINTMENT_CANCELED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_REQUEST_DECLINED = 'APPOINTMENT_REQUEST_DECLINED',
  APPOINTMENT_REQUEST_UPDATES = 'APPOINTMENT_REQUEST_UPDATES',
}

@Injectable()
export class AppointmentEventPublisher {
  private readonly logger = new Logger(AppointmentEventPublisher.name);

  public static APPOINTMENT_CHANGE_TYPE = 'Appointment';

  constructor(private readonly lookupsService: LookupsService) {}

  async publishAppointmentEvent(
    eventName: AppointmentsEventName,
    appointment: AppointmentsModelAttributes,
    previousAppointment: AppointmentsModelAttributes,
    appointmentBeforeUpdate: AppointmentsModelAttributes,
    requestData?: AppointmentsRequestData,
    identity?: IIdentity,
  ) {
    // A necessary work around for unit tests to work properly
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const payload: AppointmentsEventPayload = {
      eventName,
      changeType: AppointmentEventPublisher.APPOINTMENT_CHANGE_TYPE,
      source: SCHEDULE_MGMT_TOPIC,
      clinicId: appointment.clinicId,
      patientId: appointment.patientId,
      triggeringMMXUser: identity?.userId || null,
      doctorsAffected: this.getAffected([appointment, previousAppointment], 'staffId'),
      appointmentsAffected: this.getAffected([appointment, previousAppointment], 'id'),
      appointment: await this.appointmentToEventAppointmentPayLoad(appointment),
      previousAppointment: await this.appointmentToEventAppointmentPayLoad(previousAppointment),
      appointmentBeforeUpdate: await this.appointmentToEventAppointmentPayLoad(appointmentBeforeUpdate),
      requestData: requestData,
    };
    snsTopic
      .sendSnsMessage(SCHEDULE_MGMT_TOPIC, {
        ...payload,
      })
      .catch((error) => {
        this.logger.error({
          message: `Failed publishing appointment event: ${eventName}, payload = ${payload}`,
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          error: error,
        });
      });
  }

  async appointmentToEventAppointmentPayLoad(appointment: AppointmentsModelAttributes) {
    if (!appointment) {
      return null;
    }
    const status = await this.lookupsService.getAppointmentStatusById(appointment.appointmentStatusId);
    const type = await this.lookupsService.getAppointmentTypeById(appointment.appointmentTypeId);
    return appointment
      ? {
          appointmentId: appointment.id,
          staffId: appointment.staffId,
          appointmentStatus: this.getModelLookups(status),
          appointmentType: this.getModelLookups(type),
          appointmentDateTime: appointment.startDate.toISOString(),
        }
      : null;
  }

  getModelLookups(model: { code: string; nameEn: string; nameFr: string }): LookupModelPayload {
    return model ? { code: model.code, nameEn: model.nameEn, nameFr: model.nameFr } : null;
  }

  getAffected(appointments: AppointmentsModelAttributes[], field: string): number[] {
    return appointments.filter((appointment) => appointment).map((appointment) => appointment[field]);
  }
}
