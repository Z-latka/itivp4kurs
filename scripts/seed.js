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

const DAY = 24 * 60 * 60 * 1000;

// key — внутреннее имя для связи с каталогом ниже
const ACCOUNTS = [
  {
    key: "admin",
    email: "admin@mindcare.by",
    password: "Admin123!",
    role: "admin",
    profile: { nickname: "Администратор" },
  },
  {
    key: "demo",
    email: "demo@mindcare.by",
    password: "Demo123!",
    role: "user",
    profile: { nickname: "Тихий Лис", city: "Минск", about: "Студент, готовлюсь к сессии" },
  },
  {
    key: "maria",
    email: "maria@mindcare.by",
    password: "Psy123!",
    role: "psychologist",
    specialist: {
      fullName: "Мария Соколова",
      title: "КПТ-терапевт",
      experienceYears: 8,
      education: "БГУ, факультет философии и социальных наук; сертификация по КПТ",
      approach: "Когнитивно-поведенческая терапия",
      about:
        "Помогаю справиться с тревогой, паническими атаками и бессонницей. Работаю бережно и структурно: вместе разбираем, что запускает тревогу, и отрабатываем техники, которые можно применять в обычной жизни.",
      topics: ["тревога", "паника", "сон"],
    },
  },
  {
    key: "anna",
    email: "anna@mindcare.by",
    password: "Psy123!",
    role: "psychologist",
    specialist: {
      fullName: "Анна Ковалёва",
      title: "психолог-консультант",
      experienceYears: 5,
      education: "БГПУ им. М. Танка, психология",
      approach: "Интегративный подход",
      about:
        "Работаю со стрессом, выгоранием и самооценкой. Помогаю восстановить ресурс, выстроить границы и вернуть ощущение, что жизнь — ваша.",
      topics: ["выгорание", "стресс", "самооценка"],
    },
  },
  {
    key: "igor",
    email: "igor@mindcare.by",
    password: "Psy123!",
    role: "psychologist",
    specialist: {
      fullName: "Игорь Лебедев",
      title: "психотерапевт, семейный психолог",
      experienceYears: 12,
      education: "БГМУ; системная семейная терапия",
      approach: "Системная семейная терапия",
      about:
        "Работаю с депрессивными состояниями, кризисами и отношениями в паре и семье. Помогаю услышать друг друга и найти выход там, где кажется, что его нет.",
      topics: ["депрессия", "отношения", "семья"],
    },
  },
  {
    key: "olga",
    email: "olga@mindcare.by",
    password: "Psy123!",
    role: "psychologist",
    specialist: {
      fullName: "Ольга Миронова",
      title: "консультант первичного приёма",
      experienceYears: 4,
      education: "БГУ, психология",
      approach: "Клиент-центрированный подход",
      about:
        "Провожу первичные встречи: помогаю сформулировать запрос и подобрать специалиста, который подойдёт именно вам.",
      topics: ["первичная", "тревога", "стресс"],
    },
  },
];

const CATALOG = [
  {
    topic: "Тревожность и панические атаки",
    description: "Консультация по работе с паникой и тревогами, техники самопомощи.",
    duration: 60,
    price: 120,
    psychologist: "maria",
    tags: ["тревога", "паника", "кпт"],
  },
  {
    topic: "Стресс и эмоциональное выгорание",
    description:
      "Разбор причин хронической усталости, техники восстановления ресурса и выстраивания границ на работе.",
    duration: 60,
    price: 100,
    psychologist: "anna",
    tags: ["выгорание", "стресс", "работа"],
  },
  {
    topic: "Депрессивные состояния",
    description: "Работа с подавленным настроением, апатией и потерей интереса.",
    duration: 90,
    price: 150,
    psychologist: "igor",
    tags: ["депрессия", "настроение"],
  },
  {
    topic: "Отношения и семья",
    description:
      "Конфликты с партнёром или родителями, расставание, сложности в общении с близкими.",
    duration: 90,
    price: 140,
    psychologist: "igor",
    tags: ["отношения", "семья"],
  },
  {
    topic: "Первичная бесплатная консультация",
    description:
      "Короткая встреча, чтобы сформулировать запрос и подобрать подходящего специалиста.",
    duration: 30,
    price: 0,
    psychologist: "olga",
    tags: ["первичная", "тревога", "стресс"],
  },
  {
    topic: "Нарушения сна",
    description: "Бессонница, ночные пробуждения, гигиена сна и работа с тревожными мыслями.",
    duration: 60,
    price: 110,
    psychologist: "maria",
    tags: ["сон", "тревога"],
  },
  {
    topic: "Самооценка и уверенность",
    description: "Работа с внутренним критиком, страхом оценки и неуверенностью в себе.",
    duration: 60,
    price: 100,
    psychologist: "anna",
    tags: ["самооценка", "стресс"],
  },
];

