'use strict';

const tableName = 'AppointmentStatusHistory';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        tableName,
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          clinic_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
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
          appointment_id: {
            allowNull: false,
            type: Sequelize.INTEGER,
          },
          appointment_status_id: {
            allowNull: false,
            type: Sequelize.INTEGER,
          },
        },
        { transaction: t },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
