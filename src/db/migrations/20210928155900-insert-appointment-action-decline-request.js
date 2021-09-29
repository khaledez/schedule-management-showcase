'use strict';

const actions_tableName = 'AppointmentActionsLookups';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.bulkInsert(
          actions_tableName,
          [{ name_en: 'Decline request', name_fr: 'Refuser la demande', code: 'DECLINE_REQUEST' }],
          { transaction: t },
        ),
      ]);
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(actions_tableName, { code: 'DECLINE_REQUEST' }, { transaction: t });
    });
  },
};
