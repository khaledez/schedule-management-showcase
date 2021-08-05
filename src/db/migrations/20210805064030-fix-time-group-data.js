'use strict';

const timeGroupLookupTableName = 'TimeGroupsLookups';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(timeGroupLookupTableName, 'code', { type: Sequelize.STRING }, { transaction: t });
      await queryInterface.sequelize.query(
        `UPDATE ${timeGroupLookupTableName} SET code = 'MORNING' WHERE name_en = 'Morning'`,
        {
          transaction: t,
        },
      );
      await queryInterface.sequelize.query(
        `UPDATE ${timeGroupLookupTableName} SET code = 'AFTERNOON' WHERE name_en = 'Afternoon'`,
        {
          transaction: t,
        },
      );
      await queryInterface.sequelize.query(
        `UPDATE ${timeGroupLookupTableName} SET code = 'EVENING' WHERE name_en = 'Evening'`,
        {
          transaction: t,
        },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(timeGroupLookupTableName, 'code', { transaction: t });
    });
  },
};
