'use strict';

const table_name = 'AppointmentRequests';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(table_name, 'date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(table_name, 'date', {
      type: Sequelize.TIME,
      allowNull: true,
    });
  },
};
