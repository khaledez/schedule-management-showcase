'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'AppointmentCancelReschduleReasonLookup',
        [{ name_en: 'Visit aborted', name_fr: 'visite avortée', code: 'ABORT_VISIT' }],
        { transaction: t },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('AppointmentCancelReschduleReasonLookup', { code: 'ABORT_VISIT' });
  },
};
