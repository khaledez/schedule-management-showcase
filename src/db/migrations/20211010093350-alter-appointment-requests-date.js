'use strict';

const tableName = 'AppointmentRequests';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(tableName, 'date', {
      type: Sequelize.DATEONLY,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(tableName, 'date', {
      type: Sequelize.TIME,
    });
  },
};
