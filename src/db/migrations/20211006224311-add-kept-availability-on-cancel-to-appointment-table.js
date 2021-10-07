'use strict';

const tableName = 'Appointments';
const columnName = 'kept_availability_on_cancel';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        tableName,
        columnName,
        {
          allowNull: true,
          type: Sequelize.BOOLEAN,
        },
        { transaction: t },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(tableName, columnName);
  },
};
