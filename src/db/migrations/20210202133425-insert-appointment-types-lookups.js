'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'AppointmentTypesLookups',
      [
        {
          name_en: 'NEW',
          name_fr: 'NEW',
          code: 'NEW',
        },
        {
          name_en: 'FUP',
          name_fr: 'FUP',
          code: 'FUP',
        },
        {
          name_en: 'FUP+ECG',
          name_fr: 'FUP+ECG',
          code: 'FUP+ECG',
        },
      ],
      {},
    );
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('AppointmentTypesLookups', null, {});
  },
};
