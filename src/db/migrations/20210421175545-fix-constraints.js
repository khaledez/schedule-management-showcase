'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.changeColumn(
        'Events',
        'invitees',
        { allowNull: true, type: Sequelize.JSON },
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve({});
  },
};