// Демо-отзывы других клиентов (у них нет аккаунтов — только id автора и псевдоним)
const review = (nickname, rating, comment, daysAgo) => ({
  user: new mongoose.Types.ObjectId(),
  nickname,
  rating,
  comment,
  createdAt: new Date(Date.now() - daysAgo * DAY),
});

const REVIEWS = [
  [
    review("Северный Ветер", 5, "После трёх встреч панические атаки стали реже. Очень помогли простые техники, которые можно делать в метро.", 12),
    review("Мята", 4, "Спокойно, без давления. Было страшно начинать, но психолог сразу объяснил, как будет проходить работа.", 5),
  ],
  [review("Уставший Кот", 5, "Наконец поняла, почему выгораю, и научилась говорить «нет» на работе без чувства вины.", 9)],
  [review("Тихая Гавань", 4, "Бережный специалист. Важно, что можно было общаться в чате, когда говорить вслух было тяжело.", 20)],
  [],
  [review("Лесной", 5, "Бесплатная встреча помогла понять, к кому идти дальше. Хорошая точка входа.", 3)],
  [],
  [],
];

const atHour = (daysAhead, hour) => {
  const d = new Date(Date.now() + daysAhead * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};

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

  // Создаём индексы, описанные в схемах (unique email, role, tags, profile.city …)
  await Promise.all([
    User.syncIndexes(),
    Consultation.syncIndexes(),
    Booking.syncIndexes(),
    Question.syncIndexes(),
  ]);

  const users = {};
  for (const account of ACCOUNTS) {
    const { key, password, ...data } = account;
    if (data.specialist) data.profile = { nickname: data.specialist.fullName };
    users[key] = await User.findOneAndUpdate(
      { email: account.email },
      { $setOnInsert: { ...data, passwordHash: await bcrypt.hash(password, 10) } },
      { upsert: true, returnDocument: "after" },
    );
  }
  const { demo } = users;

  if ((await Consultation.countDocuments()) === 0) {
    const created = await Consultation.insertMany(
      CATALOG.map((c, i) => ({
        ...c,
        psychologist: users[c.psychologist]._id,
        reviews: REVIEWS[i] || [],
      })),
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

    // Записи: время выбирается по часовым слотам
    await Booking.insertMany([
      {
        user: demo._id,
        consultation: created[0]._id,
        psychologist: users.maria._id,
        scheduledAt: atHour(3, 14),
        format: "video",
        comment: "Хочу научиться справляться с тревогой перед экзаменами",
      },
      {
        user: demo._id,
        consultation: created[4]._id,
        psychologist: users.olga._id,
        scheduledAt: atHour(-6, 11),
        format: "chat",
        status: "completed",
      },
    ]);

    await Question.insertMany([
      {
        user: demo._id,
        psychologist: users.maria._id,
        topic: "Не могу уснуть перед экзаменами",
        status: "answered",
        messages: [
          { authorRole: "user", text: "Уже неделю сплю по 4 часа, мысли о сессии не дают покоя." },
          {
            authorRole: "psychologist",
            text: "Здравствуйте! Попробуйте за час до сна убрать телефон и записать тревожные мысли на бумагу. Расскажите, что обычно крутится в голове?",
          },
        ],
      },
      {
        user: demo._id,
        topic: "Постоянно сравниваю себя с другими",
        messages: [
          {
            authorRole: "user",
            text: "Листаю соцсети и чувствую, что у всех всё получается, а у меня нет. Как перестать?",
          },
        ],
      },
    ]);

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
            takenAt: new Date(Date.now() - 7 * DAY),
          },
          // Дневник настроения за последнюю неделю
          moods: {
            $each: [3, 2, 2, 3, 4, 3, 4].map((mood, i) => ({
              date: localDate(new Date(Date.now() - (6 - i) * DAY)),
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

  console.log("Готово. Учётные записи (пароли — в README):");
  ACCOUNTS.forEach((a) => console.log(`  ${a.role.padEnd(12)} ${a.email}`));
};

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
