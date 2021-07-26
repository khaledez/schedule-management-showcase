import { config as devConfigFn } from './config.development';
const devConfig = devConfigFn();
export const config = () => ({
  ...devConfig,
  database: {
    ...devConfig.database,
    database: 'schedule-management-test',
  },
});
