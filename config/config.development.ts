import { Dialect } from 'sequelize/types';
import { EVENT_EVERY_HOUR_TOPIC, EVENT_EVERY_MINITUE_TOPIC, PATIENT_MGMT_TOPIC, VISIT_MGMT_TOPIC } from '../src/common/constants';

// eslint-disable-next-line complexity
export const config = () => ({
  serviceName: 'schedule-management',
  baseURL: undefined,
  apiURL: 'https://api.dev.monmedx.com',
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
  topicList: [VISIT_MGMT_TOPIC, PATIENT_MGMT_TOPIC, EVENT_EVERY_HOUR_TOPIC, EVENT_EVERY_MINITUE_TOPIC],
  cognito: {
    userPoolId: process.env.userPoolId || 'ca-central-1_QCH72QhGJ',
    clientId: process.env.clientId || '4ot8uiknlo3l77dansic1u2vt3',
    region: 'ca-central-1',
  },
  paginationInfo: {
    default: 10,
    max: 100,
  },
  clinicSettings: {
    apptCheckinNotificationBeforeAppt_M: 15,
    notifySecNotConfirmedBeforeAppt_H: 120,
    apptCheckinBeforeAppt_M: 15,
    appointmentRequestEnabled: true,
    confirmBeforeAppt_H: 168,
    remindBeforeAppt_H: 48,
  },
});
