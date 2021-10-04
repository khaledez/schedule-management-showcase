'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'AppointmentVisitModeLookup',
        {
          name_fr: 'en personne',
        },
        {
          name_en: 'In Person',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentVisitModeLookup',
        {
          name_fr: 'virtuel',
        },
        {
          name_en: 'Virtual',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentVisitModeLookup',
        {
          name_fr: 'le téléphone',
        },
        {
          name_en: 'Phone',
        },
        {
          transaction: t,
        },
      );
    });
  },

  down: (queryInterface, Sequelize) => {},
};
