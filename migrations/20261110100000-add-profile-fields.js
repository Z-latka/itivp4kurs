"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "nickname", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("Consultations", "specialist", {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Users", "nickname");
    await queryInterface.removeColumn("Consultations", "specialist");
  },
};
