const Sequelize = require("sequelize");
const sequelize = require("../util/db");

// Stores teacher assignment per subject for a class (one row per class)
const TeacherSubjectAssignment = sequelize.define(
  "TeacherSubjectAssignment",
  {
    class_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      comment: "Class ID this assignment belongs to",
    },
    taks_teacher_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: true,
      comment: "Teacher (user.id) assigned for Taks subject",
    },
    al7an_teacher_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: true,
      comment: "Teacher (user.id) assigned for Al7an subject",
    },
    coptic_teacher_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: true,
      comment: "Teacher (user.id) assigned for Coptic subject",
    },
  },
  {
    timestamps: true,
    tableName: "teacher_subject_assignments",
  }
);

module.exports = TeacherSubjectAssignment;
