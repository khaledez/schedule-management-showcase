'use strict';

const eventTableName = 'Availability';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn(eventTableName, 'date', 'start_date');
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn(eventTableName, 'start_date', 'date');
  },
};
