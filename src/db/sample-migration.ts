/* eslint-disable @typescript-eslint/no-unused-vars */
'use strict';

import sequelize, { QueryInterface } from 'sequelize';

module.exports = {
  up: (queryInterface: QueryInterface, Sequelize: typeof sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([]);
    });
  },

  down: (queryInterface: QueryInterface, Sequelize: typeof sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([]);
    });
  },
};
