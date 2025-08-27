const Sequelize = require("sequelize");
const sequelize = require("../util/db");

const Levels = sequelize.define(
  "Levels",
  {
    id: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    level: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 3,
        isIn: [[0, 1, 2, 3]], // 0 = Preparatory, 1-3 = Levels
      },
    },
    stage: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 3,
        isIn: [[1, 2, 3]],
        customValidator(value) {
          // Level 0 (Preparatory) can only have stages 1-2
          if (this.level === 0 && value === 3) {
            throw new Error(
              "المستوى التمهيدي يمكن أن يحتوي على مرحلتين فقط (1 و 2)"
            );
          }
        },
      },
    },
  },
  {
    timestamps: true,
    tableName: "levels",
    indexes: [
      {
        unique: true,
        fields: ["level", "stage"],
      },
    ],
  }
);

module.exports = Levels;
