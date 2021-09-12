'use strict';

const tableName = 'AppointmentRequestFeatureStatus';
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
          doctor_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          enabled: {
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
        },
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE ${tableName}
         ADD uniq_feature_status VARCHAR(255) AS (
          CONCAT(
            clinic_id,'|',ifnull(doctor_id, 0), '|',ifnull(deleted_at, 0)
          )
        ) UNIQUE;`,
        { transaction: t },
      );

      await queryInterface.addIndex(tableName, ['clinic_id'], { transaction: t });
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
