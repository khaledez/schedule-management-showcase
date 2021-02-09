'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'TimeGroupsLookups',
      [
        {
          name_en: 'Morning',
          name_fr: 'Matin',
          start_time: '08:00',
          end_time: '11:00',
        },
        {
          name_en: 'Afternoon',
          name_fr: 'Après midi',
          start_time: '11:00',
          end_time: '15:00',
        },
        {
          name_en: 'Evening',
          name_fr: 'soirée',
          start_time: '15:00',
          end_time: '17:00',
        },
      ],
      {},
    );
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('TimeGroupsLookups', null, {});
  },
};
