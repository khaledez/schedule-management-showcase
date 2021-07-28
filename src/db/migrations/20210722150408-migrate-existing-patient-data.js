'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `INSERT INTO PatientInfo (id, full_name, primary_health_plan_number, clinic_id, dob, status_code)
      SELECT P.id, P.full_name, P.primary_health_plan_number,
      P.clinic_id, P.dob, P.status_code
      FROM new_patients_view P
      JOIN Appointments A ON (A.patient_id = P.id)`,
        { transaction: t },
      );
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS `new_patients_view`;', { transaction: t });
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS `new_patient_info_view`;', { transaction: t });
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS `patient_info_view`;', { transaction: t });
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS `patients_phone_number_view`;', { transaction: t });
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS `patients_view`;', { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `CREATE VIEW \`new_patients_view\` AS select \`PATIENT\`.\`id\` AS \`id\`, 
      concat(\`PATIENT\`.\`first_name\`, ' ', \`PATIENT\`.\`last_name\`) AS \`full_name\`,
      \`PATIENT\`.\`clinic_id\` AS \`clinic_id\`,
      \`PATIENT\`.\`dob\` AS \`dob\`,
      \`PATIENT_STATUS\`.\`code\` AS \`status_code\`,
      \`PATIENT\`.\`created_at\` AS \`created_at\`,
      \`PATIENT\`.\`created_by\` AS \`created_by\`,
      \`PATIENT\`.\`updated_at\` AS \`updated_at\`,
      \`PATIENT\`.\`updated_by\` AS \`updated_by\`,
      \`PATIENT\`.\`deleted_at\` AS \`deleted_at\`,
      \`PATIENT\`.\`deleted_by\` AS \`deleted_by\`,
      \`PATIENT_P_H_P\`.\`number\` AS \`primary_health_plan_number\`
    from
      (
        (
          \`PatientManagement\`.\`Patients\` \`PATIENT\`
          join \`PatientManagement\`.\`PatientPrimaryHealthPlans\` \`PATIENT_P_H_P\` on((\`PATIENT\`.\`id\` = \`PATIENT_P_H_P\`.\`patient_id\`))
        )
        join \`PatientManagement\`.\`PatientStatusLookups\` \`PATIENT_STATUS\` on((\`PATIENT_STATUS\`.\`id\` = \`PATIENT\`.\`status_id\`))
      )
    where
      (
        (\`PATIENT\`.\`deleted_at\` is null)
        and (\`PATIENT_P_H_P\`.\`deleted_at\` is null)
      )`,
        { transaction: t },
      );
    });
  },
};
