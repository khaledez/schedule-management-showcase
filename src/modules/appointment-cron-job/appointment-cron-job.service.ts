import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  APPOINTMENT_CRON_JOB_REPOSITORY,
  EVENT_APPOINTMENT_APPOINTMENT_CHECKIN,
  EVENT_APPOINTMENT_CONFIRMATION_REQUIRED,
  EVENT_APPOINTMENT_NOT_CONFIRMED,
  EVENT_APPOINTMENT_REMINDER,
  SCHEDULE_MGMT_TOPIC,
} from 'common/constants';
import { AppointmentCronJobModel } from './appointment-cron-job.model';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentsModel } from '../appointments/appointments.model';
import { Op, Transaction } from 'sequelize';
import { AppointmentStatusEnum } from '../../common/enums/appointment-status.enum';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentCronJobAttributes } from './appointment-cron-job.model';
import { ClinicSettingsEnum } from 'common/enums/clinic-settings.enum';
import { NotificationDates } from './interfaces/notification-dates-interface';
import { AppointmentsService } from 'modules/appointments/appointments.service';
import { IIdentity } from '@monmedx/monmedx-common';
import { AppointmentActionEnum } from 'common/enums';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { snsTopic } = require('pubsub-service');

@Injectable()
export class AppointmentCronJobService {
  private readonly logger = new Logger(AppointmentCronJobService.name);
  constructor(
    @Inject(APPOINTMENT_CRON_JOB_REPOSITORY)
    private readonly AppointmentCronJobRepo: typeof AppointmentCronJobModel,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
    private readonly lookupsService: LookupsService,
  ) {}

  async notifyNotConfirmedAppointments() {
    const cronJobNotConfirmedAppointment = await this.AppointmentCronJobRepo.findAll({
      where: {
        type: ClinicSettingsEnum.CONFIRM_BEFORE_APPT_H,
        sentDate: null,
        targetDate: {
          [Op.lte]: new Date(),
        },
      },
      include: [
        {
          model: AppointmentsModel,
          where: {
            appointmentRequestId: null,
          },
          include: [
            {
              model: AppointmentStatusLookupsModel,
              where: {
                code: AppointmentStatusEnum.SCHEDULE,
              },
            },
          ],
        },
      ],
    });

    if (cronJobNotConfirmedAppointment.length === 0) {
      return;
    }

    await this.sendNotifications(cronJobNotConfirmedAppointment, EVENT_APPOINTMENT_CONFIRMATION_REQUIRED);

    const ids = cronJobNotConfirmedAppointment.map(({ id }) => id);

    await this.AppointmentCronJobRepo.update(
      {
        sentDate: new Date(),
      },
      {
        where: {
          id: ids,
        },
      },
    );
  }

  async notifyNotRemindedAppointments() {
    const cronJobNotRemindedAppointment = await this.AppointmentCronJobRepo.findAll({
      where: {
        type: ClinicSettingsEnum.REMIND_BEFORE_APPT_H,
        sentDate: null,
        targetDate: {
          [Op.lte]: new Date(),
        },
      },
      include: [
        {
          model: AppointmentsModel,
          where: {
            appointmentRequestId: null,
          },
          include: [
            {
              model: AppointmentStatusLookupsModel,
              where: {
                code: AppointmentStatusEnum.CONFIRM1,
              },
            },
          ],
        },
      ],
    });

    if (cronJobNotRemindedAppointment.length === 0) {
      return;
    }
    await this.sendNotifications(cronJobNotRemindedAppointment, EVENT_APPOINTMENT_REMINDER);

    const confirm2StatusId = await this.lookupsService.getStatusIdByCode(null, AppointmentStatusEnum.CONFIRM2);

    await this.updateCronJob(cronJobNotRemindedAppointment);

    const appointmentIds = cronJobNotRemindedAppointment.map(({ appointmentId }) => appointmentId);

    this.appointmentsService.updateAppointmentStatusBulk(appointmentIds, confirm2StatusId);
  }

  async notifySecNotConfirmedBeforeAppt() {
    const notConfirmedApptForSecretary = await this.AppointmentCronJobRepo.findAll({
      where: {
        type: ClinicSettingsEnum.NOTIFY_SEC_NOT_CONFIRMED_BEFORE_APPT_H,
        sentDate: null,
        targetDate: {
          [Op.lte]: new Date(),
        },
      },
      include: [
        {
          model: AppointmentsModel,
          where: {
            appointmentRequestId: null,
          },
          include: [
            {
              model: AppointmentStatusLookupsModel,
              where: {
                code: AppointmentStatusEnum.CONFIRM1,
              },
            },
          ],
        },
      ],
    });

    if (notConfirmedApptForSecretary.length === 0) {
      return;
    }

    await this.sendNotifications(notConfirmedApptForSecretary, EVENT_APPOINTMENT_NOT_CONFIRMED);

    await this.updateCronJob(notConfirmedApptForSecretary);
  }

