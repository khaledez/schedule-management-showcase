'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'AppointmentRequestStatusLookups',
        {
          name_fr: 'Complété',
        },
        {
          name_en: 'Fullfilled',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentRequestStatusLookups',
        {
          name_fr: 'Annulé',
        },
        {
          name_en: 'Canceled',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentRequestStatusLookups',
        {
          name_fr: 'En attente',
        },
        {
          name_en: 'Pending',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentRequestStatusLookups',
        {
          name_fr: 'Rejeté',
        },
        {
          name_en: 'Rejected',
        },
        {
          transaction: t,
        },
      );
    });
  },

  down: (queryInterface, Sequelize) => {},
};
