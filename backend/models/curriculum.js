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
    class_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: false,
      comment: "Reference to classes table",
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
      comment: "Path to the file for this curriculum item (legacy field)",
    },
    audio_path: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Path to the audio file (mp3) for this curriculum item",
    },
    pdf_path: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Path to the PDF file for this curriculum item",
    },
    video_path: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Path to the video file (mkv) for this curriculum item",
    },
  },
  {
    timestamps: true,
    tableName: "curriculums",
    indexes: [
      {
        unique: true,
        fields: ["class_id", "subject", "semester", "lecture"],
      },
      { fields: ["class_id"] },
      { fields: ["subject"] },
    ],
  }
);

module.exports = Curriculum;
