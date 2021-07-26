/* eslint @typescript-eslint/no-var-requires: "off" */
import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';
import { SEQUELIZE } from '../../common/constants';
import { LookupsModel } from '../../common/models/lookup.model';
import { getSSMParameterValue } from '../../utils/ssmGetParameter';
import { AppointmentsModel } from '../appointments/models/appointments.model';
import { PatientsModel } from '../appointments/models/patients.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { EventModel } from '../events/models';
import { AppointmentActionsLookupsModel } from '../lookups/models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { DurationMinutesLookupsModel } from '../lookups/models/duration-minutes.model';
import { TimeGroupsLookupsModel } from '../lookups/models/time-groups.model';

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
        DurationMinutesLookupsModel,
        TimeGroupsLookupsModel,
        AppointmentActionsLookupsModel,
        AppointmentStatusLookupsModel,
        AppointmentTypesLookupsModel,
        LookupsModel,
        PatientsModel,
        EventModel,
      ]);
      return sequelize;
    },
    inject: [ConfigService],
  },
];
