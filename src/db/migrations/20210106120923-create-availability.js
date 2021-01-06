'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('availability', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      doctor_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      clinic_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      appointment_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      start_time: {
        allowNull: false,
        type: Sequelize.TIME,
      },
      date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      duration_minutes: {
        allowNull: false,
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('availability');
  },
};
