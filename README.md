# MindCare — сервис анонимной психологической поддержки

Курсовой проект: анонимные консультации с психологом, психологические тесты,
личный кабинет и панель психолога.

**Ветка `26` — Лабораторная работа №6: интеграция с MongoDB (Mongoose).**
В этой ветке сайт доработан до полноценного сервиса (сначала на PostgreSQL +
Sequelize), а затем слой данных заменён на MongoDB + Mongoose. REST API и
React-клиент при замене не менялись.

| Ветка | Содержание |
|-------|------------|
| `lab21` … `24` | REST API, PostgreSQL/Sequelize, JWT + роли, состояние в React |
| `25` | ЛР5: React-клиент, интеграция с REST API |
| **`26`** | **Доработка сайта + ЛР6: MongoDB / Mongoose** |

## Возможности сайта

- **Регистрация и вход** (JWT, bcrypt). Клиент выбирает псевдоним — психолог видит только его, email скрыт.
- **Главная**: вопрос «Как вы себя чувствуете?» с подсказкой, с чего начать, темы, рекомендованные консультации, дыхательное упражнение, отзывы, частые вопросы.
- **Каталог консультаций**: поиск, фильтр по темам (тегам) и цене, сортировка, рейтинг, карточка специалиста.
- **Запись на консультацию**: выбор дня и свободного часового слота (занятое время недоступно), формат — чат, звонок или видео, комментарий; отмена в кабинете.
- **Отзывы**: один отзыв на пользователя, его можно изменить.
- **Психологические тесты**: тревожность (GAD-7), депрессия (PHQ-9), выгорание, качество сна — пошаговое прохождение (можно клавишами 1–4), подсчёт баллов, рекомендации, сравнение с прошлым результатом. При тревожных ответах показываются контакты экстренной помощи.
- **Дневник настроения**: оценка дня, чувства, заметка; график за 14 дней и сводка за месяц.
- **Анонимные вопросы психологу**: переписка в формате чата с автообновлением.
- **Самопомощь**: экстренные номера, анимированное дыхание 4-4-6, заземление 5-4-3-2-1, быстрые способы успокоиться.
- **Личный кабинет**: обзор, записи, дневник, история тестов с динамикой, настройки профиля и пароля.
- **Панель психолога** (роль `admin`): расписание по дням с подтверждением записей, обращения с фильтром по статусу, управление каталогом (компонент ЛР5 с optimistic updates и повтором запросов).
- Светлая и тёмная тема, адаптивная вёрстка, всплывающие уведомления о действиях.

## Запуск (ветка 26, MongoDB)

Требуется Node.js 20+.

### 1. MongoDB

**Вариант A — MongoDB Atlas (по заданию):**
1. Зарегистрируйтесь на <https://www.mongodb.com/cloud/atlas>, создайте бесплатный кластер **M0**.
2. *Database Access* → создайте пользователя БД и пароль.
3. *Network Access* → добавьте свой IP (или `0.0.0.0/0` для учебных целей).
4. *Connect → Drivers* → скопируйте строку подключения `mongodb+srv://...`.

**Вариант B — локально:** установите MongoDB Community Edition, строка подключения `mongodb://127.0.0.1:27017`.

### 2. Сервер

```bash
git clone -b 26 https://github.com/Z-latka/itivp4kurs.git
cd itivp4kurs
npm install
cp .env.example .env      # затем впишите MONGO_URI и JWT_SECRET
npm run seed              # демо-данные (npm run seed:reset — пересоздать)
npm run dev               # http://localhost:3000/api
```

### 3. Клиент

```bash
cd psychology-client
npm install
npm run dev               # http://localhost:5173
```

URL API задаётся в `psychology-client/.env`: `VITE_API_URL=http://localhost:3000/api`.

### Демо-аккаунты (создаёт `npm run seed`)

| Роль | Email | Пароль |
|------|-------|--------|
| Психолог (admin) | `admin@mindcare.by` | `Admin123!` |
| Клиент | `demo@mindcare.by` | `Demo123!` |

При регистрации через сайт роль всегда `user`; администраторы создаются только сидером.

