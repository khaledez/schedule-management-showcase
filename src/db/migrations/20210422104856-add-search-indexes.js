'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addIndex('Events', ['date'], { name: 'date' })
      .then(() => {
        return queryInterface.changeColumn('Events', 'staff_id', { allowNull: false, type: Sequelize.INTEGER });
      })
      .then(() => {
        return queryInterface.addIndex('Events', ['staff_id'], { name: 'staff_id' });
      })
      .then(() => {
        return queryInterface.addIndex('Events', ['clinic_id'], { name: 'clinic_id' });
      });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeIndex('Events', 'date'),
      queryInterface.removeIndex('Events', 'staff_id'),
      queryInterface.removeIndex('Events', 'clinic_id'),
    ]);
  },
};
