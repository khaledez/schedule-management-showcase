'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Appointments',
        'end_date',
        {
          allowNull: true,
          type: Sequelize.DATE,
        },
        { transaction: t },
      );
      //
      await queryInterface.addColumn(
        'Appointments',
        'start_time',
        {
          allowNull: true,
          type: Sequelize.TIME,
        },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'Appointments',
        'duration_minutes',
        {
          allowNull: true,
          type: Sequelize.INTEGER,
        },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'Appointments',
        'appointment_type_name_en',
        {
          allowNull: true,
          type: Sequelize.STRING,
        },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'Appointments',
        'appointment_type_name_fr',
        {
          allowNull: true,
          type: Sequelize.STRING,
        },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'Appointments',
        'actual_date',
        {
          allowNull: true,
          type: Sequelize.DATE,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'actual_start_time',
        {
          allowNull: true,
          type: Sequelize.TIME,
        },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'Appointments',
        'appointment_status_name_en',
        {
          allowNull: true,
          type: Sequelize.STRING,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'appointment_status_name_fr',
        {
          allowNull: true,
          type: Sequelize.STRING,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'cancel_reschedule_reason_en',
        {
          allowNull: true,
          type: Sequelize.STRING,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'cancel_reschedule_reason_fr',
        {
          allowNull: true,
          type: Sequelize.STRING,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'mode_code',
        {
          allowNull: true,
          type: Sequelize.STRING,
        },
        { transaction: t },
      );
      await queryInterface.renameColumn('Appointments', 'doctor_id', 'staff_id', { transaction: t });
      await queryInterface.renameColumn('Availability', 'doctor_id', 'staff_id', { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Appointments', 'start_time', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'duration_minutes', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'appointment_type_name_en', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'appointment_type_name_fr', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'actual_date', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'actual_start_time', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'appointment_status_name_en', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'appointment_status_name_fr', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'cancel_reschedule_reason_en', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'cancel_reschedule_reason_fr', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'mode_code', { transaction: t });
      await queryInterface.renameColumn('Appointments', 'staff_id', 'doctor_id', { transaction: t });
      await queryInterface.renameColumn('Availability', 'staff_id', 'doctor_id', { transaction: t });
    });
  },
};
