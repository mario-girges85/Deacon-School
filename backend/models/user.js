// backend/models/user.js

const Sequelize = require("sequelize");
const sequelize = require("../util/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        is: /^\d{11}$/, // Exactly 11 digits
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    birthday: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
        isDate: true,
      },
    },
    gender: {
      type: Sequelize.ENUM("male", "female"),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    code: {
      type: Sequelize.STRING,
      allowNull: true, // Optional for non-students (admins/teachers/supervisors)
      // Removed unique constraint to reduce index count
    },

    // Foreign keys for relationships
    level_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: true,
      comment: "Reference to level (level, stage)",
    },
    class_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: true,
      comment:
        "Reference to class location (floor, room) - Only for students. Teachers/supervisors use many-to-many relationship.",
    },
    image: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Path to user profile image file",
    },
    role: {
      type: Sequelize.ENUM("student", "teacher", "admin", "supervisor"),
      allowNull: false,
      defaultValue: "student",
      validate: {
        notEmpty: true,
      },
    },
    subject: {
      type: Sequelize.ENUM("taks", "al7an", "coptic"),
      allowNull: true, // required only for teachers/supervisors
      comment: "Teacher subject specialty",
    },
  },
  {
    timestamps: true,
    tableName: "users",
  }
);

module.exports = User;
