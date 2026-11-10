"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TestResults", {
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
      testId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      testTitle: {
        type: Sequelize.STRING,
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      maxScore: {
        type: Sequelize.INTEGER,
      },
      level: {
        type: Sequelize.STRING,
      },
      levelTitle: {
        type: Sequelize.STRING,
      },
      answers: {
        type: Sequelize.JSONB,
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
    await queryInterface.dropTable("TestResults");
  },
};
