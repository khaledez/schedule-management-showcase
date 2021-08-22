'use strict';

const appointmentsTableName = 'Appointments';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(appointmentsTableName, 'actual_date', 'actual_start_date');
    await queryInterface.removeColumn(appointmentsTableName, 'actual_start_time');
    await queryInterface.addColumn(appointmentsTableName, 'actual_end_date', { type: Sequelize.DATE, allowNull: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(appointmentsTableName, 'actual_end_date');
    await queryInterface.addColumn(appointmentsTableName, 'actual_start_time', {
      type: Sequelize.TIME,
      allowNull: true,
    });
    await queryInterface.renameColumn(appointmentsTableName, 'actual_start_date', 'actual_date');
  },
};
