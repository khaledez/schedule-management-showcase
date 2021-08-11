'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.changeColumn(
        'Availability',
        'staff_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `DELETE FROM Events WHERE appointment_id IS NOT NULL AND availability_id IS NOT NULL`,
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve(null);
  },
};
