import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLINIC_SETTINGS_REPOSITORY } from 'common/constants';
import { ClinicSettingsEnum } from 'common/enums/clinic-settings.enum';
import { subtractHoursFromJsDate, subtractMinutesFromJsDate } from 'common/helpers/date-time-helpers';
import { ClinicSettingsModel } from './clinic-settings.model';
import { IUserPrincipal } from '@monmedx/monmedx-common';
import { Op } from 'sequelize';

@Injectable()
export class ClinicSettingsService {
  private readonly logger = new Logger(ClinicSettingsService.name);
  constructor(
    @Inject(CLINIC_SETTINGS_REPOSITORY)
    private readonly clinicSettingsRepo: typeof ClinicSettingsModel,
    private configService: ConfigService,
  ) {}

  async getClinicSettings(principal: IUserPrincipal) {
    const { clinicIds } = principal.user;
    const setting = await this.clinicSettingsRepo.findOne({
      where: {
        clinicId: {
          [Op.or]: [...clinicIds, null],
        },
      },
      order: [['id', 'desc']],
    });
    return { data: setting };
  }

  async getClinicSettingsByClinicId(clinicId: number) {
    const setting = await this.clinicSettingsRepo.findOne({
      where: {
        clinicId: {
          [Op.or]: [clinicId, null],
        },
      },
      order: [['id', 'desc']],
    });
    return setting;
  }

  async prepareCronJobs(clinicId: number, startDate: Date) {
    // get thresholds for clinic
    const clinicSettings = await this.getClinicSettingsByClinicId(clinicId);
    const settings = clinicSettings.settings;

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
