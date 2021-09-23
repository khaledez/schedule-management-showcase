import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  DEFAULT_APPOINTMENT_THRESHOLD_DAYS,
  EVENT_APPOINTMENT_MISSED,
  EVENT_APPOINTMENT_NOT_CONFIRMED,
  EVENT_PROVISIONAL_PAST,
  SCHEDULE_MGMT_TOPIC,
} from 'common/constants';
import { CronSupportedEvents } from 'common/enums/cron-supported-events';
import { DateTime } from 'luxon';
import { AppointmentsModel } from 'modules/appointments/appointments.model';
import { AppointmentsService } from 'modules/appointments/appointments.service';
import { AppointmentNotificationEvent } from 'modules/appointments/dto/appointment-notification-event.dto';
import { snsTopic } from 'pubsub-service';

@Injectable()
export class AppointmentsCron {
  private readonly logger = new Logger(AppointmentsCron.name);
  constructor(private readonly apptService: AppointmentsService) {}

  @Cron('0 7 * * *') // Everyday at 7AM
  async handleCron() {
    const startTime = DateTime.now();
    await Promise.allSettled([this.notifyDueProvisionalAppointments(), this.notifyMissedAppointments()]).then(
      (result) => {
        const endTime = DateTime.now();
        const diff = endTime.diff(startTime);
        this.logger.log({
          message: `CRON Service executed at ${startTime.toISO()}, EXECUTION TIME: ${
            diff.toObject().milliseconds
          } Milliseconds`,
          result,
        });
      },
    );
  }

  async notifyDueProvisionalAppointments() {
    const eventName = EVENT_PROVISIONAL_PAST;
    this.logger.debug({
      message: '1. Preparing to send notifications for due provisional appointments',
      function: 'notifyDueProvisionalAppointments',
      eventSubject: eventName,
    });
    const dueAppts = await this.apptService.getAllDueProvisionalAppointments();
    await this.notifyForAllAppointments(EVENT_PROVISIONAL_PAST, dueAppts);
  }

  async notifyMissedAppointments() {
    const eventName = EVENT_APPOINTMENT_MISSED;
    this.logger.debug({
      message: `1. Preparing to send notifications for missed appointments`,
      function: 'notifyMissedAppointments',
      eventSubject: eventName,
    });
    const missedAppts = await this.apptService.getAllYesterdayMissedAppointments();
    await this.notifyForAllAppointments(eventName, missedAppts);
  }

  async notifyUnconfirmedAppointments() {
    const eventName = EVENT_APPOINTMENT_NOT_CONFIRMED;
    const appointmentThresholdDays = DEFAULT_APPOINTMENT_THRESHOLD_DAYS;
    this.logger.debug({
      message: `1. Preparing to send notifications for unconfirmed appointments prior ${appointmentThresholdDays} days`,
      function: 'notifyUnconfirmedAppointments',
      eventSubject: eventName,
    });
    const unconfirmedAppts = await this.apptService.getAllUnconfirmedAppointmentInXDays(appointmentThresholdDays);
    await this.notifyForAllAppointments(eventName, unconfirmedAppts, {
      appointmentThresholdDays,
    });
  }

  /**
   * Emits an event to {eventName} with payload type {AppointmentNotificationEvent}
   * for each appointment provided
   * @param eventName Enum of supported events
   * @param eventAppointments Array of zero or more appointment models
   * @param eventExtraAttributes Other attributes to be sent in the event (ex. appointmentThresholDays)
   */
  private async notifyForAllAppointments(
    eventName: CronSupportedEvents,
    eventAppointments: AppointmentsModel[],
    eventExtraAttributes?: any,
  ) {
    // Arrange
    const promises = eventAppointments.map((appt) => {
      // You must map the sequelize model to plain object to destruct data from it
      const planAppointment = appt.get({ plain: true });
      const eventPayload = this.mapPayloadToNotificationEvent(eventName, {
        ...planAppointment,
        ...eventExtraAttributes,
      });
      return snsTopic.sendSnsMessage(SCHEDULE_MGMT_TOPIC, eventPayload);
    });

    this.logger.debug({
      message: `2. Sending event ${eventName} notifications for ${eventAppointments.length} appointments`,
      appointments: eventAppointments,
      eventSubject: eventName,
    });
    // Act
    const allRes = await Promise.allSettled(promises);

    // Validate
    allRes.forEach((res) => {
      if (res.status === 'rejected') {
        this.logger.error({
          function: 'noitfyForAllAppointments',
          error: res.reason,
        });
      }
    });
  }

  private mapPayloadToNotificationEvent(
    eventName: CronSupportedEvents,
    payload: {
      clinicId: number;
      patientId: number;
      staffId: number;
      startDate: Date;
      appointmentThresholdDays?: number;
    },
  ): AppointmentNotificationEvent {
    let ret: AppointmentNotificationEvent = {
      eventName,
      source: SCHEDULE_MGMT_TOPIC,
      clinicId: payload.clinicId,
      patientId: payload.patientId,
      staffId: payload.staffId,
      appointmentDate: payload.startDate.toISOString().split('T')[0],
      appointmentTime: payload.startDate.toLocaleTimeString([], { hour12: false }),
    };
    if (payload.appointmentThresholdDays) {
      ret = {
        ...ret,
        appointmentThresholdDays: payload.appointmentThresholdDays,
      };
    }
    return ret;
  }
}
