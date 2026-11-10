// Наполнение MongoDB демонстрационными данными: npm run seed
// Флаг --reset очищает коллекции перед заполнением
require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectDB = require("../db");
const { User, Consultation, Booking, Question } = require("../models");

// Дата в формате ГГГГ-ММ-ДД по местному времени (toISOString дал бы UTC)
const localDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const ACCOUNTS = [
  {
    email: "admin@mindcare.by",
    password: "Admin123!",
    role: "admin",
    profile: { nickname: "Психолог MindCare", city: "Минск" },
  },
  {
    email: "demo@mindcare.by",
    password: "Demo123!",
    role: "user",
    profile: { nickname: "Тихий Лис", city: "Минск", about: "Студент, готовлюсь к сессии" },
  },
];

const CATALOG = [
  {
    topic: "Тревожность и панические атаки",
    description: "Консультация по работе с паникой и тревогами, техники самопомощи.",
    duration: 60,
    price: 120,
    specialist: "Мария Соколова, КПТ-терапевт",
    tags: ["тревога", "паника", "кпт"],
  },
  {
    topic: "Стресс и эмоциональное выгорание",
    description:
      "Разбор причин хронической усталости, техники восстановления ресурса и выстраивания границ на работе.",
    duration: 60,
    price: 100,
    specialist: "Анна Ковалёва, психолог-консультант",
    tags: ["выгорание", "стресс", "работа"],
  },
  {
    topic: "Депрессивные состояния",
    description: "Работа с подавленным настроением, апатией и потерей интереса.",
    duration: 90,
    price: 150,
    specialist: "Игорь Лебедев, психотерапевт",
    tags: ["депрессия", "настроение"],
  },
  {
    topic: "Отношения и семья",
    description:
      "Конфликты с партнёром или родителями, расставание, сложности в общении с близкими.",
    duration: 90,
    price: 140,
    specialist: "Игорь Лебедев, семейный психолог",
    tags: ["отношения", "семья"],
  },
  {
    topic: "Первичная бесплатная консультация",
    description:
      "Короткая встреча, чтобы сформулировать запрос и подобрать подходящего специалиста.",
    duration: 30,
    price: 0,
    specialist: "Дежурный психолог",
    tags: ["первичная", "тревога", "стресс"],
  },
  {
    topic: "Нарушения сна",
    description: "Бессонница, ночные пробуждения, гигиена сна и работа с тревожными мыслями.",
    duration: 60,
    price: 110,
    specialist: "Мария Соколова, КПТ-терапевт",
    tags: ["сон", "тревога"],
  },
];

const run = async () => {
  await connectDB();

  if (process.argv.includes("--reset")) {
    await Promise.all([
      User.deleteMany({}),
      Consultation.deleteMany({}),
      Booking.deleteMany({}),
      Question.deleteMany({}),
    ]);
    console.log("Коллекции очищены");
  }

  // Создаём индексы, описанные в схемах (unique email, tags, profile.city)
  await Promise.all([User.syncIndexes(), Consultation.syncIndexes(), Booking.syncIndexes()]);

  const users = {};
  for (const account of ACCOUNTS) {
    const { password, ...data } = account;
    users[account.role] = await User.findOneAndUpdate(
      { email: account.email },
      { $setOnInsert: { ...data, passwordHash: await bcrypt.hash(password, 10) } },
      { upsert: true, returnDocument: "after" },
    );
  }
  const demo = users.user;

  if ((await Consultation.countDocuments()) === 0) {
    // Демо-отзывы других клиентов (у них нет аккаунтов — только id автора и псевдоним)
    const review = (nickname, rating, comment, daysAgo) => ({
      user: new mongoose.Types.ObjectId(),
      nickname,
      rating,
      comment,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    });
    const REVIEWS = [
      [
        review("Северный Ветер", 5, "После трёх встреч панические атаки стали реже. Очень помогли простые техники, которые можно делать в метро.", 12),
        review("Мята", 4, "Спокойно, без давления. Было страшно начинать, но психолог сразу объяснил, как будет проходить работа.", 5),
      ],
      [
        review("Уставший Кот", 5, "Наконец поняла, почему выгораю, и научилась говорить «нет» на работе без чувства вины.", 9),
      ],
      [
        review("Тихая Гавань", 4, "Бережный специалист. Важно, что можно было общаться в чате, когда говорить вслух было тяжело.", 20),
      ],
      [],
      [
        review("Лесной", 5, "Бесплатная встреча помогла понять, к кому идти дальше. Хорошая точка входа.", 3),
      ],
      [],
    ];

    const created = await Consultation.insertMany(
      CATALOG.map((c, i) => ({ ...c, reviews: REVIEWS[i] || [] })),
    );
    // Отзыв демо-клиента — его можно отредактировать на сайте
    await Consultation.updateOne(
      { _id: created[0]._id },
      {
        $push: {
          reviews: {
            user: demo._id,
            nickname: demo.profile.nickname,
            rating: 5,
            comment: "Получил(а) конкретные упражнения и чувство, что со мной всё в порядке.",
          },
        },
      },
    );

    // Через 3 дня, ровно в 14:00 — время записи выбирается по часовым слотам
    const bookingDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    bookingDate.setHours(14, 0, 0, 0);
    await Booking.create({
      user: demo._id,
      consultation: created[0]._id,
      scheduledAt: bookingDate,
      format: "video",
      comment: "Хочу научиться справляться с тревогой перед экзаменами",
    });

    await Question.create({
      user: demo._id,
      topic: "Не могу уснуть перед экзаменами",
      status: "answered",
      messages: [
        { authorRole: "user", text: "Уже неделю сплю по 4 часа, мысли о сессии не дают покоя." },
        {
          authorRole: "psychologist",
          text: "Здравствуйте! Попробуйте за час до сна убрать телефон и записать тревожные мысли на бумагу. Расскажите, что обычно крутится в голове?",
        },
      ],
    });

    await User.updateOne(
      { _id: demo._id },
      {
        $push: {
          testResults: {
            testId: "anxiety",
            testTitle: "Тест на уровень тревожности",
            score: 9,
            maxScore: 21,
            level: "mild",
            levelTitle: "Лёгкая тревожность",
            answers: [1, 2, 1, 1, 2, 1, 1],
          },
          // Дневник настроения за последнюю неделю
          moods: {
            $each: [3, 2, 2, 3, 4, 3, 4].map((mood, i) => ({
              date: localDate(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)),
              mood,
              feelings: mood <= 2 ? ["тревога", "усталость"] : ["спокойствие"],
              note: mood <= 2 ? "Много учёбы, плохо спал(а)" : "",
            })),
          },
        },
      },
    );
    console.log(`Создано консультаций: ${created.length}`);
  } else {
    console.log("Каталог уже заполнен — пропускаю (используйте --reset для пересоздания)");
  }

  console.log("Готово. Учётные записи: admin@mindcare.by, demo@mindcare.by (пароли — в README)");
};

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
