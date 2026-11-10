"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Booking, { foreignKey: "userId", onDelete: "CASCADE" });
      User.hasMany(models.Review, { foreignKey: "userId", onDelete: "CASCADE" });
      User.hasMany(models.TestResult, { foreignKey: "userId", onDelete: "CASCADE" });
      User.hasMany(models.Question, { foreignKey: "userId", onDelete: "CASCADE" });
    }

    // Публичное представление пользователя (без хэша пароля)
    toPublic() {
      return {
        id: this.id,
        email: this.email,
        nickname: this.nickname,
        role: this.role,
        createdAt: this.createdAt,
      };
    }
  }
  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nickname: DataTypes.STRING,
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
      },
    },
    {
      sequelize,
      modelName: "User",
    },
  );
  return User;
};
