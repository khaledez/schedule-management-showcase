'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        "UPDATE AppointmentVisitModeLookup SET CODE = 'IN-PERSON' WHERE CODE = 'IN_PERSON'",
        { transaction: t },
      );
      await queryInterface.bulkInsert(
        'AppointmentStatusLookups',
        [{ name_en: 'In Progress', name_fr: 'en cours', code: 'IN_PROGRESS' }],
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        "UPDATE AppointmentVisitModeLookup SET CODE = 'IN_PERSON' WHERE CODE = 'IN-PERSON'",
        { transaction: t },
      );
      await queryInterface.bulkDelete('AppointmentStatusLookups', { code: 'IN_PROGRESS' }, { transaction: t });
    });
  },
};
