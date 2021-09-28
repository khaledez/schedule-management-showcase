'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('ClinicSettings', 'ClinicsSettings', {
        transaction,
      });
      await queryInterface.changeColumn('ClinicsSettings', 'clinic_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        transaction,
      });
      await queryInterface.bulkInsert(
        'ClinicsSettings',
        [
          {
            settings: `{
              "apptCheckinNotificationBeforeAppt_M": 15,
              "notifySecNotConfirmedBeforeAppt_H": 120,
              "apptCheckinBeforeAppt_M": 15,
              "appointmentRequestEnabled": true,
              "confirmBeforeAppt_H": 168,
              "remindBeforeAppt_H": 48
            }`,
          },
        ],
        { transaction },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete('ClinicsSettings', {}, { transaction });
      await queryInterface.changeColumn('ClinicsSettings', 'clinic_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        transaction,
      });
      await queryInterface.renameTable('ClinicsSettings', 'ClinicSettings', {
        transaction,
      });
    });
  },
};
