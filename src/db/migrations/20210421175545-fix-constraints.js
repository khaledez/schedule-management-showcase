'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Events', 'invitees', { allowNull: true, type: Sequelize.JSON });
  },

  down: (queryInterface, Sequelize) => {
    return;
  },
};
