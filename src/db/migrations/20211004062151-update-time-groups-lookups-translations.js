'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'TimeGroupsLookups',
        {
          name_fr: 'Matin',
        },
        {
          name_en: 'Morning',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'TimeGroupsLookups',
        {
          name_fr: 'Après midi',
        },
        {
          name_en: 'Afternoon',
        },
        {
          transaction: t,
        },
      );
      await queryInterface.bulkUpdate(
        'TimeGroupsLookups',
        {
          name_fr: 'soirée',
        },
        {
          name_en: 'Evening',
        },
        {
          transaction: t,
        },
      );
    });
  },

  down: (queryInterface, Sequelize) => {},
};
