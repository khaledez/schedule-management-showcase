'use strict';

const availabilityTableName = 'Availability';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(availabilityTableName, 'is_occupied', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.sequelize.query(
      `UPDATE ${availabilityTableName} SET is_occupied = 1 WHERE appointment_id IS NOT NULL`,
    );
    await queryInterface.removeColumn(availabilityTableName, 'start_time');
    await queryInterface.removeColumn(availabilityTableName, 'appointment_id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(availabilityTableName, 'start_time', { type: Sequelize.TIME });
    await queryInterface.addColumn(availabilityTableName, 'appointment_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Appointments',
        key: 'id',
      },
    });
    await queryInterface.removeColumn(availabilityTableName, 'is_occupied');
  },
};
