'use strict';

const tableName = 'AppointmentStatusHistory';
const columnName = 'previous_appointment_status_id';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        tableName,
        columnName,
        {
          allowNull: true,
          type: Sequelize.INTEGER,
        },
        { transaction: t },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(tableName, columnName);
  },
};
