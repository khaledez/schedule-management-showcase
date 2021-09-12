/* eslint @typescript-eslint/no-var-requires: "off" */
import { ConfigService } from '@nestjs/config';
import { LookupsModel } from 'common/models';
import { AppointmentsModel } from 'modules/appointments/appointments.model';
import { AvailabilityTemplateSlotModel } from 'modules/availability-template/model/availability-template-slot.model';
import { AvailabilityTemplateModel } from 'modules/availability-template/model/availability-template.model';
import { AvailabilityModel } from 'modules/availability/models/availability.model';
import { AppointmentCancelRescheduleReasonLookupModel } from 'modules/lookups/models/appointment-cancel-reschedule-reason.model';
import { AppointmentVisitModeLookupModel } from 'modules/lookups/models/appointment-visit-mode.model';
import { PatientInfoModel } from 'modules/patient-info/patient-info.model';
import { Sequelize } from 'sequelize-typescript';
import { SEQUELIZE } from '../../common/constants';
import { getSSMParameterValue } from '../../utils/ssmGetParameter';
import { EventModel } from '../events/models';
import { AppointmentActionsLookupsModel } from '../lookups/models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { DurationMinutesLookupsModel } from '../lookups/models/duration-minutes.model';
import { TimeGroupsLookupsModel } from '../lookups/models/time-groups.model';
import { AppointmentRequestsModel } from '../appointment-requests/models/appointment-requests.model';
import { AppointmentRequestStatusLookupsModel } from '../lookups/models/appointment-request-status.model';
import { AppointmentRequestTypesLookupsModel } from '../lookups/models/appointment-request-types.model';
import { AppointmentRequestFeatureStatusModel } from '../appointment-requests/models/appointment-requests-feature-status.model';

export const databaseProviders = [
  {
    provide: SEQUELIZE,
    useFactory: async (configService: ConfigService) => {
      const config = configService.get('database');
      const { MYSQL_PASSWORD_PARAMETER, DB_PASSWORD } = process.env;
      // if there is DB_PASSWORD then it will be taken instead of using the ones stored into SSM.
      if (!DB_PASSWORD && MYSQL_PASSWORD_PARAMETER) {
        const password = await getSSMParameterValue(MYSQL_PASSWORD_PARAMETER);
        config.password = password;
      }
      const sequelize = new Sequelize({
        ...config,
      });
      sequelize.addModels([
        AppointmentsModel,
        AvailabilityModel,
        AvailabilityTemplateModel,
        AvailabilityTemplateSlotModel,
        DurationMinutesLookupsModel,
        TimeGroupsLookupsModel,
        AppointmentActionsLookupsModel,
        AppointmentStatusLookupsModel,
        AppointmentTypesLookupsModel,
        AppointmentVisitModeLookupModel,
        AppointmentCancelRescheduleReasonLookupModel,
        LookupsModel,
        PatientInfoModel,
        EventModel,
        AppointmentRequestsModel,
        AppointmentRequestStatusLookupsModel,
        AppointmentRequestTypesLookupsModel,
        AppointmentRequestFeatureStatusModel,
      ]);
      return sequelize;
    },
    inject: [ConfigService],
  },
];
