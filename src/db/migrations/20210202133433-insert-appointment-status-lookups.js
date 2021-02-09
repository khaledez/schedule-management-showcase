'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'AppointmentStatusLookups',
      [
        {
          name_en: 'Wait list',
          code: 'WAIT_LIST',
        },
        {
          name_en: 'Schedule',
          code: 'SCHEDULE',
        },
        {
          name_en: 'Confirm',
          code: 'CONFIRM',
        },
        {
          name_en: 'Check in',
          code: 'CHECK_IN',
        },
        {
          name_en: 'Ready',
          code: 'READY',
        },
        {
          name_en: 'Complete',
          code: 'COMPLETE',
        },
      ],
      {},
    );
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('AppointmentStatusLookups', null, {});
  },
};
