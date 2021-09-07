'use strict';

const actions_tableName = 'AppointmentActionsLookups';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.bulkInsert(
          actions_tableName,
          [{ name_en: 'Reactivate', name_fr: 'Réactiver', code: 'REACTIVATE' }],
          { transaction: t },
        ),
      ]);
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(actions_tableName, { code: 'REACTIVATE' }, { transaction: t });
    });
  },
};
