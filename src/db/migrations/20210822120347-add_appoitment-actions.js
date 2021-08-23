'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'AppointmentActionsLookups',
        [
          { name_en: 'Schedule', name_fr: 'Céduler', code: 'SCHEDULE' },
          { name_en: 'First confirmation', name_fr: 'Première Confirmé', code: 'CONFIRM1' },
          { name_en: 'Final confirmation', name_fr: 'Confirmé Finale', code: 'CONFIRM2' },
          { name_en: 'Check in', name_fr: 'Enregistrement', code: 'CHECK_IN' },
          { name_en: 'Ready', name_fr: 'Prêt', code: 'READY' },
          { name_en: 'Release Patient', name_fr: 'Libérer le patient', code: 'RELEASE_PATIENT' },
        ],
        { transaction: t },
      );

      await queryInterface.bulkInsert(
        'AppointmentStatusLookups',
        [{ name_en: 'Released', name_fr: 'Publié', code: 'RELEASED' }],
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        "Delete From AppointmentActionsLookups WHERE CODE in ('SCHEDULE','CONFIRM1','CONFIRM2','CHECK_IN','READY','RELEASE_PATIENT') ",
        { transaction: t },
      );
      await queryInterface.bulkDelete('AppointmentStatusLookups', { code: 'RELEASED' }, { transaction: t });
    });
  },
};
