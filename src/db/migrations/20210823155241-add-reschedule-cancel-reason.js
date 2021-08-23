'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'AppointmentCancelReschduleReasonLookup',
        [{ name_en: 'Reschedule Appointment', name_fr: 'Re-planifier un rendez-vous', code: 'RESCHEDULE' }],
        { transaction: t },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('AppointmentCancelReschduleReasonLookup', { code: 'RESCHEDULE' });
  },
};
