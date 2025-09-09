const { Classes, Levels, User } = require("../models/relationships");
const sequelize = require("../util/db");
const TeacherSubjectAssignment = require("../models/teacherSubjectAssignment");
const { buildImageUrl } = require("../util/userHelpers");

// Create a new class
const createClass = async (req, res) => {
  try {
    const { level_id, location } = req.body;

    // Validate that the level exists
    const level = await Levels.findByPk(level_id);
    if (!level) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }

    // Create the class
    const newClass = await Classes.create({
      level_id,
      location,
    });

    // Return the created class with the level info and student count
    const result = await Classes.findByPk(newClass.id, {
      include: [{ model: Levels, as: "level" }],
    });

    const classWithStudentCount = {
      ...result.toJSON(),
      students_count: 0, // New class has 0 students initially
    };

    res.status(201).json({
      success: true,
      message: "تم إنشاء الفصل بنجاح",
      class: classWithStudentCount,
    });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الفصل" });
  }
};

// Get all classes with their level info and student count
const getAllClasses = async (req, res) => {
  try {
    const classes = await Classes.findAll({
      include: [{ model: Levels, as: "level" }],
      order: [
        [{ model: Levels, as: "level" }, "level", "ASC"],
        [{ model: Levels, as: "level" }, "stage", "ASC"],
      ],
    });

    // Add student count to each class
    const classesWithStudentCount = await Promise.all(
      classes.map(async (classItem) => {
        const studentCount = await User.count({
          where: {
            class_id: classItem.id,
            role: "student",
          },
        });

        // Preview up to 5 students with base64 images
        const previewRows = await User.findAll({
          where: { class_id: classItem.id, role: "student" },
          order: [["name", "ASC"]],
          limit: 5,
          attributes: ["id", "name", "image"],
        });

        const students_preview = await Promise.all(
          previewRows.map(async (s) => ({
            id: s.id,
            name: s.name,
            image: s.image ? buildImageUrl(req, s.image) : null,
          }))
        );

        return {
          ...classItem.toJSON(),
          students_count: studentCount,
          students_preview,
        };
      })
    );

    res.json({ success: true, classes: classesWithStudentCount });
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الفصول" });
  }
};

// Get classes by level ID with student count
const getClassesByLevel = async (req, res) => {
  try {
    const { levelId } = req.params;
    const classes = await Classes.findAll({
      where: { level_id: levelId },
      include: [{ model: Levels, as: "level" }],
    });

    // Add student count to each class
    const classesWithStudentCount = await Promise.all(
      classes.map(async (classItem) => {
        const studentCount = await User.count({
          where: {
            class_id: classItem.id,
            role: "student",
          },
        });

        const previewRows = await User.findAll({
          where: { class_id: classItem.id, role: "student" },
          order: [["name", "ASC"]],
          limit: 5,
          attributes: ["id", "name", "image"],
        });

        const students_preview = await Promise.all(
          previewRows.map(async (s) => ({
            id: s.id,
            name: s.name,
            image: s.image ? buildImageUrl(req, s.image) : null,
          }))
        );

        return {
          ...classItem.toJSON(),
          students_count: studentCount,
          students_preview,
        };
      })
    );

    res.json({ success: true, classes: classesWithStudentCount });
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الفصول" });
  }
};

// Get class by ID with student count
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classItem = await Classes.findByPk(id, {
      include: [{ model: Levels, as: "level" }],
    });

    if (!classItem) {
      return res.status(404).json({ error: "الفصل غير موجود" });
    }

    // Add student count to the class
    const studentCount = await User.count({
      where: {
        class_id: id,
        role: "student",
      },
    });

    const classWithStudentCount = {
      ...classItem.toJSON(),
      students_count: studentCount,
    };

    res.json({ success: true, class: classWithStudentCount });
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الفصل" });
  }
};

