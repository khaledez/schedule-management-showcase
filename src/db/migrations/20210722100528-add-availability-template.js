'use strict';

const templateTableName = 'AvailabilityTemplate';
const slotTableName = 'AvailabilityTemplateSlot';
module.exports = {
  up: (queryInterface, Sequelize) => {
    /**
     * Creates AvailabilityTemplate table and indexes it by name
     */
    return queryInterface.sequelize.transaction(async (t) => {
      // AvailabilityTemplate
      await queryInterface
        .createTable(
          templateTableName,
          {
            id: {
              allowNull: false,
              autoIncrement: true,
              primaryKey: true,
              type: Sequelize.INTEGER,
            },
            /* Table Attributes */
            clinic_id: {
              allowNull: false,
              type: Sequelize.INTEGER,
            },
            name: {
              allowNull: false,
              type: Sequelize.STRING,
            },
            /* Attributes required by base model */
            /* in addition to id */
            created_at: {
              allowNull: false,
              type: Sequelize.DATE,
              defaultValue: Sequelize.fn('now'),
            },
            created_by: {
              type: Sequelize.INTEGER,
              allowNull: false,
            },
          },
          { transaction: t },
        )
        .then(() => queryInterface.addIndex(templateTableName, ['name']));

      // AvailabilityTemplateSlot
      await queryInterface.createTable(
        slotTableName,
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          /* Table Attributes */
          clinic_id: {
            allowNull: false,
            type: Sequelize.INTEGER,
          },
          availability_template_id: {
            allowNull: false,
            type: Sequelize.INTEGER,
            onDelete: 'CASCADE',
            references: {
              model: templateTableName,
              key: 'id',
            },
          },
          appointment_type_id: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: {
              model: 'AppointmentTypesLookups',
              key: 'id',
            },
          },
          start_time: {
            allowNull: false,
            type: Sequelize.TIME,
          },
          duration_minutes: {
            allowNull: false,
            type: Sequelize.INTEGER,
          },
        },
        { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable(templateTableName, { transaction: t });
      await queryInterface.dropTable(slotTableName, { transaction: t });
    });
  },
};
