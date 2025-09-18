const path = require("path");
const {
  Curriculum,
  Levels,
  CurriculumHymns,
  Hymns,
  Events,
} = require("../models/relationships");

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

    // If exists, delete old file and update path
    if (entry.path && entry.path !== relativePath) {
      try {
        const fs = require("fs");
        const oldAbs = path.join(__dirname, "..", entry.path);
        if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
      } catch {}
    }
    await entry.update({ path: relativePath });

    return res.json({ success: true, curriculum: urlifyEntry(entry, req) });
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
      } else if (
        ext === ".mkv" ||
        mimeType === "video/x-matroska" ||
        mimeType === "video/webm"
      ) {
        updateData.video_path = relativePath;
      }
    }

    // Update the entry with new file paths, deleting old ones if replaced
    if (Object.keys(updateData).length > 0) {
      try {
        const fs = require("fs");
        const toDelete = [];
        if (updateData.audio_path && entry.audio_path && entry.audio_path !== updateData.audio_path) toDelete.push(entry.audio_path);
        if (updateData.pdf_path && entry.pdf_path && entry.pdf_path !== updateData.pdf_path) toDelete.push(entry.pdf_path);
        if (updateData.video_path && entry.video_path && entry.video_path !== updateData.video_path) toDelete.push(entry.video_path);
        for (const rel of toDelete) {
          try {
            const abs = path.join(__dirname, "..", rel);
            if (fs.existsSync(abs)) fs.unlinkSync(abs);
          } catch {}
        }
      } catch {}
      await entry.update(updateData);
    }

    return res.json({ success: true, curriculum: urlifyEntry(entry, req) });
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
    const validFileTypes = ["audio", "pdf", "video"];
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

    // Update the specific file type field, deleting old file if replaced
    const field = `${fileType}_path`;
    if (entry[field] && entry[field] !== relativePath) {
      try {
        const fs = require("fs");
        const oldAbs = path.join(__dirname, "..", entry[field]);
        if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
      } catch {}
    }
    await entry.update({ [field]: relativePath });

    return res.json({ success: true, curriculum: urlifyEntry(entry, req) });
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

    // If requesting al7an subject, include linked hymns
    if (subject === "al7an") {
      const curriculumIds = rows.map((r) => r.id);
      const links = await CurriculumHymns.findAll({
        where: { curriculum_id: curriculumIds },
      });
      const hymnIds = [...new Set(links.map((l) => l.hymn_id))];
      const hymns = hymnIds.length
        ? await Hymns.findAll({
            where: { id: hymnIds },
            include: [{ model: Events, as: "event" }],
          })
        : [];
      const idToHymn = new Map(hymns.map((h) => [h.id, h]));
      const grouped = links.reduce((acc, l) => {
        if (!acc[l.curriculum_id]) acc[l.curriculum_id] = [];
        acc[l.curriculum_id].push({
          id: l.id,
          hymn: idToHymn.get(l.hymn_id) || null,
          hymn_id: l.hymn_id,
          lyrics_variants: (() => {
            try {
              return JSON.parse(l.lyrics_variants);
            } catch (e) {
              // Fallback for old data format
              return l.lyrics_variants || [l.lyrics_variant] || ["arabic"];
            }
          })(),
          sort_order: l.sort_order,
        });
        return acc;
      }, {});

      const withHymns = rows.map((r) => ({
        ...urlifyRow(r.toJSON(), req),
        hymns: (grouped[r.id] || []).map((link) => ({
          ...link,
          hymn: link.hymn
            ? urlifyHymn(link.hymn.toJSON ? link.hymn.toJSON() : link.hymn, req)
            : null,
        })),
      }));
      return res.json({ success: true, curriculum: withHymns });
    }

    return res.json({
      success: true,
      curriculum: rows.map((r) => urlifyRow(r.toJSON(), req)),
    });
  } catch (err) {
    console.error("getCurriculum error:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء جلب المنهج" });
  }
};

