const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");

const { User, Classes, Levels } = require("../models/relationships");
const TeacherSubjectAssignment = require("../models/teacherSubjectAssignment");

const imageToBase64 = (relativePath) => {
  try {
    if (!relativePath) return null;
    const imagePath = path.join(__dirname, "..", relativePath);
    if (!fs.existsSync(imagePath)) return null;
    const imageBuffer = fs.readFileSync(imagePath);
    const imageExtension = path.extname(relativePath).toLowerCase();
    let mimeType = "image/jpeg";
    switch (imageExtension) {
      case ".png":
        mimeType = "image/png";
        break;
      case ".jpg":
      case ".jpeg":
        mimeType = "image/jpeg";
        break;
      case ".heic":
        mimeType = "image/heic";
        break;
    }
    return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
  } catch {
    return null;
  }
};

// Merge classes for teachers/supervisors from:
// 1) Many-to-many association teachingClasses
// 2) Subject-based assignment table teacher_subject_assignments
const resolveTeacherClasses = async (userId, teachingClassesArray) => {
  const mmClasses = Array.isArray(teachingClassesArray)
    ? teachingClassesArray
    : [];
  const mmIds = new Set(mmClasses.map((c) => c.id));

  const assignmentRows = await TeacherSubjectAssignment.findAll({
    where: {
      [Op.or]: [
        { taks_teacher_id: userId },
        { al7an_teacher_id: userId },
        { coptic_teacher_id: userId },
      ],
    },
    attributes: ["class_id"],
    raw: true,
  });

  const missingIds = Array.from(
    new Set((assignmentRows || []).map((r) => r.class_id))
  ).filter((cid) => !mmIds.has(cid));

  let fetched = [];
  if (missingIds.length) {
    fetched = await Classes.findAll({
      where: { id: missingIds },
      attributes: ["id", "location"],
      include: [{ model: Levels, as: "level", attributes: ["level", "stage"] }],
    });
  }
  return [...mmClasses, ...fetched];
};

// Build a consistent user JSON payload for API responses
const buildUserResponse = async (
  userInstance,
  { includeTeachingClasses = false } = {}
) => {
  const user = userInstance.toJSON();

  // Normalize image
  user.image = imageToBase64(user.image);

  // Consolidate classes depending on role
  if (["teacher", "supervisor"].includes(user.role)) {
    if (includeTeachingClasses) {
      user.classes = await resolveTeacherClasses(user.id, user.teachingClasses);
    } else {
      user.classes = Array.isArray(user.teachingClasses)
        ? user.teachingClasses
        : [];
    }
  } else {
    user.classes = user.class ? [user.class] : [];
  }

  delete user.password;
  delete user.teachingClasses;
  return user;
};

module.exports = {
  imageToBase64,
  resolveTeacherClasses,
  buildUserResponse,
};
