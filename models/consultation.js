"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Consultation extends Model {
    static associate(models) {
      // Связи с другими моделями
    }
  }
  Consultation.init(
    {
      topic: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: DataTypes.TEXT,
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "available",
      },
      price: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
      },
    },
    {
      sequelize,
      modelName: "Consultation",
    },
  );
  return Consultation;
};
