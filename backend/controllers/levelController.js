const {
  Levels,
  Classes,
  User,
  Curriculum,
} = require("../models/relationships");
const { Op } = require("sequelize");

// Create a new level
const createLevel = async (req, res) => {
  try {
    const { level, stage } = req.body;

    // Check if level already exists
    const existingLevel = await Levels.findOne({
      where: { level, stage },
    });

    if (existingLevel) {
      return res.status(400).json({
        error: "المستوى موجود بالفعل",
      });
    }

    // Create the level
    const newLevel = await Levels.create({
      level,
      stage,
    });

    res.status(201).json({
      success: true,
      message: "تم إنشاء المستوى بنجاح",
      level: newLevel,
    });
  } catch (error) {
    console.error("Error creating level:", error);
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء المستوى" });
  }
};

// Get all levels
const getAllLevels = async (req, res) => {
  try {
    const levels = await Levels.findAll({
      order: [
        ["level", "ASC"],
        ["stage", "ASC"],
      ],
    });

    res.json({ success: true, levels });
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب المستويات" });
  }
};

// Get level by ID with related aggregates
const getLevelById = async (req, res) => {
  try {
    const { id } = req.params;
    const level = await Levels.findByPk(id);

    if (!level) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }

    // Aggregate counts
    // Get all classes for this level first
    const levelClasses = await Classes.findAll({
      where: { level_id: id },
      attributes: ["id"],
    });
    const classIds = levelClasses.map((c) => c.id);

    const [classesCount, studentsCount, curriculumCount] = await Promise.all([
      Classes.count({ where: { level_id: id } }),
      User.count({ where: { level_id: id, role: "student" } }),
      classIds.length > 0
        ? Curriculum.count({ where: { class_id: { [Op.in]: classIds } } })
        : 0,
    ]);

    // Fetch related simple data (lightweight)
    const classes = await Classes.findAll({
      where: { level_id: id },
      attributes: ["id", "location"],
      order: [["location", "ASC"]],
    });

    const responseLevel = {
      ...level.toJSON(),
      students_count: studentsCount,
      classes_count: classesCount,
      curriculum_count: curriculumCount,
      classes,
    };

    res.json({ success: true, level: responseLevel });
  } catch (error) {
    console.error("Error fetching level:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب المستوى" });
  }
};

// Update a level
const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, stage } = req.body;

    const levelToUpdate = await Levels.findByPk(id);
    if (!levelToUpdate) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }

    // Check if the new combination already exists (excluding current level)
    if (level !== undefined || stage !== undefined) {
      const existingLevel = await Levels.findOne({
        where: {
          level: level || levelToUpdate.level,
          stage: stage || levelToUpdate.stage,
          id: { [require("sequelize").Op.ne]: id },
        },
      });

      if (existingLevel) {
        return res.status(400).json({
          error: "المستوى موجود بالفعل",
        });
      }
    }

    await levelToUpdate.update({
      level: level !== undefined ? level : levelToUpdate.level,
      stage: stage !== undefined ? stage : levelToUpdate.stage,
    });

    res.json({
      success: true,
      message: "تم تحديث المستوى بنجاح",
      level: levelToUpdate,
    });
  } catch (error) {
    console.error("Error updating level:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث المستوى" });
  }
};

// Delete a level
const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    const level = await Levels.findByPk(id);
    if (!level) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }

    // Check if there are classes assigned to this level
    const classesCount = await Classes.count({
      where: { level_id: id },
    });

    if (classesCount > 0) {
      return res.status(400).json({
        error: "لا يمكن حذف المستوى لأنه مرتبط بفصول",
        classesCount,
      });
    }

    await level.destroy();

    res.json({
      message: "تم حذف المستوى بنجاح",
    });
  } catch (error) {
    console.error("Error deleting level:", error);
    res.status(500).json({ error: "حدث خطأ أثناء حذف المستوى" });
  }
};

module.exports = {
  createLevel,
  getAllLevels,
  getLevelById,
  updateLevel,
  deleteLevel,
};
