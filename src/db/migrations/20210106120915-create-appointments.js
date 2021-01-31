'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('appointments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      patient_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      clinic_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      doctor_id: {
        type: Sequelize.INTEGER,
      },
      prev_appointment_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
      },
      appointment_type_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      appointment_status_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      provisional_date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      cancel_reschedule_text: {
        type: Sequelize.TEXT,
      },
      cancel_reschedule_reason_id: {
        type: Sequelize.INTEGER,
      },
      upcoming_appointment: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
      canceled_at: {
        type: Sequelize.DATE,
      },
      canceled_by: {
        type: Sequelize.INTEGER,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
      deleted_by: {
        type: Sequelize.INTEGER,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('appointments');
  },
};
