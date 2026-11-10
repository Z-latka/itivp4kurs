"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Consultation extends Model {
    static associate(models) {
      Consultation.hasMany(models.Booking, {
        foreignKey: "consultationId",
        onDelete: "CASCADE",
      });
      Consultation.hasMany(models.Review, {
        foreignKey: "consultationId",
        as: "reviews",
        onDelete: "CASCADE",
      });
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
      specialist: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Consultation",
    },
  );
  return Consultation;
};
