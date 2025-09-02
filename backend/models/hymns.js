const Sequelize = require("sequelize");
const sequelize = require("../util/db");

const Hymns = sequelize.define(
  "Hymns",
  {
    id: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title_arabic: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "Hymn title in Arabic",
    },
    event_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: false,
      comment: "Reference to events table",
    },
    audio_path: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Path to the audio file",
    },
    lyrics_arabic: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Hymn lyrics in Arabic",
    },
    lyrics_coptic: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Hymn lyrics in Coptic",
    },
    lyrics_arabic_coptic: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Hymn lyrics in Arabic Coptic (transliteration)",
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Hymn description or notes",
    },
    duration: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "Audio duration in seconds",
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      comment: "Whether the hymn is active and visible",
    },
  },
  {
    timestamps: true,
    tableName: "hymns",
    indexes: [
      { fields: ["event_id"] },
      { fields: ["title_arabic"] },
      { fields: ["is_active"] },
    ],
  }
);

module.exports = Hymns;
