'use strict';

const tableName = 'AppointmentRequestStatusLookups';
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
          },
          name_en: {
            type: Sequelize.STRING,
          },
          name_fr: {
            type: Sequelize.STRING,
          },
          code: {
            allowNull: false,
            type: Sequelize.STRING(32),
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

      await queryInterface.addIndex(tableName, ['clinic_id'], { transaction: t });
      await queryInterface.addIndex(tableName, ['code'], { transaction: t });
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
