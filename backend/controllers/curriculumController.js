const path = require("path");
const { Curriculum, Levels } = require("../models/relationships");

// Create or update a lecture entry with uploaded file
const uploadLecture = async (req, res) => {
  try {
    const { levelId, subject, semester, lecture } = req.params;

    // Validate level exists
    const level = await Levels.findByPk(levelId);
    if (!level) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "لم يتم استلام ملف" });
    }

    const relativePath = path
      .join("uploads", "Curriculum", path.basename(req.file.path))
      .replace(/\\/g, "/");

    const [entry] = await Curriculum.findOrCreate({
      where: {
        level_id: levelId,
        subject: subject,
        semester: Number(semester),
        lecture: Number(lecture),
      },
      defaults: {
        level_id: levelId,
        subject: subject,
        semester: Number(semester),
        lecture: Number(lecture),
        path: relativePath,
      },
    });

    // If exists, update path
    if (entry.path !== relativePath) {
      await entry.update({ path: relativePath });
    }

    return res.json({ success: true, curriculum: entry });
  } catch (err) {
    console.error("uploadLecture error:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء رفع الملف" });
  }
};

// Fetch lectures by level and optional filters
const getCurriculum = async (req, res) => {
  try {
    const { levelId } = req.params;
    const { subject, semester } = req.query;
    const where = { level_id: levelId };
    if (subject) where.subject = subject;
    if (semester) where.semester = Number(semester);

    const rows = await Curriculum.findAll({
      where,
      order: [["lecture", "ASC"]],
    });
    return res.json({ success: true, curriculum: rows });
  } catch (err) {
    console.error("getCurriculum error:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء جلب المنهج" });
  }
};

module.exports = { uploadLecture, getCurriculum };
