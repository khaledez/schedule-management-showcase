'use strict';

const table_name = 'Appointments';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface
      .addColumn(table_name, 'request_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      })
      .then(() => queryInterface.addIndex(table_name, ['request_id']));
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(table_name, 'request_id');
  },
};