// Link hymns to a specific al7an lecture (replace set)
const setLectureHymns = async (req, res) => {
  try {
    const { levelId, subject, semester, lecture } = req.params;
    if (subject !== "al7an") {
      return res
        .status(400)
        .json({ error: "هذه العملية متاحة لمادة الألحان فقط" });
    }

    const { hymns } = req.body; // [{ hymn_id, lyrics_variant, sort_order }]

    console.log("setLectureHymns called with:", {
      levelId,
      subject,
      semester,
      lecture,
      hymns: hymns,
    });

    if (!Array.isArray(hymns)) {
      return res.status(400).json({ error: "صيغة البيانات غير صحيحة" });
    }

    const level = await Levels.findByPk(levelId);
    if (!level) return res.status(404).json({ error: "المستوى غير موجود" });

    const [entry] = await Curriculum.findOrCreate({
      where: {
        level_id: levelId,
        subject,
        semester: Number(semester),
        lecture: Number(lecture),
      },
      defaults: {
        level_id: levelId,
        subject,
        semester: Number(semester),
        lecture: Number(lecture),
      },
    });

    // Replace existing links
    console.log("Deleting existing links for curriculum_id:", entry.id);
    await CurriculumHymns.destroy({ where: { curriculum_id: entry.id } });

    console.log("Processing hymns payload...");
    const payload = hymns
      .filter(
        (h) =>
          h &&
          h.hymn_id &&
          typeof h.hymn_id === "string" &&
          h.hymn_id.length > 0
      )
      .map((h, idx) => {
        const hymnId = h.hymn_id; // Keep as string (UUID)
        if (!hymnId || typeof hymnId !== "string") {
          console.error("Invalid hymn_id:", h.hymn_id, "for hymn:", h);
          return null;
        }
        return {
          curriculum_id: entry.id,
          hymn_id: hymnId, // Store as string UUID
          lyrics_variants: JSON.stringify(
            Array.isArray(h.lyrics_variants)
              ? h.lyrics_variants.filter((v) =>
                  ["arabic", "coptic", "arabic_coptic"].includes(v)
                )
              : ["arabic"]
          ),
          sort_order: h.sort_order ?? idx + 1,
        };
      })
      .filter(Boolean); // Remove null entries

    console.log("Final payload:", payload);

    if (payload.length) {
      console.log("Creating hymn links in database...");
      await CurriculumHymns.bulkCreate(payload);
      console.log("Hymn links created successfully");
    } else {
      console.log("No valid hymns to create");
    }

    const refreshed = await CurriculumHymns.findAll({
      where: { curriculum_id: entry.id },
    });
    return res.json({
      success: true,
      curriculum_id: entry.id,
      links: refreshed,
    });
  } catch (err) {
    console.error("setLectureHymns error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return res.status(500).json({
      error: "فشل حفظ الترانيم",
      details: err.message,
    });
  }
};

module.exports = {
  uploadLecture,
  uploadMultipleFiles,
  uploadSpecificFile,
  getCurriculum,
  setLectureHymns,
  deleteLectureFile,
};

// Helpers: convert stored relative paths to absolute URLs
function buildBaseUrl(req) {
  const envBase = process.env.PUBLIC_BASE_URL;
  if (envBase && envBase.trim().length > 0) return envBase.replace(/\/?$/, "");
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host");
  return `${protocol}://${host}`;
}

function toUrl(req, p) {
  if (!p) return p;
  const base = buildBaseUrl(req);
  const normalized = String(p).replace(/^\/+/, "");
  return `${base}/${normalized}`;
}

function urlifyRow(row, req) {
  if (!row) return row;
  return {
    ...row,
    path: row.path ? toUrl(req, row.path) : row.path,
    audio_path: row.audio_path ? toUrl(req, row.audio_path) : row.audio_path,
    pdf_path: row.pdf_path ? toUrl(req, row.pdf_path) : row.pdf_path,
    video_path: row.video_path ? toUrl(req, row.video_path) : row.video_path,
  };
}

function urlifyHymn(hymn, req) {
  if (!hymn) return hymn;
  return {
    ...hymn,
    audio_path: hymn.audio_path ? toUrl(req, hymn.audio_path) : hymn.audio_path,
  };
}

function urlifyEntry(entry, req) {
  const row = entry.toJSON ? entry.toJSON() : entry;
  return urlifyRow(row, req);
}

// Delete a specific file type from a lecture (admin only)
async function deleteLectureFile(req, res) {
  try {
    const { levelId, subject, semester, lecture, fileType } = req.params;

    const validFileTypes = ["audio", "pdf", "video"];
    if (!validFileTypes.includes(fileType)) {
      return res.status(400).json({ error: "نوع الملف غير صحيح" });
    }

    const level = await Levels.findByPk(levelId);
    if (!level) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }

    const entry = await Curriculum.findOne({
      where: {
        level_id: levelId,
        subject,
        semester: Number(semester),
        lecture: Number(lecture),
      },
    });

    if (!entry) {
      return res.status(404).json({ error: "المحاضرة غير موجودة" });
    }

    const field = `${fileType}_path`;
    const existing = entry[field];
    if (!existing) {
      return res.status(404).json({ error: "لا يوجد ملف للحذف" });
    }

    try {
      const fs = require("fs");
      const oldAbs = path.join(__dirname, "..", existing);
      if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
    } catch {}

    entry[field] = null;
    await entry.save();

    return res.json({ success: true, curriculum: urlifyEntry(entry, req) });
  } catch (err) {
    console.error("deleteLectureFile error:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء حذف الملف" });
  }
}
