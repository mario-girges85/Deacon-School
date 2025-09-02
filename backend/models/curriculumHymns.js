const Sequelize = require("sequelize");
const sequelize = require("../util/db");

// Links a curriculum lecture to one or more hymns with a chosen lyrics variant
const CurriculumHymns = sequelize.define(
  "CurriculumHymns",
  {
    id: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    curriculum_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: false,
    },
    hymn_id: {
      type: Sequelize.DataTypes.STRING(36),
      allowNull: false,
    },
    lyrics_variants: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false,
      defaultValue: JSON.stringify(["arabic"]),
    },
    sort_order: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "curriculum_hymns",
    indexes: [{ fields: ["curriculum_id"] }, { fields: ["hymn_id"] }],
  }
);

module.exports = CurriculumHymns;
