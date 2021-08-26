'use strict';

const eventTableName = 'Events';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn(eventTableName, 'start_time');
    await queryInterface.renameColumn(eventTableName, 'date', 'start_date');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(eventTableName, 'start_time', Sequelize.TIME);
    await queryInterface.renameColumn(eventTableName, 'start_date', 'date');
  },
};