// Get class details with students and teachers
const getClassDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const classItem = await Classes.findByPk(id, {
      include: [{ model: Levels, as: "level" }],
    });

    if (!classItem) {
      return res.status(404).json({ error: "الفصل غير موجود" });
    }

    // Get students in this class
    const rawStudents = await User.findAll({
      where: {
        class_id: id,
        role: "student",
      },
      attributes: { exclude: ["password"] },
      include: [{ model: Levels, as: "level" }],
    });
    // Normalize student payload: add base64 image and classes array for table
    const students = await Promise.all(
      rawStudents.map(async (s) => {
        const data = s.toJSON();
        const img = data.image ? buildImageUrl(req, data.image) : null;
        return {
          ...data,
          image: img,
          classes: [
            {
              id: classItem.id,
              location: classItem.location,
              level: classItem.level ? classItem.level : null,
            },
          ],
        };
      })
    );

    // Get all teachers and supervisors for assignment dropdowns
    const teachers = await User.findAll({
      where: {
        role: ["teacher", "supervisor"],
      },
      attributes: { exclude: ["password"] },
    });

    const classWithDetails = {
      ...classItem.toJSON(),
      students: students,
      teachers: teachers,
      students_count: students.length,
    };

    res.json({ success: true, class: classWithDetails });
  } catch (error) {
    console.error("Error fetching class details:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب تفاصيل الفصل" });
  }
};

// Update a class
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, level_id } = req.body;

    const classToUpdate = await Classes.findByPk(id);
    if (!classToUpdate) {
      return res.status(404).json({ error: "الفصل غير موجود" });
    }

    // If level_id is being updated, validate that the level exists
    if (level_id) {
      const level = await Levels.findByPk(level_id);
      if (!level) {
        return res.status(404).json({ error: "المستوى غير موجود" });
      }
    }

    await classToUpdate.update({
      location: location || classToUpdate.location,
      level_id: level_id !== undefined ? level_id : classToUpdate.level_id,
    });

    const result = await Classes.findByPk(id, {
      include: [{ model: Levels, as: "level" }],
    });

    // Add student count to the updated class
    const studentCount = await User.count({
      where: {
        class_id: id,
        role: "student",
      },
    });

    const classWithStudentCount = {
      ...result.toJSON(),
      students_count: studentCount,
    };

    res.json({
      success: true,
      message: "تم تحديث الفصل بنجاح",
      class: classWithStudentCount,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث الفصل" });
  }
};

// Delete a class
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classToDelete = await Classes.findByPk(id);
    if (!classToDelete) {
      return res.status(404).json({ error: "الفصل غير موجود" });
    }

    // Check if there are students assigned to this class
    const studentsCount = await User.count({
      where: { class_id: id },
    });

    if (studentsCount > 0) {
      return res.status(400).json({
        error: "لا يمكن حذف الفصل لأنه مرتبط بطلاب",
        studentsCount,
      });
    }

    // Unlink teachers (many-to-many) and remove subject assignments for this class
    try {
      if (typeof classToDelete.setTeachers === "function") {
        await classToDelete.setTeachers([]);
      }
    } catch (e) {
      console.warn(
        "Warning: failed to unlink teachers for class",
        id,
        e.message
      );
    }

    try {
      await TeacherSubjectAssignment.destroy({ where: { class_id: id } });
    } catch (e) {
      console.warn(
        "Warning: failed to remove subject assignments for class",
        id,
        e.message
      );
    }

    await classToDelete.destroy();

    res.json({
      success: true,
      message: "تم حذف الفصل بنجاح",
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ error: "حدث خطأ أثناء حذف الفصل" });
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassesByLevel,
  getClassById,
  getClassDetails,
  updateClass,
  deleteClass,
};

// Get teacher assignments for a class
module.exports.getClassTeacherAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    const classItem = await Classes.findByPk(id);
    if (!classItem) {
      return res.status(404).json({ success: false, error: "الفصل غير موجود" });
    }

    const row = await TeacherSubjectAssignment.findByPk(id);
    return res.json({
      success: true,
      assignments: row
        ? {
            taks_teacher_id: row.taks_teacher_id,
            al7an_teacher_id: row.al7an_teacher_id,
            coptic_teacher_id: row.coptic_teacher_id,
          }
        : {
            taks_teacher_id: null,
            al7an_teacher_id: null,
            coptic_teacher_id: null,
          },
    });
  } catch (error) {
    console.error("Error getting teacher assignments:", error);
    res
      .status(500)
      .json({ success: false, error: "حدث خطأ أثناء جلب التعيينات" });
  }
};

