'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('appointments', 'availability_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'availability',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('appointments', 'availability_id');
  },
};
