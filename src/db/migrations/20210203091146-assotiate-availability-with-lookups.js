'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Availability', 'appointment_type_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'AppointmentTypesLookups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      }),
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.changeColumn('Availability', 'appointment_type_id'),
    ]);
  },
};
