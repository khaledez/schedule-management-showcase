'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Appointments', 'appointment_type_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'AppointmentTypesLookups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      }),
      queryInterface.changeColumn('Appointments', 'appointment_status_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'AppointmentStatusLookups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      }),
      queryInterface.changeColumn(
        'Appointments',
        'cancel_reschedule_reason_id',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'AppointmentActionsLookups',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'NO ACTION',
        },
      ),
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.changeColumn('Appointments', 'appointment_type_id'),
      queryInterface.changeColumn('Appointments', 'appointment_status_id'),
      queryInterface.changeColumn(
        'Appointments',
        'cancel_reschedule_reason_id',
      ),
    ]);
  },
};
