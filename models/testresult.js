"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TestResult extends Model {
    static associate(models) {
      TestResult.belongsTo(models.User, { foreignKey: "userId" });
    }
  }
  TestResult.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      testId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      testTitle: DataTypes.STRING,
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      maxScore: DataTypes.INTEGER,
      level: DataTypes.STRING,
      levelTitle: DataTypes.STRING,
      answers: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: "TestResult",
    },
  );
  return TestResult;
};