// Update teacher assignments for a class
module.exports.updateClassTeacherAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      taks_teacher_id = null,
      al7an_teacher_id = null,
      coptic_teacher_id = null,
    } = req.body || {};

    const classItem = await Classes.findByPk(id);
    if (!classItem) {
      return res.status(404).json({ success: false, error: "الفصل غير موجود" });
    }

    // Allow partial updates: not all subjects are required at once

    // Helper to validate teacher id if provided
    const validateTeacher = async (userId) => {
      if (!userId) return null;
      const user = await User.findByPk(userId);
      if (!user) return "المعلم غير موجود";
      if (!["teacher", "supervisor"].includes(user.role))
        return "المستخدم ليس معلماً أو مشرفاً";
      return null;
    };

    const errors = [];
    for (const [key, val] of Object.entries({
      taks_teacher_id,
      al7an_teacher_id,
      coptic_teacher_id,
    })) {
      if (val) {
        const err = await validateTeacher(val);
        if (err) errors.push(`${key}: ${err}`);
      }
    }
    if (errors.length) {
      return res.status(400).json({ success: false, error: errors.join("; ") });
    }

    // Enforce: each teacher can be associated with maximum 3 classes
    const countClassesForTeacher = async (teacherId) => {
      const { Op } = require("sequelize");
      const TeacherSubjectAssignment = require("../models/teacherSubjectAssignment");

      // Subject-based assignments (exclude current class)
      const subjectRows = await TeacherSubjectAssignment.findAll({
        where: {
          class_id: { [Op.ne]: id },
          [Op.or]: [
            { taks_teacher_id: teacherId },
            { al7an_teacher_id: teacherId },
            { coptic_teacher_id: teacherId },
          ],
        },
        attributes: [[sequelize.col("class_id"), "class_id"]],
        group: ["class_id"],
        raw: true,
      });

      // Many-to-many (teacher_classes) assignments (exclude current class)
      const mmClasses = await Classes.findAll({
        where: { id: { [Op.ne]: id } },
        attributes: ["id"],
        include: [
          {
            model: User,
            as: "teachers",
            attributes: [],
            through: { attributes: [] },
            where: { id: teacherId },
            required: true,
          },
        ],
        raw: true,
      });

      const subjectIds = (subjectRows || []).map((r) => r.class_id);
      const mmIds = (mmClasses || []).map((r) => r.id);
      const unique = new Set([...subjectIds, ...mmIds]);
      return unique.size;
    };

    // Validate each teacher cap (3 classes max) and report by name
    const teacherIds = [
      taks_teacher_id,
      al7an_teacher_id,
      coptic_teacher_id,
    ].filter((v, i, arr) => v && arr.indexOf(v) === i);

    const overLimitMessages = [];
    for (const teacherId of teacherIds) {
      const [teacher, currentCount] = await Promise.all([
        User.findByPk(teacherId),
        countClassesForTeacher(teacherId),
      ]);
      if (currentCount >= 3) {
        const teacherName = teacher?.name || "المعلم";
        overLimitMessages.push(
          `${teacherName} مرتبط بالفعل بـ ${currentCount} فصول (الحد الأقصى 3)`
        );
      }
    }
    if (overLimitMessages.length) {
      return res.status(400).json({
        success: false,
        error: overLimitMessages.join("؛ "),
      });
    }

    const [row, created] = await TeacherSubjectAssignment.findOrCreate({
      where: { class_id: id },
      defaults: {
        class_id: id,
        taks_teacher_id: taks_teacher_id || null,
        al7an_teacher_id: al7an_teacher_id || null,
        coptic_teacher_id: coptic_teacher_id || null,
      },
    });

    if (!created) {
      await row.update({
        taks_teacher_id:
          typeof taks_teacher_id === "undefined"
            ? row.taks_teacher_id
            : taks_teacher_id || null,
        al7an_teacher_id:
          typeof al7an_teacher_id === "undefined"
            ? row.al7an_teacher_id
            : al7an_teacher_id || null,
        coptic_teacher_id:
          typeof coptic_teacher_id === "undefined"
            ? row.coptic_teacher_id
            : coptic_teacher_id || null,
      });
    }

    return res.json({
      success: true,
      message: "تم تحديث تعيين المعلمين بنجاح",
      assignments: {
        taks_teacher_id: row.taks_teacher_id,
        al7an_teacher_id: row.al7an_teacher_id,
        coptic_teacher_id: row.coptic_teacher_id,
      },
    });
  } catch (error) {
    console.error("Error updating teacher assignments:", error);
    res
      .status(500)
      .json({ success: false, error: "حدث خطأ أثناء تحديث التعيينات" });
  }
};
