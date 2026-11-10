"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Booking.belongsTo(models.Consultation, {
        foreignKey: "consultationId",
        as: "consultation",
      });
    }
  }
  Booking.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      consultationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      format: {
        type: DataTypes.STRING,
        defaultValue: "chat",
      },
      comment: DataTypes.TEXT,
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "Booking",
    },
  );
  return Booking;
};
