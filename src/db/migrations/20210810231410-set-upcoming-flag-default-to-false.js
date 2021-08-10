'use strict';

const appointmentsTableName = 'Appointments';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.changeColumn(
        appointmentsTableName,
        'upcoming_appointment',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.changeColumn(
        appointmentsTableName,
        'upcoming_appointment',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        { transaction: t },
      );
    });
  },
};
