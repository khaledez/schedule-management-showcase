import { Sequelize } from 'sequelize-typescript';
import { User } from '../user/models/user.model';
import { ConfigService } from '@nestjs/config';
import { Invitation } from '../invitation/models/invitation.model';
import { AddressModel } from '../../common/models';
import { UserRole } from '../user/models/user-role.model';
import { Role } from '../user/models/role.model';
import { SEQUELIZE } from '../../common/constants';
import { getSSMParameterValue } from 'src/utils/ssmGetParameter';

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
      const sequelize = new Sequelize(config);
      sequelize.addModels([User, Invitation, AddressModel, Role, UserRole]);
      // sequelize.addModels([__dirname + '../**/models/*.model{.ts,.js}']);
      await sequelize.sync();
      return sequelize;
    },
    inject: [ConfigService],
  },
];
