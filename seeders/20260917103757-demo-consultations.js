"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Consultations",
      [
        {
          topic: "Депрессия",
          description: "Работа с депрессивными состояниями",
          duration: 90,
          status: "available",
          price: 150.0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          topic: "Тревожность",
          description: "Консультация по работе с паникой и тревогами",
          duration: 60,
          status: "available",
          price: 120.0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Consultations", null, {});
  },
};
