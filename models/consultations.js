let consultations = [
  {
    id: 1,
    topic: "Тревожность",
    description: "Консультация по работе с тревожными состояниями",
    duration: 60,
    status: "available",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    topic: "Стресс",
    description: "Помощь в управлении стрессом",
    duration: 45,
    status: "available",
    createdAt: new Date().toISOString(),
  },
];

let nextId = 3;

module.exports = { consultations, nextId };
