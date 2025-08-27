const Sequelize = require("sequelize");
const sequelize = require("../util/db");

const Classes = sequelize.define(
  "Classes",
  {
    id: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    level_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: true, // Changed from false to true to allow null initially
      defaultValue: null, // Add default value to fix database constraint
      comment:
        "Reference to level (level, stage) - can be null until assigned",
    },
    location: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      comment:
        "Class location description (e.g., 'الطابق الأول - غرفة 101', 'Floor 1 - Room 101')",
    },
  },
  {
    timestamps: true,
    tableName: "classes",
  }
);

module.exports = Classes;
