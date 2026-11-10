"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Bookings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      consultationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Consultations", key: "id" },
        onDelete: "CASCADE",
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      format: {
        type: Sequelize.STRING,
        defaultValue: "chat",
      },
      comment: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "pending",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Bookings");
  },
};
