'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `INSERT INTO Events (staff_id, clinic_id, appointment_id, availability_id, date, end_date, duration_minutes, start_time, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)
    SELECT AVL.staff_id, AVL.clinic_id, AVL.appointment_id, AVL.id, AVL.date, AVL.end_date, AVL.duration_minutes, AVL.start_time, AVL.created_at, AVL.created_by, AVL.updated_at, AVL.updated_by, AVL.deleted_at, AVL.deleted_by
    FROM Availability AS AVL
    WHERE AVL.id NOT IN (SELECT DISTINCT Availability_Id from Events);`,
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve(null);
  },
};