## Структура (ветка 26)

```
db.js                     подключение mongoose.connect(process.env.MONGO_URI)
models/
  User.js                 вложенный profile{} + массивы testResults[] и moods[]
  Consultation.js         массив tags[] + массив отзывов reviews[] (subdocuments)
  Booking.js              отдельная коллекция со ссылками (ref) → populate
  Question.js             обращение с вложенной перепиской messages[]
  toJSON.js               виртуальное поле id, скрытие passwordHash
routes/                   auth, consultations, bookings, tests, questions, moods
data/tests.js             банк тестов и подсчёт баллов
scripts/seed.js           демо-данные и создание индексов
postman/                  коллекция Postman для проверки API
```

## REST API

Базовый URL: `http://localhost:3000/api`. 🔒 — нужен заголовок `Authorization: Bearer <token>`, 👑 — только `admin`.

### CRUD консультаций (методы Mongoose)

| Метод | Путь | Mongoose |
|-------|------|----------|
| GET | `/consultations` (`?tag=`, `?search=`, `?maxPrice=`) | `Model.find(filter)` |
| GET | `/consultations/:id` | `Model.findById(id)` |
| POST 👑 | `/consultations` | `Model.create(body)` |
| PUT 👑 | `/consultations/:id` | `Model.findByIdAndUpdate(id, body, { returnDocument: "after" })`¹ |
| DELETE 👑 | `/consultations/:id` | `Model.findByIdAndDelete(id)` — возвращает удалённый документ, каскадно удаляет записи |

¹ В Mongoose 9 опция `{ new: true }` объявлена устаревшей; `returnDocument: "after"` — её прямой эквивалент.

### Работа с вложенными структурами

| Метод | Путь | Операция MongoDB |
|-------|------|------------------|
| POST 🔒 | `/consultations/:id/reviews` | `$push` отзыва в массив `reviews` |
| PATCH 🔒 | `/consultations/:id/reviews/:reviewId` | изменение элемента массива по месту: `$elemMatch` + позиционный `$` (`"reviews.$.rating"`) |
| DELETE 🔒 | `/consultations/:id/reviews/:reviewId` | `$pull` из массива |
| POST 👑 | `/consultations/:id/tags` | `$addToSet` + `$each` (без дубликатов) |
| DELETE 👑 | `/consultations/:id/tags/:tag` | `$pull` из массива строк |
| GET | `/consultations?tag=тревога` | поиск «массив содержит значение» |
| GET | `/consultations/stats/tags` | aggregation pipeline: `$unwind → $group → $sort → $project` |
| POST 🔒 | `/questions/:id/messages` | `$push` в `messages` + `$set` статуса одной операцией |
| POST | `/tests/:id/submit` | `$push` результата во вложенный `user.testResults` |
| PUT 🔒 | `/auth/profile` | изменение вложенного документа `profile.nickname` / `profile.city` |
| POST 🔒 | `/moods` | запись дневника: если дата уже есть — обновление элемента по `$`, иначе `$push` |
| GET 🔒 | `/moods` | записи и сводка: `$unwind` + `$facet` (среднее, частые чувства) |
| DELETE 🔒 | `/moods/:id` | `$pull` записи из массива `moods` |
| GET | `/consultations/reviews/latest` | последние отзывы: `$unwind` по вложенным `reviews` + `$sort` + `$limit` |

### Остальные маршруты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/register`, `/auth/login` | регистрация / вход, возвращают `token` и `user` |
| GET/PUT 🔒 | `/auth/profile` | профиль |
| POST 🔒 | `/bookings` | запись на консультацию |
| GET 🔒 | `/bookings/my` | мои записи (`populate("consultation")`) |
| PATCH 🔒 | `/bookings/:id/cancel` | отмена |
| GET 👑 | `/bookings` | все записи (`populate` консультации и псевдонима) |
| PATCH 👑 | `/bookings/:id/status` | смена статуса |
| GET | `/tests`, `/tests/:id` | список тестов, вопросы |
| GET 🔒 | `/tests/results/my` | история тестов |
| POST 🔒 | `/questions` | новое анонимное обращение |
| GET 🔒 | `/questions/my`, `/questions/:id` | мои обращения, переписка |
| GET 👑 | `/questions` | все обращения |
| PATCH 🔒 | `/questions/:id/close` | закрыть обращение |
| GET | `/consultations/:id/slots` | занятое время консультации (для выбора свободного слота) |
| GET 🔒 | `/moods/feelings` | справочник чувств для дневника |
| GET | `/stats`, `/health` | статистика, состояние сервера |

