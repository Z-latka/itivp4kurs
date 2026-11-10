// Единые настройки сериализации: виртуальное поле id (строка ObjectId)
// рядом с _id, без служебного __v. Клиент работает с полем id, как и с PostgreSQL.
const toJSONOptions = {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
};

// Возвращает строковый id ссылки, даже если поле уже заполнено через populate
const refId = (value) => {
  if (!value) return null;
  return String(value._id || value);
};

module.exports = { toJSONOptions, refId };
