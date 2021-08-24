'use strict';

const PATIENTS_INFO_TABLE = 'PatientInfo';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(PATIENTS_INFO_TABLE, 'doctor_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(PATIENTS_INFO_TABLE, 'doctor_id');
  },
};
