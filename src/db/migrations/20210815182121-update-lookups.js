'use strict';

const tableName = 'AppointmentStatusLookups';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `UPDATE ${tableName} SET code = 'SCHEDULE', name_en = 'Scheduled', name_fr = 'Céduler' WHERE code = 'SCHEDULE'`,
        { transaction: t },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `UPDATE ${tableName} SET code = 'SCHEDULE', name_en = 'Schedule', name_fr = 'Céduler' WHERE code = 'SCHEDULE'`,
        { transaction: t },
      );
    });
  },
};
