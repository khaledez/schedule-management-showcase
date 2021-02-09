'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'DurationMinutesLookups',
      [
        {
          name_en: '15 Mins',
          name_fr: '15 Mins',
          value: 15,
        },
        {
          name_en: '30 Mins',
          name_fr: '30 Mins',
          value: 30,
        },
        {
          name_en: '45 Mins',
          name_fr: '45 Mins',
          value: 45,
        },
      ],
      {},
    );
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('DurationMinutesLookups', null, {});
  },
};
