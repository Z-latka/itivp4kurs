"use strict";
const bcrypt = require("bcrypt");

// Администратор (психолог) и расширенный каталог консультаций
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const accounts = [
      { email: "admin@mindcare.by", password: "Admin123!", nickname: "Психолог MindCare", role: "admin" },
      { email: "demo@mindcare.by", password: "Demo123!", nickname: "Тихий Лис", role: "user" },
    ];
    for (const account of accounts) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM "Users" WHERE email = :email`,
        { replacements: { email: account.email } },
      );
      if (existing.length > 0) continue;
      await queryInterface.bulkInsert("Users", [
        {
          email: account.email,
          passwordHash: await bcrypt.hash(account.password, 10),
          nickname: account.nickname,
          role: account.role,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    await queryInterface.bulkInsert("Consultations", [
      {
        topic: "Стресс и эмоциональное выгорание",
        description:
          "Разбор причин хронической усталости, техники восстановления ресурса и выстраивания границ на работе.",
        duration: 60,
        status: "available",
        price: 100.0,
        specialist: "Анна Ковалёва, психолог-консультант",
        createdAt: now,
        updatedAt: now,
      },
      {
        topic: "Отношения и семья",
        description:
          "Конфликты с партнёром или родителями, расставание, сложности в общении с близкими.",
        duration: 90,
        status: "available",
        price: 140.0,
        specialist: "Игорь Лебедев, семейный психолог",
        createdAt: now,
        updatedAt: now,
      },
      {
        topic: "Первичная бесплатная консультация",
        description:
          "Короткая встреча, чтобы сформулировать запрос и подобрать подходящего специалиста.",
        duration: 30,
        status: "available",
        price: 0,
        specialist: "Дежурный психолог",
        createdAt: now,
        updatedAt: now,
      },
      {
        topic: "Самооценка и уверенность",
        description:
          "Работа с внутренним критиком, страхом оценки и неуверенностью в себе.",
        duration: 60,
        status: "available",
        price: 110.0,
        specialist: "Мария Соколова, КПТ-терапевт",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Users", {
      email: ["admin@mindcare.by", "demo@mindcare.by"],
    });
  },
};
