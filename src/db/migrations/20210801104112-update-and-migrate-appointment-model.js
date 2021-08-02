'use strict';

const visitModeLookupTableName = 'AppointmentVisitModeLookup';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(visitModeLookupTableName, {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        clinic_id: {
          type: Sequelize.INTEGER,
        },
        name_en: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        name_fr: {
          type: Sequelize.STRING,
        },
        code: {
          type: Sequelize.STRING,
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('now'),
        },
        created_by: {
          type: Sequelize.INTEGER,
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('now'),
        },
        updated_by: {
          type: Sequelize.INTEGER,
        },
        deleted_at: {
          type: Sequelize.DATE,
        },
        deleted_by: {
          type: Sequelize.INTEGER,
        },
      });

      await queryInterface.addColumn(
        'Appointments',
        'start_date',
        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'Appointments',
        'appointment_visit_mode_id',
        {
          type: Sequelize.INTEGER,
          references: {
            model: visitModeLookupTableName,
            key: 'id',
          },
        },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'Appointments',
        'complaints_notes',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t },
      );

      await queryInterface.sequelize.query('UPDATE Appointments SET start_date = date', { transaction: t });
      await queryInterface.changeColumn(
        'Appointments',
        'start_date',
        {
          type: Sequelize.DATE,
          allowNull: false,
        },
        { transaction: t },
      );

      await queryInterface.removeColumn('Appointments', 'appointment_type_name_en', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'appointment_type_name_fr', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'appointment_status_name_en', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'appointment_status_name_fr', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'cancel_reschedule_reason_en', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'cancel_reschedule_reason_fr', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'date', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'start_time', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'mode_code', { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Appointments',
        'cancel_reschedule_reason_fr',
        { type: Sequelize.STRING },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'cancel_reschedule_reason_en',
        { type: Sequelize.STRING },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'appointment_status_name_fr',
        { type: Sequelize.STRING },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'appointment_status_name_en',
        { type: Sequelize.STRING },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'appointment_type_name_fr',
        { type: Sequelize.STRING },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'appointment_type_name_en',
        { type: Sequelize.STRING },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'date',
        { type: Sequelize.DATE, allowNull: false },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'start_time',
        { type: Sequelize.TIME, allowNull: true },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Appointments',
        'mode_code',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t },
      );

      await queryInterface.sequelize.query('UPDATE Appointments SET date = start_date', { transaction: t });

      await queryInterface.removeColumn('Appointments', 'complaints_notes', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'start_date', { transaction: t });
      await queryInterface.removeColumn('Appointments', 'appointment_visit_mode_id', { transaction: t });

      await queryInterface.dropTable(visitModeLookupTableName, { transaction: t });
    });
  },
};
