'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'AppointmentStatusLookups',
      [
        {
          name_en: 'Wait list',
          name_fr: 'Wait list',
          code: 'WAIT_LIST',
        },
        {
          name_en: 'Schedule',
          name_fr: 'Schedule',
          code: 'SCHEDULE',
        },
        {
          name_en: 'Confirm',
          name_fr: 'Confirm',
          code: 'CONFIRM',
        },
        {
          name_en: 'Check in',
          name_fr: 'Check in',
          code: 'CHECK_IN',
        },
        {
          name_en: 'Ready',
          name_fr: 'Ready',
          code: 'READY',
        },
        {
          name_en: 'Complete',
          name_fr: 'Complete',
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
