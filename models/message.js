"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Question, { foreignKey: "questionId" });
    }
  }
  Message.init(
    {
      questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      authorRole: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Message",
    },
  );
  return Message;
};
