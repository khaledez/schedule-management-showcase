'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'AppointmentStatusLookups',
      [
        {
          name_en: 'Canceled',
          name_fr: 'Canceled',
          code: 'CANCELED',
        },
      ],
      {},
    );
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('AppointmentStatusLookups', { code: ['CANCELED'] }, {});
  },
};
