'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'AppointmentActionsLookups',
      [
        {
          name_en: 'Cancel',
          name_fr: 'Cancel',
          code: 'CANCEL',
        },
        {
          name_en: 'Change Type',
          name_fr: 'Change Type',
          code: 'CHANGE_APPT_TYPE',
        },
        {
          name_en: 'Change Date',
          name_fr: 'Change Date',
          code: 'CHANGE_DATE',
        },
        {
          name_en: 'Change Doctor',
          name_fr: 'Change Doctor',
          code: 'CHANGE_DOCTOR',
        },
        {
          name_en: 'Reschedule Appointment',
          name_fr: 'Reschedule Appointment',
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
