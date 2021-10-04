'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'AppointmentTypesLookups',
        {
          name_fr: 'Consultation',
        },
        {
          name_en: 'Consultation',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentTypesLookups',
        {
          name_fr: 'Visite de contrôle',
        },
        {
          name_en: 'Control Visit',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentTypesLookups',
        {
          name_fr: 'Visite principale',
        },
        {
          name_en: 'Principal Visit',
        },
        {
          transaction: t,
        },
      );
    });
  },

  down: (queryInterface, Sequelize) => {},
};