Ошибки: неверный ObjectId → 400, нарушение схемы (`required`, `min/max`, `enum`) → 400,
дубликат уникального индекса → 409, нет доступа → 401/403, не найдено → 404.

## PostgreSQL vs MongoDB: одни и те же данные

| Данные | PostgreSQL (коммит `7244a9b`) | MongoDB (ветка 26) |
|--------|-----------------------|--------------------|
| Отзывы | таблица `Reviews` (FK `consultationId`, `userId`), рейтинг — `JOIN` + `AVG` + `GROUP BY` | массив `reviews[]` внутри документа консультации, рейтинг считается из документа |
| Переписка | таблицы `Questions` + `Messages`, чтение через `JOIN` | массив `messages[]` внутри обращения, читается одним запросом |
| Результаты тестов | таблица `TestResults` (FK `userId`) | массив `testResults[]` в документе пользователя |
| Дневник настроения | таблица с FK `userId` и уникальной парой (`userId`, `date`) | массив `moods[]` в документе пользователя |
| Профиль | колонки в `Users` | вложенный документ `profile { nickname, city, about }` |
| Теги | отдельная таблица связи (many-to-many) | массив строк `tags[]` с индексом |
| Записи | таблица `Bookings` с FK | отдельная коллекция со ссылками `ref` + `populate` |
| Схема | миграции `sequelize-cli` | схема Mongoose в коде, без миграций |
| Каскад | `ON DELETE CASCADE` в БД | хук `post("findOneAndDelete")` в модели |

Пример документа консультации в MongoDB:

```json
{
  "_id": "6af37f163d466a3393f06a54",
  "topic": "Тревожность и панические атаки",
  "duration": 60,
  "price": 120,
  "specialist": "Мария Соколова, КПТ-терапевт",
  "tags": ["тревога", "паника", "кпт"],
  "reviews": [
    {
      "_id": "6af37f163d466a3393f06a55",
      "user": "6af37f163d466a3393f06a50",
      "nickname": "Тихий Лис",
      "rating": 5,
      "comment": "Спокойная атмосфера, получил(а) конкретные упражнения.",
      "createdAt": "2026-11-10T20:31:50.000Z"
    }
  ],
  "createdAt": "2026-11-10T20:31:50.000Z",
  "updatedAt": "2026-11-10T20:31:50.000Z"
}
```

Те же данные в PostgreSQL заняли бы строки в трёх таблицах (`Consultations`,
`Reviews`, `Users`) плюс таблицу тегов, а для показа страницы консультации
понадобился бы `JOIN`. Записи (`Booking`) в MongoDB оставлены отдельной
коллекцией: у них собственный жизненный цикл, их ищут независимо от консультации
(«все записи на сегодня»), и их число не ограничено — вложение в документ
консультации привело бы к его неограниченному росту.

## Проверка в Postman

Импортируйте `postman/MindCare-MongoDB.postman_collection.json`. Запросы «Вход»
сохраняют токены в переменные коллекции, «Создать консультацию» — её `id`,
поэтому запросы можно выполнять сверху вниз.

Также есть `test.rest` для расширения VS Code REST Client.

## Версия сайта на PostgreSQL

Доработанный сайт до перехода на MongoDB сохранён в истории ветки 26,
в коммите «Полноценный сайт MindCare» (`7244a9b`):

```bash
git checkout 7244a9b
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed --seed 20261110101000-admin-and-catalog.js
npm run dev
```

Параметры подключения — в `config/config.js`. Вернуться к MongoDB: `git checkout 26`.
