'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Appointments', 'prev_appointment_id', 'previous_appointment_id');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Appointments', 'previous_appointment_id', 'prev_appointment_id');
  },
};
