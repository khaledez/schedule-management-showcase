'use strict';

const tableName = 'AppointmentRequestTypesLookups';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        tableName,
        'appt_status_name_en',
        {
          type: Sequelize.STRING,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        tableName,
        'appt_status_name_fr',
        {
          type: Sequelize.STRING,
        },
        { transaction: t },
      );

      await Promise.all([
        queryInterface.sequelize.query(
          `UPDATE ${tableName} SET appt_status_name_en = 'Pending', appt_status_name_fr = 'Pending'   WHERE code = 'SCHEDULE'`,
          {
            transaction: t,
          },
        ),
        queryInterface.sequelize.query(
          `UPDATE ${tableName} SET appt_status_name_en = 'Pending Rescheduling', appt_status_name_fr = 'Pending Rescheduling'   WHERE code = 'RESCHEDULE'`,
          {
            transaction: t,
          },
        ),
        queryInterface.sequelize.query(
          `UPDATE ${tableName} SET appt_status_name_en = 'Pending Cancellation', appt_status_name_fr = 'Pending Cancellation'   WHERE code = 'CANCEL'`,
          {
            transaction: t,
          },
        ),
      ]);
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(tableName, 'appt_status_name_en');
      await queryInterface.removeColumn(tableName, 'appt_status_name_fr');
    });
  },
};
