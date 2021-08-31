'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.sequelize.query(
          "UPDATE AppointmentTypesLookups SET name_en = 'Consultation', name_fr= 'Consultation' WHERE CODE = 'NEW'",
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          "UPDATE AppointmentTypesLookups SET name_en = 'Control Visit', name_fr= 'Visite de contrôle' WHERE CODE = 'FUP'",
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          "UPDATE AppointmentTypesLookups SET name_en = 'Principal Visit', name_fr= 'Visite principale' WHERE CODE = 'FUP+ECG'",
          { transaction: t },
        ),
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.sequelize.query(
          "UPDATE AppointmentTypesLookups SET name_en = 'NEW', name_fr= 'NEW' WHERE CODE = 'NEW'",
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          "UPDATE AppointmentTypesLookups SET name_en = 'FUP', name_fr= 'FUP' WHERE CODE = 'FUP'",
          { transaction: t },
        ),
        queryInterface.sequelize.query(
          "UPDATE AppointmentTypesLookups SET name_en = 'FUP+ECG', name_fr= 'FUP+ECG' WHERE CODE = 'FUP+ECG'",
          { transaction: t },
        ),
      ]);
    });
  },
};
