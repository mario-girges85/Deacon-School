const Sequelize = require("sequelize");
const sequelize = require("../util/db");

const Curriculum = sequelize.define(
  "Curriculum",
  {
    id: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    level_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: false,
      comment: "Reference to levels table (level, stage)",
    },
    subject: {
      type: Sequelize.ENUM("taks", "al7an", "coptic"),
      allowNull: false,
    },
    semester: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 2,
        isIn: [[1, 2]],
      },
    },
    lecture: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
        isIn: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
      },
    },
    path: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Path to the file for this curriculum item",
    },
  },
  {
    timestamps: true,
    tableName: "curriculums",
    indexes: [
      {
        unique: true,
        fields: ["level_id", "subject", "semester", "lecture"],
      },
      { fields: ["level_id"] },
      { fields: ["subject"] },
    ],
  }
);

module.exports = Curriculum;
