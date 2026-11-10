"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Question.hasMany(models.Message, {
        foreignKey: "questionId",
        as: "messages",
        onDelete: "CASCADE",
      });
    }
  }
  Question.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      topic: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "open",
      },
    },
    {
      sequelize,
      modelName: "Question",
    },
  );
  return Question;
};
