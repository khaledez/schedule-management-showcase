'use strict';

const tableName = 'AppointmentStatusLookups';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `UPDATE ${tableName} SET code = 'CONFIRM1', name_en = 'First confirmation', name_fr = 'Première Confirmé' WHERE code = 'CONFIRM'`,
        { transaction: t },
      );
      await queryInterface.bulkInsert(
        tableName,
        [
          {
            name_en: 'Final confirmation',
            name_fr: 'Confirmé Finale',
            code: 'CONFIRM2',
          },
        ],
        { transaction: t },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `UPDATE ${tableName} SET code = 'CONFIRM', name_en = 'confirm', name_fr = 'Confirmé' WHERE code = 'CONFIRM1'`,
        { transaction: t },
      );
      await queryInterface.bulkDelete(tableName, { code: 'CONFIRM2' }, { transaction: t });
    });
  },
};
