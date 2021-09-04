import { Dialect } from 'sequelize/types';
import { PATIENT_MGMT_TOPIC, VISIT_MGMT_TOPIC } from '../src/common/constants';

export const config = () => ({
  serviceName: 'schedule-management',
  apiURL: 'https://api.qa.monmedx.com',
  port: 3000,
  database: {
    dialect: 'mysql' as Dialect,
    host: process.env.DB_HOST || 'localhost',
    port: +process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'dash',
    benchmark: true,
    // eslint-disable-next-line no-console
    logging: console.log,
    define: {
      timestamps: false,
      underscored: true,
    },
    pool: {
      max: 10,
      min: 2,
    },
  },
  topicList: [VISIT_MGMT_TOPIC, PATIENT_MGMT_TOPIC],
  cognito: {
      userPoolId: process.env.userPoolId ||'ca-central-1_QdrFL8ZgJ',
      clientId: process.env.clientId ||'pjlj97r3fkhoibcv2t7ln8doi',
      region: 'ca-central-1',
  },
  paginationInfo: {
    default: 10,
    max: 100,
  },
});