  async sendCheckinNotificationBeforeAppt() {
    const cronJobSendCheckinNotificationBeforeAppt = await this.AppointmentCronJobRepo.findAll({
      where: {
        type: ClinicSettingsEnum.APPT_CHECKIN_NOTIFICATION_BEFORE_APPT_M,
        sentDate: null,
        targetDate: {
          [Op.lte]: new Date(),
        },
      },
      include: [
        {
          model: AppointmentsModel,
          where: {
            appointmentRequestId: null,
          },
        },
        {
          model: AppointmentStatusLookupsModel,
          where: {
            code: [AppointmentStatusEnum.CONFIRM1, AppointmentStatusEnum.CONFIRM2, AppointmentStatusEnum.SCHEDULE],
          },
        },
      ],
    });

    if (cronJobSendCheckinNotificationBeforeAppt.length === 0) {
      return;
    }

    await this.sendNotifications(cronJobSendCheckinNotificationBeforeAppt, EVENT_APPOINTMENT_APPOINTMENT_CHECKIN);

    await this.updateCronJob(cronJobSendCheckinNotificationBeforeAppt);
  }

  sendNotifications(notificationQueue: AppointmentCronJobModel[], eventName) {
    return Promise.all(
      notificationQueue.map(({ appointment, metaData = {} }) => {
        return snsTopic.sendSnsMessage(SCHEDULE_MGMT_TOPIC, {
          eventName,
          source: SCHEDULE_MGMT_TOPIC,
          clinicId: appointment.clinicId,
          patientId: appointment.patientId,
          appointment: {
            appointmentId: appointment.id,
            staffId: appointment.staffId,
            appointmentDateTime: appointment.startDate,
          },
          ...metaData,
        });
      }),
    );
  }

  createJobs(notificationDates: NotificationDates, clinicId: number, appointmentId: number, transaction: Transaction) {
    const cronJobs = [
      {
        type: ClinicSettingsEnum.APPT_CHECKIN_NOTIFICATION_BEFORE_APPT_M,
        targetDate: notificationDates.apptCheckinNotificationBeforeApptDate,
        clinicId,
        appointmentId,
        metaData: {
          apptCheckinBeforeAppt_M: notificationDates.apptCheckinBeforeAppt_M,
        },
      },
      {
        type: ClinicSettingsEnum.NOTIFY_SEC_NOT_CONFIRMED_BEFORE_APPT_H,
        targetDate: notificationDates.notifySecNotConfirmedBeforeApptDate,
        clinicId,
        appointmentId,
        metaData: {
          appointmentThresholdDays: notificationDates.confirmationThresholdForSecDays,
        },
      },
      {
        type: ClinicSettingsEnum.CONFIRM_BEFORE_APPT_H,
        targetDate: notificationDates.confirmBeforeApptDate,
        clinicId,
        appointmentId,
      },
      {
        type: ClinicSettingsEnum.REMIND_BEFORE_APPT_H,
        targetDate: notificationDates.remindBeforeApptDate,
        clinicId,
        appointmentId,
      },
    ];
    return this.AppointmentCronJobRepo.bulkCreate(cronJobs, {
      transaction,
    });
  }

  updateCronJob(cronJobs: AppointmentCronJobAttributes[]) {
    const cronJobIds = cronJobs.map(({ id }) => id);

    return this.AppointmentCronJobRepo.update(
      {
        sentDate: new Date(),
      },
      {
        where: {
          id: cronJobIds,
        },
      },
    );
  }

  deleteCronJob(appointmentId: number, transaction: Transaction) {
    return this.AppointmentCronJobRepo.destroy({
      where: {
        appointmentId,
      },
      transaction,
    });
  }

  async checkIfNotify(appointmentId: number, eventName: ClinicSettingsEnum) {
    const result = await this.AppointmentCronJobRepo.findOne({
      where: {
        appointmentId,
        type: eventName,
        sentDate: {
          [Op.ne]: null,
        },
      },
    });

    return !!result;
  }

  async getSentEvents(appointmentId: number, eventNames: ClinicSettingsEnum[]) {
    const result = await this.AppointmentCronJobRepo.findOne({
      where: {
        appointmentId,
        type: eventNames,
        sentDate: {
          [Op.ne]: null,
        },
      },
    });

    return result;
  }

  async lastEventSent(appointmentId: number) {
    const result = await this.AppointmentCronJobRepo.findAll({
      where: {
        appointmentId,
        sentDate: {
          [Op.not]: null,
        },
      },
    });

    const checkInSent = result.find(({ type }) => type === ClinicSettingsEnum.APPT_CHECKIN_NOTIFICATION_BEFORE_APPT_M);
    const confirm1Sent = result.find(({ type }) => type === ClinicSettingsEnum.CONFIRM_BEFORE_APPT_H);

    if (checkInSent) {
      return {
        actionType: AppointmentActionEnum.CHECK_IN,
        metaData: checkInSent?.metaData,
      };
    } else if (confirm1Sent) {
      return {
        actionType: AppointmentActionEnum.CONFIRM1,
      };
    }

    return false;
  }
}
