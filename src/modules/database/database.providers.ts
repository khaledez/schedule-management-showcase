/* eslint @typescript-eslint/no-var-requires: "off" */
import { Sequelize } from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import { SEQUELIZE } from '../../common/constants';
import { getSSMParameterValue } from 'src/utils/ssmGetParameter';
import { AppointmentsModel } from '../appointments/models/appointments.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { DurationMinutesLookupsModel } from '../lookups/models/duration-minutes.model';
import { TimeGroupsLookupsModel } from '../lookups/models/time-groups.model';
import { AppointmentActionsLookupsModel } from '../lookups/models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { LookupsModel } from '../../common/models/lookup.model';
import { PatientsModel } from '../appointments/models/patients.model';
import { EventModel } from '../events/models';
const AWSXRay = require('aws-xray-sdk');
AWSXRay.captureHTTPsGlobal(require('https'));

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
        // dialectModule: AWSXRay.captureMySQL(require('mysql2')),
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
      // sequelize.addModels([__dirname + '../**/models/*.model{.ts,.js}']);
      // await sequelize.sync();
      return sequelize;
    },
    inject: [ConfigService],
  },
];
