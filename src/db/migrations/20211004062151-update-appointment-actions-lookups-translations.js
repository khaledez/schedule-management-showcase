'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Annuler',
        },
        {
          name_en: 'Cancel',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Changer Type',
        },
        {
          name_en: 'Change Type',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Changer Date',
        },
        {
          name_en: 'Change Date',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Changer Médecin',
        },
        {
          name_en: 'Change Doctor',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Recéduler',
        },
        {
          name_en: 'Reschedule',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Céduler',
        },
        {
          name_en: 'Schedule',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Confirmer',
        },
        {
          name_en: 'Confirm',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Rappeler',
        },
        {
          name_en: 'Remind',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Enregistrée',
        },
        {
          name_en: 'Check-in',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
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
        'AppointmentActionsLookups',
        {
          name_fr: 'Libérer le patient',
        },
        {
          name_en: 'Release Patient',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'en cours',
        },
        {
          name_en: 'In progress',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'V. En attente',
        },
        {
          name_en: 'V. Pending',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Recéduler',
        },
        {
          name_en: 'Reactivate',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'AppointmentActionsLookups',
        {
          name_fr: 'Refuser la demande',
        },
        {
          name_en: 'Decline request',
        },
        {
          transaction: t,
        },
      );
    });
  },

  down: (queryInterface, Sequelize) => {},
};
