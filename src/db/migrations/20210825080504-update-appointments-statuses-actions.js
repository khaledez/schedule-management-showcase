'use strict';

const statuses_tableName = 'AppointmentStatusLookups';
const actions_tableName = 'AppointmentActionsLookups';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.sequelize.query(
          `UPDATE ${statuses_tableName} SET code = 'VISIT', name_en = 'Visit', name_fr = 'Visite' WHERE code = 'IN_PROGRESS'`,
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          `UPDATE ${statuses_tableName} SET name_en = 'Confirmed', name_fr = 'Confirmé' WHERE code = 'CONFIRM1'`,
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          `UPDATE ${statuses_tableName} SET name_en = 'Reminded', name_fr = 'Rappelé' WHERE code = 'CONFIRM2'`,
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          `UPDATE ${statuses_tableName} SET name_en = 'Checked-in', name_fr = 'Enregistrée' WHERE code = 'CHECK_IN'`,
          { transaction: t },
        ),

        queryInterface.bulkInsert(
          actions_tableName,
          [
            { name_en: 'In progress', name_fr: 'en cours', code: 'IN_PROGRESS' },
            { name_en: 'V. Pending', name_fr: 'V. En attente', code: 'V_PENDING' },
          ],
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          `UPDATE ${actions_tableName} SET name_en = 'Confirm', name_fr = 'Confirmer' WHERE code = 'CONFIRM1'`,
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          `UPDATE ${actions_tableName} SET name_en = 'Remind', name_fr = 'Rappeler' WHERE code = 'CONFIRM2'`,
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          `UPDATE ${actions_tableName} SET name_en = 'Check-in', name_fr = 'Enregistrée' WHERE code = 'CHECK_IN'`,
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          `UPDATE ${actions_tableName} SET name_en = 'Reschedule', name_fr = 'Recéduler' WHERE code = 'RESCHEDULE_APPT'`,
          { transaction: t },
        ),
      ]);
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(actions_tableName, { code: 'IN_PROGRESS' }, { transaction: t });
      await queryInterface.bulkDelete(actions_tableName, { code: 'V_PENDING' }, { transaction: t });
    });
  },
};
