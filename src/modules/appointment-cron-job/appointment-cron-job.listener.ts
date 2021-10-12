import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DateTime } from 'luxon';
import { AppointmentCronJobService } from './appointment-cron-job.service';

@Injectable()
export class AppointmentCronJobListener {
  private readonly logger = new Logger(AppointmentCronJobListener.name);
  constructor(private readonly appointmentCronJobService: AppointmentCronJobService) {}

  @OnEvent('handleEveryHourNotification', { async: true }) // every hour
  async handleEveryHourNotification() {
    const startTime = DateTime.now();
    this.logger.log({
      function: 'handleEveryHourNotification',
      message: `start execution hours crons at ${startTime}`,
    });
    try {
      const result = await Promise.allSettled([
        this.appointmentCronJobService.notifyNotConfirmedAppointments(),
        this.appointmentCronJobService.notifyNotRemindedAppointments(),
        this.appointmentCronJobService.notifySecNotConfirmedBeforeAppt(),
      ]);
      const endTime = DateTime.now();
      const diff = endTime.diff(startTime);
      this.logger.log({
        message: `CRON Service executed at ${startTime.toISO()}, EXECUTION TIME: ${
          diff.toObject().milliseconds
        } Milliseconds`,
        result,
      });
    } catch (err) {
      this.logger.log({
        function: 'handleEveryHourNotification',
        err,
      });
    }
  }

  @OnEvent('handleEveryMinuteNotification', { async: true }) // every minute
  async handleEveryMinuteNotification() {
    const startTime = DateTime.now();
    try {
      this.logger.log({
        function: 'handleEveryMinuteNotification',
        message: `start execution hours crons at ${startTime}`,
      });
      await this.appointmentCronJobService.sendCheckinNotificationBeforeAppt();
      const endTime = DateTime.now();
      const diff = endTime.diff(startTime);
      this.logger.log({
        message: `CRON Service executed at ${startTime.toISO()}, EXECUTION TIME: ${
          diff.toObject().milliseconds
        } Milliseconds`,
      });
    } catch (err) {
      this.logger.log({
        function: 'handleEveryMinuteNotification',
        err,
      });
    }
  }
}
