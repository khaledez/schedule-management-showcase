'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('DurationMinutesLookups', {
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
        allowNull: false,
        type: Sequelize.STRING,
      },
      name_fr: {
        type: Sequelize.STRING,
      },
      value: {
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

  down: (queryInterface) => {
    return queryInterface.dropTable('DurationMinutesLookups');
  },
};
