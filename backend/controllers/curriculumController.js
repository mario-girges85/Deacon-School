const path = require("path");
const { Curriculum, Levels } = require("../models/relationships");

// Create or update a lecture entry with uploaded file (legacy single file)
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

// Upload multiple files for a lecture (audio, PDF, video)
const uploadMultipleFiles = async (req, res) => {
  try {
    const { levelId, subject, semester, lecture } = req.params;

    // Validate level exists
    const level = await Levels.findByPk(levelId);
    if (!level) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "لم يتم استلام ملفات" });
    }

    // Find or create curriculum entry
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
      },
    });

    // Process uploaded files
    const updateData = {};
    
    for (const file of req.files) {
      const relativePath = path
        .join("uploads", "Curriculum", path.basename(file.path))
        .replace(/\\/g, "/");
      
      const ext = path.extname(file.originalname || "").toLowerCase();
      const mimeType = file.mimetype || "";

      // Determine file type and update appropriate field
      if (ext === ".mp3" || mimeType === "audio/mpeg") {
        updateData.audio_path = relativePath;
      } else if (ext === ".pdf" || mimeType === "application/pdf") {
        updateData.pdf_path = relativePath;
      } else if (ext === ".mkv" || mimeType === "video/x-matroska" || mimeType === "video/webm") {
        updateData.video_path = relativePath;
      }
    }

    // Update the entry with new file paths
    if (Object.keys(updateData).length > 0) {
      await entry.update(updateData);
    }

    return res.json({ success: true, curriculum: entry });
  } catch (err) {
    console.error("uploadMultipleFiles error:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء رفع الملفات" });
  }
};

// Upload specific file type (audio, PDF, or video)
const uploadSpecificFile = async (req, res) => {
  try {
    const { levelId, subject, semester, lecture, fileType } = req.params;

    // Validate level exists
    const level = await Levels.findByPk(levelId);
    if (!level) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "لم يتم استلام ملف" });
    }

    // Validate file type
    const validFileTypes = ['audio', 'pdf', 'video'];
    if (!validFileTypes.includes(fileType)) {
      return res.status(400).json({ error: "نوع الملف غير صحيح" });
    }

    const relativePath = path
      .join("uploads", "Curriculum", path.basename(req.file.path))
      .replace(/\\/g, "/");

    // Find or create curriculum entry
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
      },
    });

    // Update the specific file type field
    const updateData = {};
    updateData[`${fileType}_path`] = relativePath;
    await entry.update(updateData);

    return res.json({ success: true, curriculum: entry });
  } catch (err) {
    console.error("uploadSpecificFile error:", err);
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

module.exports = { 
  uploadLecture, 
  uploadMultipleFiles, 
  uploadSpecificFile, 
  getCurriculum 
};
