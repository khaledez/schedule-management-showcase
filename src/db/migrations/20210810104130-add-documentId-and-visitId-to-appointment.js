'use strict';

const appointmentsTableName = 'Appointments';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        appointmentsTableName,
        'visit_id',
        {
          allowNull: true,
          type: Sequelize.INTEGER,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        appointmentsTableName,
        'visit_summary_document_id',
        {
          allowNull: true,
          type: Sequelize.STRING,
        },
        { transaction: t },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(appointmentsTableName, 'visit_id', { transaction: t });
      await queryInterface.removeColumn(appointmentsTableName, 'visit_summary_document_id', { transaction: t });
    });
  },
};
