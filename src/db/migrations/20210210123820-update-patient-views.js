'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query('DROP VIEW IF EXISTS `patients_view`;'),
      queryInterface.sequelize.query(
        "CREATE VIEW `patients_view` AS SELECT PATIENT_INFO_VIEW.patient_id AS id, PATIENT_INFO_VIEW.clinic_id, PATIENT_INFO_VIEW.primary_health_plan_number, CONCAT(PATIENT_INFO_VIEW.first_name, ' ', PATIENT_INFO_VIEW.last_name) AS full_name, PATIENT_INFO_VIEW.dob, PATIENT_INFO_VIEW.created_at, PATIENT_INFO_VIEW.created_by, PATIENT_INFO_VIEW.updated_at, PATIENT_INFO_VIEW.updated_by, PATIENT_INFO_VIEW.deleted_at, PATIENT_INFO_VIEW.deleted_by FROM patient_info_view as PATIENT_INFO_VIEW",
      ),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP VIEW `patients_view`;');
  },
};
