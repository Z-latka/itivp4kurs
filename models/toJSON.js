const toJSONOptions = {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
};

const refId = (value) => {
  if (!value) return null;
  return String(value._id || value);
};

module.exports = { toJSONOptions, refId };
