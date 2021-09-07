'use strict';

const tableName = 'AppointmentRequests';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(tableName, 'appoitment_id');
      await queryInterface.changeColumn(
        tableName,
        'time',
        {
          allowNull: true,
          type: Sequelize.TIME,
        },
        { transaction: t },
      );
      await queryInterface.renameColumn('Appointments', 'request_id', 'appointment_request_id', { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        tableName,
        'appoitment_id',
        {
          type: Sequelize.INTEGER,
        },
        { transaction: t },
      );
      await queryInterface.changeColumn(
        tableName,
        'time',
        {
          allowNull: false,
          type: Sequelize.TIME,
        },
        { transaction: t },
      );
      await queryInterface.renameColumn('Appointments', 'appointment_request_id', 'request_id', { transaction: t });
    });
  },
};
