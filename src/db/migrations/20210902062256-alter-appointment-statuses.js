'use strict';

const tableName = 'AppointmentStatusLookups';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        tableName,
        'in_transit',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `UPDATE ${tableName} SET in_transit = true  WHERE code in ('CANCELED','COMPLETE')`,
        {
          transaction: t,
        },
      );
      await queryInterface.bulkInsert(
        tableName,
        [
          {
            name_en: 'Rescheduled',
            name_fr: 'Reprogrammé',
            code: 'RESCHEDULED',
            in_transit: true,
          },
        ],
        { transaction: t },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(tableName, 'in_transit');
      await queryInterface.bulkDelete(tableName, { code: 'RESCHEDULED' }, { transaction: t });
    });
  },
};
