import { Dialect } from 'sequelize/types';

export const config = () => ({
  serviceName: 'schedule-management',
  baseURL: undefined,
  apiURL: "https://api.dev.monmedx.com",
  port: 3000,
  database: {
    dialect: 'mysql' as Dialect,
    host: process.env.DB_HOST || 'localhost',
    port: +process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'dash',
    define: {
      timestamps: false,
      underscored: true,
    },
    pool: {
      min: 5,
      max: 30,
      idle: 20000,
    },
  },
  cognito: {
    userPoolId: 'ca-central-1_QdrFL8ZgJ',
    clientId: 'pjlj97r3fkhoibcv2t7ln8doi',
    region: 'ca-central-1',
  },
  paginationInfo: {
    default: 10,
    max: 100
  }
});
