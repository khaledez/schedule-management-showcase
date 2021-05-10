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
        'CREATE VIEW `patients_phone_number_view` AS SELECT PHONE_NUMBERS.phone_type_code, PHONE_NUMBERS.number as phone_number FROM PatientManagement.PhoneNumbers AS PHONE_NUMBERS WHERE PHONE_NUMBERS.deleted_at IS NULL',
      )
      .then(() => {
        queryInterface.sequelize.query(
          "CREATE VIEW `patient_info_view` AS SELECT PATIENT.id AS patient_id, CONCAT(PATIENT.first_name, ' ', PATIENT.last_name) AS full_name,  PATIENT.first_name, PATIENT.last_name, PATIENT.clinic_id, PATIENT.dob, PATIENT.created_at, PATIENT.created_by, PATIENT.updated_at, PATIENT.updated_by, PATIENT.deleted_at, PATIENT.deleted_by, PATIENT_P_H_P.number as primary_health_plan_number FROM PatientManagement.Patients as PATIENT INNER JOIN PatientManagement.PatientPrimaryHealthPlans AS PATIENT_P_H_P ON PATIENT.id=PATIENT_P_H_P.patient_id WHERE PATIENT.deleted_at IS NULL",
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
        queryInterface.sequelize.query('DROP VIEW `patients_view`;');
      });
  },
};
