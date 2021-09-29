'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.sequelize.query(
          "UPDATE AppointmentRequestStatusLookups SET CODE='FULFILLED',name_en = 'Fulfilled', name_fr= 'Fulfilled' WHERE CODE = 'FULLFILLED'",
          { transaction: t },
        ),
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.sequelize.query(
          "UPDATE AppointmentRequestStatusLookups SET CODE='FULLFILLED',name_en = 'Fullfilled', name_fr= 'Fullfilled' WHERE CODE = 'FULFILLED'",
          { transaction: t },
        ),
      ]);
    });
  },
};
