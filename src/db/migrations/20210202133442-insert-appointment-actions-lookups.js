'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'AppointmentActionsLookups',
      [
        {
          name_en: 'Cancel',
          code: 'CANCEL',
        },
        {
          name_en: 'Change Type',
          code: 'CHANGE_APPT_TYPE',
        },
        {
          name_en: 'Change Date',
          code: 'CHANGE_DATE',
        },
        {
          name_en: 'Change Doctor',
          code: 'CHANGE_DOCTOR',
        },
        {
          name_en: 'Reschedule Appointment',
          code: 'RESCHEDULE_APPT',
        },
      ],
      {},
    );
  },
  down: (queryInterface) => {
    return queryInterface.bulkDelete('AppointmentActionsLookups', null, {});
  },
};
