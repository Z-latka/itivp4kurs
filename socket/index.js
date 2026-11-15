const jwt = require("jsonwebtoken");
const { Question, User } = require("../models");
const { JWT_SECRET } = require("../middleware/auth");

const MAX_TEXT = 5000;
const RATE_WINDOW_MS = 10000;
const RATE_LIMIT = 8;

let ioRef = null;
const online = new Map();

const roomOf = (questionId) => `question:${questionId}`;

const onlineStats = () => {
  const stats = { total: online.size, user: 0, psychologist: 0, admin: 0 };
  online.forEach((info) => {
    stats[info.role] += 1;
  });
  return stats;
};

const notifyUser = (userId, payload) => {
  if (ioRef) ioRef.to(`user:${userId}`).emit("notification", payload);
};

const notifyRole = (role, payload) => {
  if (ioRef) ioRef.to(`role:${role}`).emit("notification", payload);
};

const emitToQuestion = (questionId, event, payload) => {
  if (ioRef) ioRef.to(roomOf(questionId)).emit(event, payload);
};

const initSocket = (io) => {
  ioRef = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error("Требуется авторизация"));
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.id).select("role active profile.nickname specialist.fullName");
      if (!user || !user.active) return next(new Error("Пользователь не найден или отключён"));
      socket.data.user = {
        id: user.id,
        role: user.role,
        name: user.role === "psychologist" ? user.specialist?.fullName : user.profile?.nickname,
      };
      socket.data.sent = [];
      next();
    } catch {
      next(new Error("Недействительный токен"));
    }
  });

  io.on("connection", (socket) => {
    const { user } = socket.data;
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);

    const entry = online.get(user.id) || { role: user.role, sockets: 0 };
    entry.sockets += 1;
    online.set(user.id, entry);
    io.to("role:admin").emit("online", onlineStats());

    socket.on("online:get", (ack = () => {}) => {
      if (user.role !== "admin") return ack({ ok: false, message: "Недостаточно прав" });
      ack({ ok: true, stats: onlineStats() });
    });

    socket.on("question:join", async (questionId, ack = () => {}) => {
      try {
        const question = await Question.findById(questionId);
        if (!question || !question.canAccess(user)) return ack({ ok: false, message: "Обращение не найдено" });
        socket.join(roomOf(questionId));
        socket.to(roomOf(questionId)).emit("chat:presence", { questionId, name: user.name, role: user.role, online: true });
        const sockets = await io.in(roomOf(questionId)).fetchSockets();
        const present = sockets
          .filter((s) => s.id !== socket.id)
          .map((s) => ({ name: s.data.user.name, role: s.data.user.role }));
        ack({ ok: true, present });
      } catch {
        ack({ ok: false, message: "Некорректный идентификатор" });
      }
    });

    socket.on("question:leave", (questionId) => {
      socket.leave(roomOf(questionId));
      socket.to(roomOf(questionId)).emit("chat:presence", { questionId, name: user.name, role: user.role, online: false });
    });

    socket.on("chat:typing", ({ questionId, typing } = {}) => {
      if (!socket.rooms.has(roomOf(questionId))) return;
      socket.to(roomOf(questionId)).emit("chat:typing", { questionId, name: user.name, role: user.role, typing: Boolean(typing) });
    });

    socket.on("chat:message", async ({ questionId, text } = {}, ack = () => {}) => {
      try {
        const now = Date.now();
        socket.data.sent = socket.data.sent.filter((t) => now - t < RATE_WINDOW_MS);
        if (socket.data.sent.length >= RATE_LIMIT) {
          return ack({ ok: false, message: "Слишком много сообщений, подождите несколько секунд" });
        }
        const clean = String(text || "").trim();
        if (!clean) return ack({ ok: false, message: "Сообщение не может быть пустым" });
        if (clean.length > MAX_TEXT) return ack({ ok: false, message: `Сообщение длиннее ${MAX_TEXT} символов` });

        const question = await Question.findById(questionId);
        if (!question || !question.canAccess(user)) return ack({ ok: false, message: "Обращение не найдено" });
        if (question.status === "closed") return ack({ ok: false, message: "Обращение закрыто" });

        const fromPsychologist = user.role === "psychologist";
        const filter = { _id: question._id };
        const update = {
          $push: { messages: { authorRole: fromPsychologist ? "psychologist" : "user", text: clean } },
          $set: { status: fromPsychologist ? "answered" : "open" },
        };
        if (fromPsychologist) {
          filter.psychologist = { $in: [null, user.id] };
          update.$set.psychologist = user.id;
        }
        const updated = await Question.findOneAndUpdate(filter, update, { returnDocument: "after", runValidators: true });
        if (!updated) return ack({ ok: false, message: "Обращение уже взял другой специалист" });

        socket.data.sent.push(now);
        const message = updated.messages.at(-1).toJSON();
        io.to(roomOf(questionId)).emit("chat:message", { questionId, message, status: updated.status });
        ack({ ok: true, message });

        const notice = {
          type: "message",
          title: fromPsychologist ? "Психолог ответил на обращение" : "Новое сообщение от клиента",
          text: updated.topic,
          link: `ask/${questionId}`,
        };
        if (fromPsychologist) notifyUser(String(updated.user), notice);
        else if (updated.psychologist) notifyUser(String(updated.psychologist), notice);
      } catch {
        ack({ ok: false, message: "Не удалось отправить сообщение" });
      }
    });

    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) => {
        if (room.startsWith("question:")) {
          socket.to(room).emit("chat:presence", { questionId: room.slice(9), name: user.name, role: user.role, online: false });
        }
      });
    });

    socket.on("disconnect", () => {
      const current = online.get(user.id);
      if (current) {
        current.sockets -= 1;
        if (current.sockets <= 0) online.delete(user.id);
      }
      io.to("role:admin").emit("online", onlineStats());
    });
  });
};

module.exports = { initSocket, notifyUser, notifyRole, emitToQuestion, onlineStats };
