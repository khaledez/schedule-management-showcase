'use strict';

const PATIENTS_INFO_TABLE = 'PatientInfo';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE PatientInfo
         ADD display_patient_id VARCHAR(255) AS ( 
          CONCAT(
            ifnull(legacy_id, CONCAT('mmx-', id))
          )
        ) UNIQUE;`,
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(PATIENTS_INFO_TABLE, 'display_patient_id');
  },
};
