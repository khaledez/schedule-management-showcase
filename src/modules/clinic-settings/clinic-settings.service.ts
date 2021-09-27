import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLINIC_SETTINGS_REPOSITORY } from 'common/constants';
import { ClinicSettingsEnum } from 'common/enums/clinic-settings.enum';
import { subtractHoursFromJsDate, subtractMinutesFromJsDate } from 'common/helpers/date-time-helpers';
import { ClinicSettingsModel } from './clinic-settings.model';
// eslint-disable-next-line @typescript-eslint/no-var-requires

@Injectable()
export class ClinicSettingsService {
  private readonly logger = new Logger(ClinicSettingsService.name);
  constructor(
    @Inject(CLINIC_SETTINGS_REPOSITORY)
    private readonly clinicSettingsRepo: typeof ClinicSettingsModel,
    private configService: ConfigService,
  ) {}

  getClinicSettings(clinicId: number) {
    return this.clinicSettingsRepo.findOne({
      where: {
        clinicId,
      },
    });
  }

  async prepareCronJobs(clinicId: number, startDate: Date) {
    // get thresholds for clinic
    const clinicSettings = await this.clinicSettingsRepo.findOne({
      where: {
        clinicId,
      },
    });

    const settings = clinicSettings?.settings || {};
    // get settings default settings from config
    if (Object.keys(settings).length === 0) {
      const clinicSettings = this.configService.get('clinicSettings');
      // number for minutes for check-in notification before appointment
      settings[ClinicSettingsEnum.APPT_CHECKIN_NOTIFICATION_BEFORE_APPT_M] =
        clinicSettings.apptCheckinNotificationBeforeAppt_M;

      settings[ClinicSettingsEnum.APPT_CHECKIN_BEFORE_APPT_M] = clinicSettings.apptCheckinBeforeAppt_M;

      settings[ClinicSettingsEnum.NOTIFY_SEC_NOT_CONFIRMED_BEFORE_APPT_H] =
        clinicSettings.notifySecNotConfirmedBeforeAppt_H;

      settings[ClinicSettingsEnum.CONFIRM_BEFORE_APPT_H] = clinicSettings.confirmBeforeAppt_H;

      settings[ClinicSettingsEnum.REMIND_BEFORE_APPT_H] = clinicSettings.remindBeforeAppt_H;
    }

    this.logger.log({
      function: 'prepareCronJobs',
      clinicId,
      startDate,
      settings,
    });

    const apptCheckinNotificationBeforeApptDate = subtractMinutesFromJsDate(
      startDate,
      settings[ClinicSettingsEnum.APPT_CHECKIN_NOTIFICATION_BEFORE_APPT_M],
    );

    const notifySecNotConfirmedBeforeApptDate = subtractHoursFromJsDate(
      startDate,
      settings[ClinicSettingsEnum.NOTIFY_SEC_NOT_CONFIRMED_BEFORE_APPT_H],
    );

    const confirmBeforeApptDate = subtractHoursFromJsDate(
      startDate,
      settings[ClinicSettingsEnum.CONFIRM_BEFORE_APPT_H],
    );

    const remindBeforeApptDate = subtractHoursFromJsDate(startDate, settings[ClinicSettingsEnum.REMIND_BEFORE_APPT_H]);

    const confirmationThresholdForSecDays = Math.round(
      settings[ClinicSettingsEnum.NOTIFY_SEC_NOT_CONFIRMED_BEFORE_APPT_H] / 24,
    );

    return {
      apptCheckinNotificationBeforeApptDate,
      notifySecNotConfirmedBeforeApptDate,
      confirmBeforeApptDate,
      remindBeforeApptDate,
      confirmationThresholdForSecDays,
      apptCheckinBeforeAppt_M: settings[ClinicSettingsEnum.APPT_CHECKIN_BEFORE_APPT_M],
    };
  }
}
