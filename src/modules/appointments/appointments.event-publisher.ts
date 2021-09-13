import { Injectable, Logger } from '@nestjs/common';
import { ErrorCodes } from '../../common/enums';
import { SCHEDULE_MGMT_TOPIC } from '../../common/constants';
import { AppointmentsEventPayload } from './events/appointments-event-payload';
import { AppointmentsModelAttributes } from './appointments.model';
import { LookupsService } from '../lookups/lookups.service';
import { IIdentity } from '@monmedx/monmedx-common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { snsTopic } = require('pubsub-service');

export enum AppointmentsEventName {
  APPOINTMENT_SET_PROVISIONAL = 'APPOINTMENT_SET_PROVISIONAL',
  APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_CANCELED = 'APPOINTMENT_CANCELED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
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
    identity: IIdentity,
  ) {
    const payload: AppointmentsEventPayload = {
      eventName,
      changeType: AppointmentEventPublisher.APPOINTMENT_CHANGE_TYPE,
      source: SCHEDULE_MGMT_TOPIC,
      clinicId: appointment.clinicId,
      patientId: appointment.patientId,
      triggeringMMXUser: identity.userId,
      doctorsAffected: this.getAffected([appointment, previousAppointment], 'staffId'),
      appointmentsAffected: this.getAffected([appointment, previousAppointment], 'id'),
      appointment: await this.appointmentToEventAppointmentPayLoad(appointment),
      previousAppointment: await this.appointmentToEventAppointmentPayLoad(previousAppointment),
      appointmentBeforeUpdate: await this.appointmentToEventAppointmentPayLoad(appointmentBeforeUpdate),
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
    return appointment
      ? {
          appointmentId: appointment.id,
          staffId: appointment.staffId,
          appointmentStatus: {
            code: status.code,
            nameEn: status.nameEn,
            nameFr: status.nameFr,
          },
          appointmentDateTime: appointment.startDate.toISOString(),
        }
      : null;
  }

  getAffected(appointments: AppointmentsModelAttributes[], field: string): number[] {
    return appointments.filter((appointment) => appointment).map((appointment) => appointment[field]);
  }
}
