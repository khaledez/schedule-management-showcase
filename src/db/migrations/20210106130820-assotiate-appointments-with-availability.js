'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Appointments', 'availability_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Availability',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Appointments', 'availability_id');
  },
};
