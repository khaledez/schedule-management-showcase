'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'AppointmentTypesLookups',
      [
        {
          name_en: 'NEW',
          code: 'NEW',
        },
        {
          name_en: 'FUP',
          code: 'FUP',
        },
        {
          name_en: 'FUP+ECG',
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
