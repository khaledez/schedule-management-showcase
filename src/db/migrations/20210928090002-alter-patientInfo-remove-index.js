'use strict';

const PATIENTS_INFO_TABLE = 'PatientInfo';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`ALTER TABLE PatientInfo DROP INDEX display_patient_id`);

    await queryInterface.addIndex(PATIENTS_INFO_TABLE, ['display_patient_id'], {
      name: 'display_patient_id',
    });
  },

  down: async (queryInterface, Sequelize) => {},
};
