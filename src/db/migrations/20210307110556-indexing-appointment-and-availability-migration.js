/* eslint-disable @typescript-eslint/no-unused-vars */
'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      /**
       * add appointments indexing
       */
      await queryInterface.addIndex('Appointments', ['clinic_id'], {
        name: 'clinic_id_idx',
        transaction: t,
      });

      await queryInterface.addIndex('Appointments', ['date'], {
        name: 'date_idx',
        transaction: t,
      });

      await queryInterface.addIndex('Appointments', ['doctor_id'], {
        name: 'doctor_id_idx',
        transaction: t,
      });

      /**
       * add availability indexing
       */
      await queryInterface.addIndex('Availability', ['clinic_id'], {
        name: 'availability_clinic_id_idx',
        transaction: t,
      });

      await queryInterface.addIndex('Availability', ['doctor_id'], {
        name: 'doctor_idx',
        transaction: t,
      });

      await queryInterface.addIndex('Availability', ['date'], {
        name: 'date_idx',
        transaction: t,
      });

      await queryInterface.addIndex('Availability', ['start_time'], {
        name: 'start_time_idx',
        transaction: t,
      });
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      /**
       * remove Appointments indexing
       */
      await queryInterface.removeIndex('Appointments', 'clinic_id_idx', {
        transaction: t,
      });

      await queryInterface.removeIndex('Appointments', 'date_idx', {
        transaction: t,
      });

      /**
       * remove Availability indexing
       */
      await queryInterface.removeIndex('Availability', 'availability_clinic_id_idx', {
        transaction: t,
      });

      await queryInterface.removeIndex('Availability', 'doctor_idx', {
        transaction: t,
      });

      await queryInterface.removeIndex('Availability', 'date_idx', {
        transaction: t,
      });

      await queryInterface.removeIndex('Availability', 'start_time_idx', {
        transaction: t,
      });
    });
  },
};
