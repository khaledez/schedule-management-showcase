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
      assigned_doctor_id: {
        type: Sequelize.INTEGER,
      },
      old_appointment_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
      },
      type: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
      },
      priority: {
        type: Sequelize.STRING,
      },
      provisional_date: {
        type: Sequelize.DATE,
      },
      booked_date: {
        type: Sequelize.DATE,
      },
      complains: {
        type: Sequelize.TEXT,
      },
      clinical_notes: {
        type: Sequelize.TEXT,
      },
      rescheduling_reason: {
        type: Sequelize.TEXT,
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
      },
      doctor_reassignment_reason: {
        type: Sequelize.TEXT,
      },
      date_extension_reason: {
        type: Sequelize.TEXT,
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
