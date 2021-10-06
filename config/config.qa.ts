import { Dialect } from 'sequelize/types';

// eslint-disable-next-line complexity
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
  cognito: {
    userPoolId: process.env.userPoolId || 'ca-central-1_P6vKnQ2LG',
    clientId: process.env.clientId || '33qg4ep2bligir0h4l7nbdcjuj',
    region: 'ca-central-1',
  },
  paginationInfo: {
    default: 10,
    max: 100,
  },
});
