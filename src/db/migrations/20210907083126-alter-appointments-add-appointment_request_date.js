'use strict';

const table_name = 'Appointments';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(table_name, 'appointment_request_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(table_name, 'appointment_request_date');
  },
};
