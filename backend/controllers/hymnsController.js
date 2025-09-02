const path = require("path");
const { Op } = require("sequelize");
const { Hymns, Events } = require("../models/relationships");

// Get all hymns with event information
const getHymns = async (req, res) => {
  try {
    const { event_id, search } = req.query;
    const where = { is_active: true };

    if (event_id) {
      where.event_id = event_id;
    }

    if (search) {
      where[Op.or] = [
        { title_arabic: { [Op.like]: `%${search}%` } },
        { lyrics_arabic: { [Op.like]: `%${search}%` } },
        { lyrics_coptic: { [Op.like]: `%${search}%` } },
        { lyrics_arabic_coptic: { [Op.like]: `%${search}%` } },
      ];
    }

    const hymns = await Hymns.findAll({
      where,
      include: [
        {
          model: Events,
          as: "event",
          attributes: ["id", "name", "name_arabic", "color", "icon"],
        },
      ],
      order: [["title_arabic", "ASC"]],
    });

    return res.json({ success: true, hymns });
  } catch (error) {
    console.error("getHymns error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء جلب الترانيم" });
  }
};

// Get hymn by ID
const getHymnById = async (req, res) => {
  try {
    const { id } = req.params;
    const hymn = await Hymns.findByPk(id, {
      include: [
        {
          model: Events,
          as: "event",
          attributes: ["id", "name", "name_arabic", "color", "icon"],
        },
      ],
    });

    if (!hymn) {
      return res.status(404).json({ error: "الترنيمة غير موجودة" });
    }

    return res.json({ success: true, hymn });
  } catch (error) {
    console.error("getHymnById error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء جلب الترانيمة" });
  }
};

// Create new hymn
const createHymn = async (req, res) => {
  try {
    const {
      title_arabic,
      event_id,
      lyrics_arabic,
      lyrics_coptic,
      lyrics_arabic_coptic,
      description,
      duration,
    } = req.body;

    if (!title_arabic || !event_id) {
      return res.status(400).json({ error: "العنوان و المناسبة مطلوبان" });
    }

    // Verify event exists
    const event = await Events.findByPk(event_id);
    if (!event) {
      return res.status(400).json({ error: "المناسبة غير موجودة" });
    }

    const hymn = await Hymns.create({
      title_arabic,
      event_id,
      lyrics_arabic,
      lyrics_coptic,
      lyrics_arabic_coptic,
      description,
      duration,
    });

    // Fetch the created hymn with event information
    const createdHymn = await Hymns.findByPk(hymn.id, {
      include: [
        {
          model: Events,
          as: "event",
          attributes: ["id", "name", "name_arabic", "color", "icon"],
        },
      ],
    });

    return res.status(201).json({ success: true, hymn: createdHymn });
  } catch (error) {
    console.error("createHymn error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء إنشاء الترانيمة" });
  }
};

// Update hymn
const updateHymn = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title_arabic,
      event_id,
      lyrics_arabic,
      lyrics_coptic,
      lyrics_arabic_coptic,
      description,
      duration,
      is_active,
    } = req.body;

    const hymn = await Hymns.findByPk(id);
    if (!hymn) {
      return res.status(404).json({ error: "الترنيمة غير موجودة" });
    }

    // If event_id is being updated, verify the new event exists
    if (event_id && event_id !== hymn.event_id) {
      const event = await Events.findByPk(event_id);
      if (!event) {
        return res.status(400).json({ error: "المناسبة غير موجودة" });
      }
    }

    await hymn.update({
      title_arabic:
        title_arabic !== undefined ? title_arabic : hymn.title_arabic,
      event_id: event_id || hymn.event_id,
      lyrics_arabic:
        lyrics_arabic !== undefined ? lyrics_arabic : hymn.lyrics_arabic,
      lyrics_coptic:
        lyrics_coptic !== undefined ? lyrics_coptic : hymn.lyrics_coptic,
      lyrics_arabic_coptic:
        lyrics_arabic_coptic !== undefined
          ? lyrics_arabic_coptic
          : hymn.lyrics_arabic_coptic,
      description: description !== undefined ? description : hymn.description,
      duration: duration !== undefined ? duration : hymn.duration,
      is_active: is_active !== undefined ? is_active : hymn.is_active,
    });

    // Fetch the updated hymn with event information
    const updatedHymn = await Hymns.findByPk(hymn.id, {
      include: [
        {
          model: Events,
          as: "event",
          attributes: ["id", "name", "name_arabic", "color", "icon"],
        },
      ],
    });

    return res.json({ success: true, hymn: updatedHymn });
  } catch (error) {
    console.error("updateHymn error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء تحديث الترانيمة" });
  }
};

// Delete hymn
const deleteHymn = async (req, res) => {
  try {
    const { id } = req.params;

    const hymn = await Hymns.findByPk(id);
    if (!hymn) {
      return res.status(404).json({ error: "الترنيمة غير موجودة" });
    }

    await hymn.destroy();

    return res.json({ success: true, message: "تم حذف الترانيمة بنجاح" });
  } catch (error) {
    console.error("deleteHymn error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء حذف الترانيمة" });
  }
};

// Upload hymn audio
const uploadHymnAudio = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "لم يتم استلام ملف صوتي" });
    }

    const hymn = await Hymns.findByPk(id);
    if (!hymn) {
      return res.status(404).json({ error: "الترنيمة غير موجودة" });
    }

    const relativePath = path
      .join("uploads", "hymns", path.basename(req.file.path))
      .replace(/\\/g, "/");

    await hymn.update({ audio_path: relativePath });

    return res.json({ success: true, hymn });
  } catch (error) {
    console.error("uploadHymnAudio error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء رفع الملف الصوتي" });
  }
};

module.exports = {
  getHymns,
  getHymnById,
  createHymn,
  updateHymn,
  deleteHymn,
  uploadHymnAudio,
};
