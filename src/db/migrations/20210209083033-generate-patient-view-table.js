'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.sequelize
      .query(
        'CREATE VIEW `patients_phone_number_view` AS SELECT PATIENT_PHONE_NUMBERS.patient_id, PATIENT_PHONE_NUMBERS.primary,  PHONE_NUMBERS.phone_type_code, PHONE_NUMBERS.number as phone_number FROM patientDB.PatientPhoneNumbers AS PATIENT_PHONE_NUMBERS INNER JOIN patientDB.PhoneNumbers AS PHONE_NUMBERS ON PATIENT_PHONE_NUMBERS.phone_number_id = PHONE_NUMBERS.id WHERE PATIENT_PHONE_NUMBERS.deleted_at IS NULL',
      )
      .then(() => {
        queryInterface.sequelize.query(
          "CREATE VIEW `patient_info_view` AS SELECT PATIENT.id AS patient_id, CONCAT(PATIENT.first_name, ' ', PATIENT.last_name) AS full_name,  PATIENT.first_name, PATIENT.last_name, PATIENT.clinic_id, PATIENT.dob, PATIENT.created_at, PATIENT.created_by, PATIENT.updated_at, PATIENT.updated_by, PATIENT.deleted_at, PATIENT.deleted_by, PATIENT_P_H_P.number as primary_health_plan_number FROM patientDB.Patients as PATIENT INNER JOIN patientDB.PatientPrimaryHealthPlans AS PATIENT_P_H_P ON PATIENT.id=PATIENT_P_H_P.patient_id WHERE PATIENT.deleted_at IS NULL",
        );
      })
      .then(() => {
        queryInterface.sequelize.query(
          "CREATE VIEW `patient_view` AS SELECT PATIENT_INFO_VIEW.patient_id AS id, PATIENT_INFO_VIEW.clinic_id, PATIENT_INFO_VIEW.primary_health_plan_number, CONCAT(PATIENT_INFO_VIEW.first_name, ' ', PATIENT_INFO_VIEW.last_name) AS full_name, PATIENT_INFO_VIEW.dob, PATIENT_INFO_VIEW.created_at, PATIENT_INFO_VIEW.created_by, PATIENT_INFO_VIEW.updated_at, PATIENT_INFO_VIEW.updated_by, PATIENT_INFO_VIEW.deleted_at, PATIENT_INFO_VIEW.deleted_by, PATIENT_PHONE_VIEW_NUMBERS.primary, PATIENT_PHONE_VIEW_NUMBERS.phone_type_code, PATIENT_PHONE_VIEW_NUMBERS.phone_number FROM patientDB.patient_info_view as PATIENT_INFO_VIEW INNER JOIN patientDB.patients_phone_number_view AS PATIENT_PHONE_VIEW_NUMBERS ON PATIENT_INFO_VIEW.patient_id = PATIENT_PHONE_VIEW_NUMBERS.patient_id",
        );
      })
      .then(() => {
        queryInterface.sequelize.query(
          'CREATE VIEW `patients_view` AS SELECT * FROM patientDB.patient_view',
        );
      });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.sequelize
      .query('DROP VIEW `patients_phone_number_view`;')
      .then(() => {
        queryInterface.sequelize.query(' DROP VIEW `patient_info_view`;');
      })
      .then(() => {
        queryInterface.sequelize.query('DROP VIEW `patient_view`;');
      })
      .then(() => {
        queryInterface.sequelize.query('DROP VIEW `patients_view`;');
      });
  },
};
