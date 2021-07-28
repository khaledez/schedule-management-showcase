'use strict';

const PATIENTS_INFO_TABLE = 'PatientInfo';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // 1. Create table
      await queryInterface.createTable(
        PATIENTS_INFO_TABLE,
        {
          id: {
            allowNull: false,
            autoIncrement: false,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          clinic_id: {
            allowNull: false,
            type: Sequelize.INTEGER,
          },
          primary_health_plan_number: {
            allowNull: false,
            type: Sequelize.STRING(128),
          },
          full_name: {
            allowNull: false,
            type: Sequelize.STRING(512),
          },
          dob: {
            type: Sequelize.DATEONLY,
            allowNull: false,
          },
          status_code: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
        },
        { transaction: t },
      );

      await queryInterface.addIndex(PATIENTS_INFO_TABLE, ['clinic_id'], { name: 'clinic_id', transaction: t });
      await queryInterface.addIndex(PATIENTS_INFO_TABLE, ['primary_health_plan_number'], {
        name: 'primary_health_plan_number',
        transaction: t,
      });
      await queryInterface.addIndex(PATIENTS_INFO_TABLE, ['full_name'], { name: 'full_name', transaction: t });
      await queryInterface.addIndex(PATIENTS_INFO_TABLE, ['dob'], { name: 'dob', transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex(PATIENTS_INFO_TABLE, 'clinic_id', { transaction: t });
      await queryInterface.removeIndex(PATIENTS_INFO_TABLE, 'primary_health_plan_number', { transaction: t });
      await queryInterface.removeIndex(PATIENTS_INFO_TABLE, 'full_name', { transaction: t });
      await queryInterface.removeIndex(PATIENTS_INFO_TABLE, 'dob', { transaction: t });
      await queryInterface.dropTable(PATIENTS_INFO_TABLE);
    });
  },
};
