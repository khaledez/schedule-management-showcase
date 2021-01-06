import { Dialect } from 'sequelize/types';

export const config = () => ({
  serviceName: 'schedule-management',
  baseURL: undefined,
  port: 3000,
  database: {
    dialect: 'mysql' as Dialect,
    host: process.env.DB_HOST || 'localhost',
    port: +process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'dash',
    logging: false,
    define: {
      timestamps: false,
    },
  },
  cognito: {
    userPoolId: 'us-east-1_bnSDEoZne',
    clientId: '2egoivd9acq1nqhp18upeieubn',
    region: 'us-east-1',
  },

});
