'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'AppointmentRequestTypesLookups',
        {
          name_fr: 'Planifier',
          appt_status_name_fr: 'En attente',
        },
        {
          name_en: 'Schedule',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentRequestTypesLookups',
        {
          name_fr: 'Reprogrammer',
          appt_status_name_fr: 'En attente de reprogrammation',
        },
        {
          name_en: 'Reschedule',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentRequestTypesLookups',
        {
          name_fr: 'Annuler',
          appt_status_name_fr: "En attente d'annulation",
        },
        {
          name_en: 'Cancel',
        },
        {
          transaction: t,
        },
      );
    });
  },

  down: (queryInterface, Sequelize) => {},
};
