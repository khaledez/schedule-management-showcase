const cancelRescheduleReasonLookups = 'AppointmentCancelReschduleReasonLookup';
const cancelRescheduleReasonLookupsNoTypo = 'AppointmentCancelRescheduleReasonLookup';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable(cancelRescheduleReasonLookups, cancelRescheduleReasonLookupsNoTypo, {
        transaction: t,
      });
      await queryInterface.bulkDelete(cancelRescheduleReasonLookupsNoTypo, null, {});
      await queryInterface.bulkInsert(
        cancelRescheduleReasonLookupsNoTypo,
        [
          { name_en: 'Change doctor', name_fr: 'Changer de médecin', code: 'CHANGE_DOCTOR' },
          { name_en: 'Doctor unavailable', name_fr: 'Médecin indisponible', code: 'DOCTOR_UNAVAILABLE' },
          { name_en: 'No show up', name_fr: 'Pas de présentation', code: 'NO_SHOW_UP' },
          { name_en: 'Abort visit', name_fr: 'Abandonner la visite', code: 'ABORT_VISIT' },
          {
            name_en: 'Patient cannot make it',
            name_fr: 'Le patient ne peut pas le faire',
            code: 'PATIENT_CANNOT_MAKE_IT',
          },
          { name_en: 'Release patient', name_fr: 'Libérer le patient', code: 'RELEASE_PATIENT' },
          { name_en: 'Other', name_fr: 'Autre', code: 'OTHER' },
        ],
        { transaction: t },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable(cancelRescheduleReasonLookupsNoTypo, cancelRescheduleReasonLookups, {
        transaction: t,
      });
      await queryInterface.bulkDelete(cancelRescheduleReasonLookups, null, {});
      await queryInterface.bulkInsert(
        cancelRescheduleReasonLookupsNoTypo,
        [
          { name_en: 'Release', name_fr: 'Release', code: 'RELEASE' },
          { name_en: 'Change doctor', name_fr: 'Change doctor', code: 'DOCTOR_CHANGE' },
          { name_en: 'No Showup', name_fr: 'No Showup', code: 'NO_SHOW_UP' },
          { name_en: 'Visit aborted', name_fr: 'visite avortée', code: 'ABORT_VISIT' },
          { name_en: 'Reschedule Appointment', name_fr: 'Re-planifier un rendez-vous', code: 'RESCHEDULE' },
        ],
        { transaction: t },
      );
    });
  },
};
