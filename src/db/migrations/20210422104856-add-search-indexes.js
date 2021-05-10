'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex('Events', ['date'], { name: 'date', transaction: t });
      await queryInterface.changeColumn(
        'Events',
        'staff_id',
        { allowNull: false, type: Sequelize.INTEGER },
        { transaction: t },
      );
      await queryInterface.addIndex('Events', ['staff_id'], { name: 'staff_id', transaction: t });
      await queryInterface.addIndex('Events', ['clinic_id'], { name: 'clinic_id', transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex('Events', 'date', { transaction: t });
      await queryInterface.removeIndex('Events', 'staff_id', { transaction: t });
      await queryInterface.removeIndex('Events', 'clinic_id', { transaction: t });
    });
  },
};
