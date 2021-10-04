'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'AppointmentCancelRescheduleReasonLookup',
        {
          name_fr: 'Changer de médecin',
        },
        {
          name_en: 'Change doctor',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentCancelRescheduleReasonLookup',
        {
          name_fr: 'Médecin indisponible',
        },
        {
          name_en: 'Doctor unavailable',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentCancelRescheduleReasonLookup',
        {
          name_fr: 'Pas de présentation',
        },
        {
          name_en: 'No show up',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentCancelRescheduleReasonLookup',
        {
          name_fr: 'Abandonner la visite',
        },
        {
          name_en: 'Abort visit',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentCancelRescheduleReasonLookup',
        {
          name_fr: 'Le patient ne peut pas le faire',
        },
        {
          name_en: 'Patient cannot make it',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentCancelRescheduleReasonLookup',
        {
          name_fr: 'Libérer le patient',
        },
        {
          name_en: 'Release patient',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentCancelRescheduleReasonLookup',
        {
          name_fr: 'Autre',
        },
        {
          name_en: 'Other',
        },
        {
          transaction: t,
        },
      );
    });
  },

  down: (queryInterface, Sequelize) => {},
};
