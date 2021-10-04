'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: "Liste D'attente",
        },
        {
          name_en: 'Waitlist',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Céduler',
        },
        {
          name_en: 'Scheduled',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Confirmé',
        },
        {
          name_en: 'Confirmed',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Enregistrée',
        },
        {
          name_en: 'Checked-in',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Prêt',
        },
        {
          name_en: 'Ready',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Compléter',
        },
        {
          name_en: 'Complete',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Canceled',
        },
        {
          name_en: 'Canceled',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Rappelé',
        },
        {
          name_en: 'Reminded',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Visite',
        },
        {
          name_en: 'Visit',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Publié',
        },
        {
          name_en: 'Released',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentStatusLookups',
        {
          name_fr: 'Reprogrammé',
        },
        {
          name_en: 'Rescheduled',
        },
        {
          transaction: t,
        },
      );
    });
  },

  down: (queryInterface, Sequelize) => {},
};
