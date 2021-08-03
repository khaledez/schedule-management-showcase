'use strict';
const cancelReschudleReasonTableName = 'AppointmentCancelReschduleReasonLookup';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(cancelReschudleReasonTableName, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      clinic_id: {
        type: Sequelize.INTEGER,
      },
      name_en: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      name_fr: {
        type: Sequelize.STRING,
      },
      code: {
        type: Sequelize.STRING,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
      deleted_by: {
        type: Sequelize.INTEGER,
      },
    });

    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkInsert(
        cancelReschudleReasonTableName,
        [
          { name_en: 'Release', name_fr: 'Release', code: 'RELEASE' },
          { name_en: 'Change doctor', name_fr: 'Change doctor', code: 'DOCTOR_CHANGE' },
          { name_en: 'No Showup', name_fr: 'No Showup', code: 'NO_SHOW_UP' },
        ],
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable(cancelReschudleReasonTableName);
  },
};
