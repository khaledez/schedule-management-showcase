'use strict';

module.exports = {
  // fix primary health plan number and add status code into the view to filter inactive.
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .query(
        "CREATE VIEW `new_patient_info_view` AS SELECT PATIENT.id AS patient_id, CONCAT( PATIENT.first_name, ' ', PATIENT.last_name ) AS full_name, PATIENT.first_name, PATIENT.last_name, PATIENT.clinic_id, PATIENT.dob, PATIENT_STATUS.code AS status_code, PATIENT.created_at, PATIENT.created_by, PATIENT.updated_at, PATIENT.updated_by, PATIENT.deleted_at, PATIENT.deleted_by, PATIENT_P_H_P.number AS primary_health_plan_number FROM PatientManagement.Patients AS PATIENT INNER JOIN PatientManagement.PatientPrimaryHealthPlans AS PATIENT_P_H_P ON PATIENT.id = PATIENT_P_H_P.patient_id INNER JOIN PatientManagement.PatientStatusLookups AS PATIENT_STATUS ON PATIENT_STATUS.id = PATIENT.status_id WHERE PATIENT.deleted_at IS NULL and PATIENT_P_H_P.deleted_at IS NULL",
      )
      .then(() => {
        queryInterface.sequelize.query(
          'CREATE VIEW `new_patients_view` AS SELECT PATIENT_INFO_VIEW.patient_id AS id, PATIENT_INFO_VIEW.clinic_id, PATIENT_INFO_VIEW.primary_health_plan_number, PATIENT_INFO_VIEW.full_name, PATIENT_INFO_VIEW.status_code, PATIENT_INFO_VIEW.dob, PATIENT_INFO_VIEW.created_at, PATIENT_INFO_VIEW.created_by, PATIENT_INFO_VIEW.updated_at, PATIENT_INFO_VIEW.updated_by, PATIENT_INFO_VIEW.deleted_at, PATIENT_INFO_VIEW.deleted_by FROM new_patient_info_view as PATIENT_INFO_VIEW',
        );
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP VIEW `new_patient_info_view`;').then(() => {
      queryInterface.sequelize.query('DROP VIEW `new_patients_view`;');
    });
  },
};
