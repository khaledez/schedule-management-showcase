'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface
        .addColumn('Appointments', 'end_date', {
          allowNull: false,
          type: Sequelize.DATE,
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'start_time', {
            allowNull: false,
            type: Sequelize.TIME,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'duration_minutes', {
            allowNull: false,
            type: Sequelize.INTEGER,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'appointment_type_name_en', {
            allowNull: true,
            type: Sequelize.STRING,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'appointment_type_name_fr', {
            allowNull: true,
            type: Sequelize.STRING,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'actual_date', {
            allowNull: true,
            type: Sequelize.DATE,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'actual_start_time', {
            allowNull: true,
            type: Sequelize.TIME,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'appointment_status_name_en', {
            allowNull: true,
            type: Sequelize.STRING,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'appointment_status_name_fr', {
            allowNull: true,
            type: Sequelize.STRING,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'cancel_reschedule_reason_en', {
            allowNull: true,
            type: Sequelize.STRING,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'cancel_reschedule_reason_fr', {
            allowNull: true,
            type: Sequelize.STRING,
          });
        })
        .then(() => {
          queryInterface.addColumn('Appointments', 'mode_code', {
            allowNull: true,
            type: Sequelize.STRING,
          });
        })
        .then(() => {
          queryInterface.renameColumn('Appointments', 'doctor_id', 'staff_id');
        }),
      queryInterface.renameColumn('Availability', 'doctor_id', 'staff_id'),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface
        .removeColumn('Appointments', 'end_date')
        .then(() => {
          queryInterface.removeColumn('Appointments', 'start_time');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'duration_minutes');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'appointment_type_name_en');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'appointment_type_name_fr');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'actual_date');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'actual_start_time');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'appointment_status_name_en');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'appointment_status_name_fr');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'cancel_reschedule_reason_en');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'cancel_reschedule_reason_fr');
        })
        .then(() => {
          queryInterface.removeColumn('Appointments', 'mode_code');
        })
        .then(() => {
          queryInterface.renameColumn('Appointments', 'staff_id', 'doctor_id');
        }),

      queryInterface.renameColumn('Availability', 'staff_id', 'doctor_id'),
    ]);
  },
};
