'use strict';

const tableName = 'AppointmentStatusLookups';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(tableName, null, { transaction: t });
      return queryInterface.bulkInsert(
        tableName,
        [
          {
            name_en: 'Wait list',
            name_fr: "Liste  D'attente",
            code: 'WAIT_LIST',
          },
          {
            name_en: 'Schedule',
            name_fr: 'Céduler',
            code: 'SCHEDULE',
          },
          {
            name_en: 'First confirmation',
            name_fr: 'Première Confirmé',
            code: 'CONFIRM1',
          },
          {
            name_en: 'Final confirmation',
            name_fr: 'Confirmé Finale',
            code: 'CONFIRM2',
          },
          {
            name_en: 'Check in',
            name_fr: 'Enregistrement',
            code: 'CHECK_IN',
          },
          {
            name_en: 'Ready',
            name_fr: 'Prêt',
            code: 'READY',
          },
          {
            name_en: 'Complete',
            name_fr: 'Compléter',
            code: 'COMPLETE',
          },
          {
            name_en: 'Canceled',
            name_fr: 'Annulé',
            code: 'CANCELED',
          },
        ],
        { transaction: t },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.transaction(async (t) => {
      await queryInterface.bulkDelete(tableName, {}, null);
      return queryInterface.bulkInsert(
        tableName,
        [
          {
            name_en: 'Wait list',
            name_fr: "Liste  D'attente",
            code: 'WAIT_LIST',
          },
          {
            name_en: 'Schedule',
            name_fr: 'Céduler',
            code: 'SCHEDULE',
          },
          {
            name_en: 'Confirm',
            name_fr: 'Confirmé',
            code: 'CONFIRM',
          },
          {
            name_en: 'Check in',
            name_fr: 'Enregistrement',
            code: 'CHECK_IN',
          },
          {
            name_en: 'Ready',
            name_fr: 'Prêt',
            code: 'READY',
          },
          {
            name_en: 'Complete',
            name_fr: 'Compléter',
            code: 'COMPLETE',
          },
          {
            name_en: 'Canceled',
            name_fr: 'Annulé',
            code: 'CANCELED',
          },
        ],
        { transaction: t },
      );
    });
  },
};
