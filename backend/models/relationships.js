const User = require("./user");
const Levels = require("./levels");
const Classes = require("./classes");
const Curriculum = require("./curriculum");
const Events = require("./events");
const Hymns = require("./hymns");
const CurriculumHymns = require("./curriculumHymns");
const sequelize = require("../util/db");
const TeacherSubjectAssignment = require("./teacherSubjectAssignment");

// Define relationships

// Levels -> Classes (One-to-Many)
// One level can have multiple classes
Levels.hasMany(Classes, {
  foreignKey: "level_id",
  as: "classes",
  onDelete: "CASCADE",
});

Classes.belongsTo(Levels, {
  foreignKey: "level_id",
  as: "level",
});

// Classes -> Curriculum (One-to-Many)
Classes.hasMany(Curriculum, {
  foreignKey: "class_id",
  as: "curriculum",
  onDelete: "CASCADE",
});

Curriculum.belongsTo(Classes, {
  foreignKey: "class_id",
  as: "class",
});

// Classes -> User (One-to-Many for students only)
// One class can have multiple students
Classes.hasMany(User, {
  foreignKey: "class_id",
  as: "students",
  onDelete: "SET NULL", // Don't delete user if class is deleted
  scope: {
    role: "student", // Only students belong to a single class
  },
});

// For students: One-to-Many relationship with class
User.belongsTo(Classes, {
  foreignKey: "class_id",
  as: "class",
});

// User -> Levels (One-to-Many)
User.belongsTo(Levels, {
  foreignKey: "level_id",
  as: "level",
});

// Levels -> User (One-to-Many)
// One level can have multiple students
Levels.hasMany(User, {
  foreignKey: "level_id",
  as: "students",
  onDelete: "SET NULL",
});

// Teachers/Supervisors <-> Classes (Many-to-Many)
// This association allows assigning up to 3 classes per teacher/supervisor
// and listing all teachers for a given class.
User.belongsToMany(Classes, {
  through: "teacher_classes",
  as: "teachingClasses",
  foreignKey: "teacher_id",
  otherKey: "class_id",
});

Classes.belongsToMany(User, {
  through: "teacher_classes",
  as: "teachers",
  foreignKey: "class_id",
  otherKey: "teacher_id",
});

// Events -> Hymns (One-to-Many)
// One event can have multiple hymns
Events.hasMany(Hymns, {
  foreignKey: "event_id",
  as: "hymns",
  onDelete: "CASCADE",
});

Hymns.belongsTo(Events, {
  foreignKey: "event_id",
  as: "event",
});

module.exports = {
  User,
  Levels,
  Classes,
  Curriculum,
  Events,
  Hymns,
  CurriculumHymns,
};

// Classes -> TeacherSubjectAssignment (One-to-One per class)
Classes.hasOne(TeacherSubjectAssignment, {
  foreignKey: "class_id",
  as: "teacherAssignment",
  onDelete: "CASCADE",
});

TeacherSubjectAssignment.belongsTo(Classes, {
  foreignKey: "class_id",
  as: "class",
});
