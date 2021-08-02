'use strict';

const visitModeLookupTableName = 'AppointmentVisitModeLookup';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.changeColumn(
        visitModeLookupTableName,
        'clinic_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t },
      );
      try {
        await queryInterface.removeColumn(visitModeLookupTableName, 'value', { transaction: t });
      } catch (error) {
        // It's OK for this to fail
        console.log('not found column, it is ok', error);
      }
      await queryInterface.bulkInsert(
        visitModeLookupTableName,
        [
          { name_en: 'In Person', name_fr: 'en personne', code: 'IN_PERSON' },
          { name_en: 'Virtual', name_fr: 'virtuel', code: 'VIRTUAL' },
          { name_en: 'Phone', name_fr: 'le téléphone', code: 'PHONE' },
        ],
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(visitModeLookupTableName);
  },
};
