'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const appointmentStatus = [
        {
          name_fr: "Liste  D'attente",
          code: 'WAIT_LIST',
        },
        {
          name_fr: 'Céduler',
          code: 'SCHEDULE',
        },
        {
          name_fr: 'Confirmé',
          code: 'CONFIRM',
        },
        {
          name_fr: 'Enregistrement',
          code: 'CHECK_IN',
        },
        {
          name_fr: 'Prêt',
          code: 'READY',
        },
        {
          name_fr: 'Compléter',
          code: 'COMPLETE',
        },
      ];

      for (const { code, name_fr } of appointmentStatus) {
        await queryInterface.sequelize.query(
          `UPDATE AppointmentStatusLookups SET name_fr = "${name_fr}" WHERE code="${code}"`,
          {
            type: Sequelize.QueryTypes.UPDATE,
            transaction: t,
          },
        );
      }

      const appointmentActions = [
        {
          name_fr: 'Annuler',
          code: 'CANCEL',
        },
        {
          name_fr: 'Changer Type',
          code: 'CHANGE_APPT_TYPE',
        },
        {
          name_fr: 'Changer Date',
          code: 'CHANGE_DATE',
        },
        {
          name_fr: 'Changer Médecin',
          code: 'CHANGE_DOCTOR',
        },
        {
          name_fr: 'Recéduler Rendez-vous',
          code: 'RESCHEDULE_APPT',
        },
      ];

      for (const { code, name_fr } of appointmentActions) {
        await queryInterface.sequelize.query(
          `UPDATE AppointmentActionsLookups SET name_fr = "${name_fr}" WHERE code="${code}"`,
          {
            type: Sequelize.QueryTypes.UPDATE,
            transaction: t,
          },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
