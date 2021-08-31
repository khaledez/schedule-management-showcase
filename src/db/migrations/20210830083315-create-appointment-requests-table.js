'use strict';
const tableName = 'AppointmentRequests';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable(tableName, {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        clinic_id: {
          type: Sequelize.INTEGER,
        },
        user_id: {
          type: Sequelize.INTEGER,
        },
        patient_id: {
          type: Sequelize.INTEGER,
        },
        doctor_id: {
          type: Sequelize.INTEGER,
        },
        appoitment_id: {
          type: Sequelize.INTEGER,
        },
        time_group_id: {
          type: Sequelize.INTEGER,
        },
        appointment_visit_mode_id: {
          type: Sequelize.INTEGER,
        },
        appointment_type_id: {
          type: Sequelize.INTEGER,
        },
        request_status_id: {
          type: Sequelize.INTEGER,
        },
        request_type_id: {
          type: Sequelize.INTEGER,
        },
        original_appointment_id: {
          type: Sequelize.INTEGER,
        },
        fullfillment_appointment_id: {
          type: Sequelize.INTEGER,
        },
        date: {
          allowNull: false,
          type: Sequelize.TIME,
        },
        time: {
          allowNull: false,
          type: Sequelize.TIME,
        },

        complaints: {
          allowNull: true,
          type: Sequelize.STRING,
        },
        request_reason: {
          type: Sequelize.STRING,
        },
        rejection_reason: {
          type: Sequelize.STRING,
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('now'),
        },
        created_by: {
          type: Sequelize.INTEGER,
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('now'),
        },
        updated_by: {
          type: Sequelize.INTEGER,
        },
        deleted_at: {
          type: Sequelize.DATE,
        },
        deleted_by: {
          type: Sequelize.INTEGER,
        },
      })
      .then(
        () => queryInterface.addIndex(tableName, ['clinic_id']),
        queryInterface.addIndex(tableName, ['patient_id']),
        queryInterface.addIndex(tableName, ['original_appointment_id']),
      );
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
