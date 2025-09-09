const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");

const { User, Classes, Levels } = require("../models/relationships");
const TeacherSubjectAssignment = require("../models/teacherSubjectAssignment");

// Build absolute URL for an uploaded file path based on the incoming request
const buildImageUrl = (req, relativePath) => {
  try {
    if (!relativePath) return null;
    // Never return base64 data URIs
    if (/^data:/i.test(String(relativePath))) return null;
    if (/^https?:\/\//i.test(relativePath)) return relativePath;
    const host = req.get("host");
    const protocol = req.protocol || "http";
    return `${protocol}://${host}/${String(relativePath).replace(/^\/+/, "")}`;
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
  req,
  userInstance,
  { includeTeachingClasses = false } = {}
) => {
  const user = userInstance.toJSON();

  // Normalize image
  user.image = buildImageUrl(req, user.image);

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
  buildImageUrl,
  resolveTeacherClasses,
  buildUserResponse,
  imageToBase64: (src) => {
    try {
      if (!src) return null;
      if (/^https?:\/\//i.test(src)) return src;

      const normalized = String(src).replace(/^\/+/, "");
      const absolutePath = path.isAbsolute(normalized)
        ? normalized
        : path.join(__dirname, "..", normalized);

      const buffer = fs.readFileSync(absolutePath);
      const ext = (path.extname(absolutePath) || "").toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".gif"
          ? "image/gif"
          : ext === ".webp"
          ? "image/webp"
          : "application/octet-stream";

      return `data:${mime};base64,${buffer.toString("base64")}`;
    } catch (e) {
      return null;
    }
  },
};
