const bcrypt = require("bcrypt");
const User = require("../models/user");
const Classes = require("../models/classes");
const Levels = require("../models/levels");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_in_production";

if (!process.env.JWT_SECRET) {
  console.warn("⚠️  WARNING: JWT_SECRET is not set in environment variables!");
  console.warn("⚠️  Using default secret. Please set JWT_SECRET in your .env file for production!");
}
const sequelize = require("../util/db");
module.exports.register = async (req, res) => {
  try {
    console.log("req.body", req.body);
    console.log("req.file", req.file);

    const {
      name,
      phone,
      password,
      birthday,
      gender,
      code,
      class_id,
      level_id,
      role = "student",
      subject = undefined,
    } = req.body;

    // Validate required fields for all roles
    const requiredFields = ["name", "phone", "password", "birthday", "gender", "code"];

    // For students, class_id and level_id are also required
    if (role === "student") {
      requiredFields.push("class_id", "level_id");
    }
    // For teachers, require subject
    if (role === "teacher") {
      // require subject for teachers only
      if (!subject || !["taks", "al7an", "coptic"].includes(String(subject))) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "يجب تحديد تخصص المعلم: taks أو al7an أو coptic",
        });
      }
    }
    // Admins/supervisors: no class/level required

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      // If image was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: `الحقول المطلوبة: ${missingFields.join(", ")}`,
      });
    }

    // Enforce phone format: exactly 11 digits
    if (!/^\d{11}$/.test(String(phone))) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف يجب أن يتكون من 11 رقمًا",
      });
    }

    // Enforce unique code across all users; allow duplicate phone numbers
    const existingUser = await User.findOne({ where: { code: code } });

    if (existingUser) {
      // If image was uploaded but user exists, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(409).json({
        success: false,
        message: "الكود مستخدم بالفعل",
      });
    }

    // Resolve level depending on role
    let resolvedLevelId = level_id || null;
    if (role === "student") {
      // Validate referenced class first, then derive the level
      const classItem = await Classes.findByPk(class_id);
      if (!classItem) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "الفصل غير موجود",
        });
      }

      // Always use the level_id from the class to ensure consistency
      resolvedLevelId = classItem.level_id;
    } // teachers/supervisors/admins: no level required

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData = {
      name,
      phone: String(phone),
      password: hashedPassword,
      birthday,
      gender,
      role,
      level_id: resolvedLevelId,
    };
    // Only set code if provided (staff can omit)
    if (typeof code !== "undefined") {
      userData.code = code || null;
    }

    // Only add class_id for students
    if (role === "student") {
      userData.class_id = class_id;
    }

    // Only set subject for teachers
    if (role === "teacher") {
      userData.subject = String(subject);
    }

    // Add image path if uploaded
    if (req.file) {
      userData.image = `uploads/profiles/${req.file.filename}`;
    }

    // Create user
    const newUser = await User.create(userData);

    // Remove password from response
    const userResponse = { ...newUser.toJSON() };
    delete userResponse.password;

    const { buildImageUrl } = require("../util/userHelpers");
    // Convert image path to absolute URL
    if (userResponse.image) {
      userResponse.image = buildImageUrl(req, userResponse.image);
    }

    res.status(201).json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // If image was uploaded but error occurred, delete it
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "خطأ في البيانات المدخلة",
        errors: validationErrors,
      });
    }

    // Handle unique constraint errors
    if (error.name === "SequelizeUniqueConstraintError") {
      const pathField = error.errors && error.errors[0] && error.errors[0].path;
      const isStudent =
        String((req.body && req.body.role) || "").toLowerCase() === "student";

      if (isStudent && (pathField === "phone" || pathField === "code")) {
        return res.status(409).json({
          success: false,
          message: "رقم الهاتف أو الكود مستخدم بالفعل",
        });
      }

      const field =
        pathField === "phone"
          ? "رقم الهاتف"
          : pathField === "code"
          ? "الكود"
          : "الحقل";
      return res.status(409).json({
        success: false,
        message: `${field} مستخدم بالفعل`,
      });
    }

    res.status(500).json({
      success: false,
      message: "حدث خطأ في الخادم",
    });
  }
};

module.exports.login = async (req, res) => {
  console.log(req.body);

  const { code, password } = req.body;
  try {
    // Basic validation
    if (!code || !password) {
      return res.status(400).json({
        success: false,
        message: "الكود وكلمة المرور مطلوبان",
      });
    }

    const user = await User.findOne({
      where: {
        code: code,
      },
      include: [
        {
          model: Classes,
          as: "class",
          attributes: ["id", "location", "level_id"],
          include: [
            { model: Levels, as: "level", attributes: ["level", "stage"] },
          ],
          required: false,
        },
        {
          model: Levels,
          as: "level",
          attributes: ["level", "stage"],
          required: false,
        },
      ],
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "كلمة المرور غير صحيحة",
      });
    }

    // Generate token for frontend UI purposes (not for auth)
    const token = jwt.sign(
      {
        name: user.name,
        class: user.class, // may be null
        class_id: user.class_id || null,
        level_id: user.level_id || null,
        birthday: user.birthday,
        gender: user.gender,
        id: user.id,
        phone: user.phone,
        code: user.code,
        role: user.role,
      },
      JWT_SECRET
    );

    // Prepare user data for response
    const userJson = user.toJSON();
    const userData = {
      id: userJson.id,
      name: userJson.name,
      phone: userJson.phone,
      code: userJson.code,
      class_id: userJson.class_id || null,
      level_id: userJson.level_id || null,
      // Include minimal class and level data for UI
      class: userJson.class
        ? {
            id: userJson.class.id,
            location: userJson.class.location,
            level: userJson.class.level || null,
          }
        : null,
      level: userJson.level
        ? { level: userJson.level.level, stage: userJson.level.stage }
        : null,
      birthday: userJson.birthday,
      gender: userJson.gender,
      role: userJson.role,
      image: null, // Default to null
    };

    // Build absolute image URL if present
    const { buildImageUrl } = require("../util/userHelpers");
    if (user.image) {
      userData.image = buildImageUrl(req, user.image);
    }

    res.status(200).json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

// Change password (self or admin)
module.exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body || {};

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "المستخدم غير موجود" });
    }

    // If not admin, verify current password
    const actingIsAdmin = req.user && req.user.role === "admin";
    if (!actingIsAdmin) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ success: false, message: "كلمة المرور الحالية مطلوبة" });
      }
      const ok = await bcrypt.compare(String(currentPassword), user.password);
      if (!ok) {
        return res
          .status(401)
          .json({ success: false, message: "كلمة المرور الحالية غير صحيحة" });
      }
    }

    const saltRounds = 12;
    const hashed = await bcrypt.hash(String(newPassword), saltRounds);
    user.password = hashed;
    await user.save();

    return res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    console.error("changePassword error:", error);
    return res
      .status(500)
      .json({ success: false, message: "تعذر تغيير كلمة المرور" });
  }
};

// Update user profile image
module.exports.updateUserImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "user id is required" });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "image file is required" });
    }

    const User = require("../models/user");
    const path = require("path");
    const fs = require("fs");
    const { buildImageUrl } = require("../util/userHelpers");

    const user = await User.findByPk(id);
    if (!user) {
      // delete uploaded file if user not found
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      return res
        .status(404)
        .json({ success: false, message: "المستخدم غير موجود" });
    }

    // Optionally remove previous image file
    if (user.image) {
      try {
        const oldPath = path.join(__dirname, "..", user.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch {}
    }

    user.image = `uploads/profiles/${req.file.filename}`;
    await user.save();

    const imageUrl = buildImageUrl(req, user.image);
    return res.json({
      success: true,
      message: "تم تحديث الصورة بنجاح",
      image: imageUrl,
    });
  } catch (error) {
    console.error("updateUserImage error:", error);
    return res
      .status(500)
      .json({ success: false, message: "تعذر تحديث الصورة" });
  }
};

module.exports.getUsers = async (req, res) => {
  try {
    const includeTeaching =
      String(req.query.includeTeachingClasses || "false").toLowerCase() ===
      "true";

    const includes = [
      {
        model: Levels,
        as: "level",
        attributes: ["level", "stage"],
      },
      // Include class for students
      {
        model: Classes,
        as: "class",
        attributes: ["id", "location"],
        required: false, // Left join for students
      },
    ];

    if (includeTeaching) {
      includes.push({
        model: Classes,
        as: "teachingClasses",
        attributes: ["id", "location"],
        required: false, // Left join for teachers/supervisors
        include: [
          {
            model: Levels,
            as: "level",
            attributes: ["level", "stage"],
          },
        ],
      });
    }

    const users = await User.findAll({ include: includes });

    if (!users) {
      return res.status(404).json({
        success: false,
        message: "لا يوجد مستخدمين",
      });
    }

    // Process users to include base64 images and format class data
    const { buildUserResponse } = require("../util/userHelpers");
    const usersWithImages = await Promise.all(
      users.map(async (u) =>
        buildUserResponse(req, u, { includeTeachingClasses: includeTeaching })
      )
    );

    res.status(200).json({
      success: true,
      message: "تم جلب المستخدمين بنجاح",
      users: usersWithImages,
    });
  } catch (error) {
    console.error("getUsers error:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في معالجة المستخدمين",
      error: error.message,
    });
  }
};

// Get single user by id with associations
module.exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const includes = [
      {
        model: Levels,
        as: "level",
        attributes: ["level", "stage"],
      },
      {
        model: Classes,
        as: "class",
        attributes: ["id", "location"],
        required: false,
      },
      {
        model: Classes,
        as: "teachingClasses",
        attributes: ["id", "location"],
        required: false,
        include: [
          {
            model: Levels,
            as: "level",
            attributes: ["level", "stage"],
          },
        ],
      },
    ];

    const user = await User.findByPk(id, { include: includes });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "المستخدم غير موجود" });
    }

    const userData = user.toJSON();

    // Convert image path to absolute URL if exists
    if (userData.image) {
      const { buildImageUrl } = require("../util/userHelpers");
      userData.image = buildImageUrl(req, userData.image);
    }

    if (["teacher", "supervisor"].includes(userData.role)) {
      // Merge classes from many-to-many and subject-assignment mapping
      const mmClasses = Array.isArray(userData.teachingClasses)
        ? userData.teachingClasses
        : [];

      const { Op } = require("sequelize");
      const TeacherSubjectAssignment = require("../models/teacherSubjectAssignment");
      const assignmentRows = await TeacherSubjectAssignment.findAll({
        where: {
          [Op.or]: [
            { taks_teacher_id: id },
            { al7an_teacher_id: id },
            { coptic_teacher_id: id },
          ],
        },
        attributes: ["class_id"],
        raw: true,
      });

      const mmIds = new Set(mmClasses.map((c) => c.id));
      const missingIds = Array.from(
        new Set((assignmentRows || []).map((r) => r.class_id))
      ).filter((cid) => !mmIds.has(cid));

      let fetchedClasses = [];
      if (missingIds.length) {
        fetchedClasses = await Classes.findAll({
          where: { id: missingIds },
          attributes: ["id", "location"],
          include: [
            { model: Levels, as: "level", attributes: ["level", "stage"] },
          ],
        });
      }

      userData.classes = [...mmClasses, ...fetchedClasses];
      delete userData.teachingClasses;
    } else {
      userData.classes = userData.class ? [userData.class] : [];
      delete userData.teachingClasses;
    }

    delete userData.password;

    return res.json({ success: true, user: userData });
  } catch (error) {
    console.error("getUserById error:", error);
    res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    // Delete profile image if exists
    try {
      if (user.image) {
        const path = require("path");
        const fs = require("fs");
        const p = path.join(__dirname, "..", user.image);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch (e) {
      console.warn("Failed to delete user image:", e.message);
    }

    await user.destroy();

    res.json({
      success: true,
      message: "تم حذف المستخدم بنجاح",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف المستخدم",
    });
  }
};

// Get teachers by subject (for schedule management)
module.exports.getTeachersBySubject = async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: {
        role: "teacher",
        subject: {
          [Op.in]: ["taks", "al7an", "coptic"],
        },
      },
      attributes: { exclude: ["password"] },
      order: [["name", "ASC"]],
    });

    // Group teachers by subject
    const teachersBySubject = {
      taks: teachers.filter((t) => t.subject === "taks"),
      al7an: teachers.filter((t) => t.subject === "al7an"),
      coptic: teachers.filter((t) => t.subject === "coptic"),
    };

    res.json({
      success: true,
      teachersBySubject,
    });
  } catch (error) {
    console.error("Error fetching teachers by subject:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب المعلمين",
    });
  }
};

// Unified bulk import (CSV or Excel). Role defaults to student.
module.exports.bulkImport = async (req, res) => {
  try {
    // Disallow any role coming from the request body (ignore silently)
    if (req.body && typeof req.body.role !== "undefined") {
      delete req.body.role;
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "يرجى رفع ملف CSV أو Excel في الحقل 'file'",
      });
    }

    const originalName = (req.file.originalname || "").toLowerCase();
    const isCsv = originalName.endsWith(".csv");
    const isExcel =
      originalName.endsWith(".xlsx") || originalName.endsWith(".xls");

    if (!isCsv && !isExcel) {
      return res.status(400).json({
        success: false,
        message: "صيغة الملف غير مدعومة. استخدم CSV أو Excel فقط",
      });
    }

    // If provided, all rows will be assigned to this classId
    const bodyClassId = req.body.classId || req.body.class_id || null;
    let bodyClassData = null;
    let bodyLevelId = null;
    if (bodyClassId) {
      bodyClassData = await Classes.findByPk(bodyClassId, {
        include: [{ model: Levels, as: "level" }],
      });
      if (!bodyClassData) {
        return res
          .status(404)
          .json({ success: false, message: "الفصل المحدد غير موجود" });
      }
      bodyLevelId = bodyClassData.level_id;
    }

    const results = {
      total: 0,
      successful: [],
      failed: [],
      existing: [],
    };

    const ensureBirthday = (value) => {
      const ExcelJS = require("exceljs"); // safe to require even for CSV path
      const coerceStringToDate = (strVal) => {
        const str = String(strVal || "").trim();
        if (!str) return null;
        let match = str.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
        if (match) {
          const monthFirst = parseInt(match[1], 10) - 1;
          const daySecond = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          let d = new Date(year, monthFirst, daySecond);
          if (
            !isNaN(d.getTime()) &&
            d.getFullYear() === year &&
            d.getMonth() === monthFirst &&
            d.getDate() === daySecond
          ) {
            return d;
          }
          const dayFirst = parseInt(match[1], 10);
          const monthSecond = parseInt(match[2], 10) - 1;
          d = new Date(year, monthSecond, dayFirst);
          if (
            !isNaN(d.getTime()) &&
            d.getFullYear() === year &&
            d.getMonth() === monthSecond &&
            d.getDate() === dayFirst
          ) {
            return d;
          }
        }
        const iso = new Date(str);
        if (!isNaN(iso.getTime())) return iso;
        return null;
      };
      if (value instanceof Date) return value;
      if (typeof value === "number") {
        const baseDate = new Date(Date.UTC(1899, 11, 30));
        const result = new Date(
          baseDate.getTime() + value * 24 * 60 * 60 * 1000
        );
        return new Date(
          result.getFullYear(),
          result.getMonth(),
          result.getDate()
        );
      }
      if (value && typeof value === "object" && value.text) {
        return coerceStringToDate(value.text);
      }
      return coerceStringToDate(value);
    };

    const upsertFromRow = async (rowObj, rowIndex) => {
      try {
        const required = ["name", "phone", "birthday", "gender", "code"]; // role defaults
        const missing = required.filter(
          (f) => !rowObj[f] || String(rowObj[f]).trim() === ""
        );
        if (missing.length > 0) {
          results.failed.push({
            row: rowIndex,
            field: "required_fields",
            message: `الحقول المطلوبة مفقودة: ${missing.join(", ")}`,
            data: rowObj,
          });
          return;
        }

        // Explicitly disallow any role value in file rows
        if (
          Object.prototype.hasOwnProperty.call(rowObj, "role") &&
          String(rowObj.role || "").trim() !== ""
        ) {
          results.failed.push({
            row: rowIndex,
            field: "role",
            message:
              "غير مسموح بإدخال الدور في الملف. يتم تعيين الدور تلقائياً 'student'",
            data: rowObj,
          });
          return;
        }

        // Basic validations
        // phone format recommended but not enforced as unique. Keep validation if present
        if (!/^\d{11}$/.test(String(rowObj.phone))) {
          results.failed.push({
            row: rowIndex,
            field: "phone",
            message: "رقم الهاتف يجب أن يتكون من 11 رقمًا",
            data: rowObj,
          });
          return;
        }
        const birthday = ensureBirthday(rowObj.birthday);
        if (!birthday || isNaN(birthday.getTime())) {
          results.failed.push({
            row: rowIndex,
            field: "birthday",
            message: "تاريخ الميلاد غير صحيح",
            data: rowObj,
          });
          return;
        }
        const gender = String(rowObj.gender || "").toLowerCase();
        if (!["male", "female"].includes(gender)) {
          results.failed.push({
            row: rowIndex,
            field: "gender",
            message: "الجنس يجب أن يكون male أو female",
            data: rowObj,
          });
          return;
        }

        // Duplicate check by code only (allow duplicate phones)
        const existingUser = await User.findOne({
          where: { code: rowObj.code },
          include: [
            {
              model: Classes,
              as: "class",
              attributes: ["id", "location"],
              required: false,
            },
          ],
        });
        if (existingUser) {
          const conflictType = "code";
          results.existing.push({
            row: rowIndex,
            reason: `المستخدم موجود بالفعل (${conflictType})`,
            conflictType,
            newData: {
              name: String(rowObj.name || ""),
              phone: String(rowObj.phone || ""),
              code: String(rowObj.code || ""),
            },
            existingUser: {
              id: existingUser.id,
              name: existingUser.name,
              phone: existingUser.phone,
              code: existingUser.code,
              role: existingUser.role,
              class_id: existingUser.class_id || null,
              class: existingUser.class
                ? {
                    id: existingUser.class.id,
                    location: existingUser.class.location,
                  }
                : null,
            },
          });
          return;
        }

        // Resolve class/level
        let classIdToUse = bodyClassId;
        let levelIdToUse = bodyLevelId;
        if (!classIdToUse) {
          // Expect 'class' column (Arabic: الفصل/الموقع) with location string
          const classLocation =
            rowObj.class ||
            rowObj.الفصل ||
            rowObj.الموقع ||
            rowObj.class_location ||
            null;
          if (!classLocation) {
            results.failed.push({
              row: rowIndex,
              field: "class",
              message:
                "الفصل غير محدد: أرسل classId في الطلب أو عمود class في الملف",
              data: rowObj,
            });
            return;
          }
          const classItem = await Classes.findOne({
            where: { location: classLocation },
          });
          if (!classItem) {
            results.failed.push({
              row: rowIndex,
              field: "class",
              message: `الفصل غير موجود: ${classLocation}`,
              data: rowObj,
            });
            return;
          }
          classIdToUse = classItem.id;
          levelIdToUse = classItem.level_id;
        }

        // Hash password (use 'password' if provided; else fallback to 'code')
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(
          rowObj.password ? String(rowObj.password) : String(rowObj.code),
          saltRounds
        );

        const newUser = await User.create({
          name: String(rowObj.name),
          phone: String(rowObj.phone),
          password: hashedPassword,
          birthday,
          gender,
          code: String(rowObj.code),
          role: "student",
          level_id: levelIdToUse,
          class_id: classIdToUse,
        });

        const userResponse = { ...newUser.toJSON() };
        delete userResponse.password;
        results.successful.push({ row: rowIndex, user: userResponse });
      } catch (e) {
        // Gracefully handle DB unique constraint errors
        if (e && e.name === "SequelizeUniqueConstraintError") {
          const pathField =
            (e.errors && e.errors[0] && e.errors[0].path) || "";

          if (String(pathField).includes("phone")) {
            // Treat as existing by phone if DB still has unique(phone)
            results.existing.push({
              row: rowIndex,
              reason: "المستخدم موجود بالفعل (phone)",
              conflictType: "phone",
              newData: {
                name: String(rowObj.name || ""),
                phone: String(rowObj.phone || ""),
                code: String(rowObj.code || ""),
              },
              existingUser: {
                id: null,
                name: rowObj.name || "",
                phone: rowObj.phone || "",
                code: rowObj.code || "",
                role: "student",
                class_id: null,
                class: null,
              },
            });
            return;
          }

          if (String(pathField).includes("code")) {
            // Duplicate code (should have been caught earlier) – treat as existing(code)
            results.existing.push({
              row: rowIndex,
              reason: "المستخدم موجود بالفعل (code)",
              conflictType: "code",
              newData: {
                name: String(rowObj.name || ""),
                phone: String(rowObj.phone || ""),
                code: String(rowObj.code || ""),
              },
              existingUser: {
                id: null,
                name: rowObj.name || "",
                phone: rowObj.phone || "",
                code: rowObj.code || "",
                role: "student",
                class_id: null,
                class: null,
              },
            });
            return;
          }
        }

        results.failed.push({
          row: rowIndex,
          field: "system_error",
          message: e.message,
          data: rowObj,
        });
      }
    };

    // Helper to normalize incoming header names (Arabic -> internal keys)
    const normalizeHeader = (h) => {
      const trimmed = String(h || "").trim();
      const lower = trimmed.toLowerCase();
      const map = {
        الاسم: "name",
        الهاتف: "phone",
        "تاريخ الميلاد": "birthday",
        الجنس: "gender",
        الكود: "code",
        الفصل: "class",
        الموقع: "class",
      };
      return map[trimmed] || map[lower] || lower; // fallback to lower for English headers
    };

    if (isCsv) {
      const csvContent = req.file.buffer.toString("utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          message: "الملف فارغ أو يحتوي على صف واحد فقط",
        });
      }
      const rawHeaders = lines[0].split(",").map((h) => h.trim());
      const headers = rawHeaders.map((h) => normalizeHeader(h));
      const requiredHeaders = ["name", "phone", "birthday", "gender", "code"]; // class column optional if body classId is present
      const missingHeaders = requiredHeaders.filter(
        (f) => !headers.includes(f)
      );
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          success: false,
          message: `الحقول المطلوبة مفقودة في الملف: ${missingHeaders.join(
            ", "
          )}`,
        });
      }

      results.total = lines.length - 1;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length < headers.length) continue;
        const rowObj = {};
        headers.forEach((h, index) => {
          rowObj[h] = values[index] || "";
        });
        await upsertFromRow(rowObj, i + 1);
      }
    } else if (isExcel) {
      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return res
          .status(400)
          .json({ success: false, message: "لا يمكن قراءة ورقة Excel الأولى" });
      }
      const headerRow = worksheet.getRow(1);
      const headers = headerRow.values.slice(1).map((v) => normalizeHeader(v));
      const requiredHeaders = ["name", "phone", "birthday", "gender", "code"]; // class column optional if body classId is present
      const missingHeaders = requiredHeaders.filter(
        (f) => !headers.includes(f)
      );
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          success: false,
          message: `الحقول المطلوبة مفقودة في الملف: ${missingHeaders.join(
            ", "
          )}`,
        });
      }

      results.total = 0;
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (!row.values || row.values.length <= 1) continue;
        const rowObj = {};
        headers.forEach((h, idx) => {
          const cell = row.getCell(idx + 1).value;
          rowObj[h] = cell && cell.text !== undefined ? cell.text : cell;
        });
        if (!rowObj.name || Object.keys(rowObj).length <= 1) continue;
        results.total++;
        await upsertFromRow(rowObj, i);
      }
    }

    const summary = {
      totalProcessed: results.total,
      successful: results.successful.length,
      failed: results.failed.length,
      existing: results.existing.length,
      skipped: results.existing.length,
    };

    return res.status(200).json({
      success: true,
      message: `تمت معالجة ${results.total} صف`,
      summary,
      successful: results.successful,
      failed: results.failed,
      existing: results.existing,
      existingUsers: results.existing, // alias for frontend compatibility
      note: "جميع المستخدمين المرفوعين يتم تعيينهم كطلاب تلقائياً",
    });
  } catch (error) {
    console.error("bulkImport error:", error);
    return res.status(500).json({
      success: false,
      message: "فشل في معالجة الملف",
      error: error.message,
    });
  }
};

// New methods for managing teacher/supervisor class associations

// Assign classes to a teacher/supervisor (up to 3 classes)
module.exports.assignClassesToTeacher = async (req, res) => {
  try {
    const { userId, classIds } = req.body;

    // Validate input
    if (!userId || !classIds || !Array.isArray(classIds)) {
      return res.status(400).json({
        success: false,
        message: "معرف المستخدم وقائمة الفصول مطلوبة",
      });
    }

    if (classIds.length > 3) {
      return res.status(400).json({
        success: false,
        message: "لا يمكن تعيين أكثر من 3 فصول للمعلم/المشرف",
      });
    }

    // Check if user exists and is a teacher or supervisor
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    if (!["teacher", "supervisor"].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: "يمكن فقط تعيين فصول للمعلمين والمشرفين",
      });
    }

    // Check if all classes exist
    const classes = await Classes.findAll({
      where: { id: classIds },
    });

    if (classes.length !== classIds.length) {
      return res.status(400).json({
        success: false,
        message: "بعض الفصول غير موجودة",
      });
    }

    // Enforce global cap: teacher may have at most 3 unique classes across
    // both many-to-many mapping (teachingClasses) and subject assignments table.
    const subjectRows =
      await require("../models/teacherSubjectAssignment").findAll({
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
    const subjectClassIds = Array.from(
      new Set((subjectRows || []).map((r) => r.class_id))
    );

    // Compute union between requested classIds and existing subject-linked classes
    const unionCount = new Set([...(classIds || []), ...subjectClassIds]).size;
    if (unionCount > 3) {
      return res.status(400).json({
        success: false,
        message: "إجمالي الفصول المرتبطة بالمعلم يتجاوز الحد الأقصى (3)",
        detail: {
          requested: classIds.length,
          existingSubjectAssignments: subjectClassIds.length,
          allowedMax: 3,
        },
      });
    }

    // Remove existing associations
    await user.setTeachingClasses([]);

    // Add new associations
    await user.addTeachingClasses(classIds);

    // Get updated user with classes
    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: Classes,
          as: "teachingClasses",
          attributes: ["id", "location"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "تم تعيين الفصول بنجاح",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error assigning classes:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تعيين الفصول",
      error: error.message,
    });
  }
};

// Get classes assigned to a teacher/supervisor
module.exports.getTeacherClasses = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Classes,
          as: "teachingClasses",
          attributes: ["id", "location"],
          include: [
            {
              model: Levels,
              as: "level",
              attributes: ["level", "stage"],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    if (!["teacher", "supervisor"].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: "يمكن فقط عرض فصول المعلمين والمشرفين",
      });
    }

    // Get subject-based assignments as well
    const { resolveTeacherClasses } = require("../util/userHelpers");
    const allClasses = await resolveTeacherClasses(userId, user.teachingClasses || []);

    res.status(200).json({
      success: true,
      message: "تم جلب الفصول بنجاح",
      classes: allClasses,
    });
  } catch (error) {
    console.error("Error getting teacher classes:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الفصول",
      error: error.message,
    });
  }
};

// Remove all classes from a teacher/supervisor
module.exports.removeAllClassesFromTeacher = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    if (!["teacher", "supervisor"].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: "يمكن فقط إزالة فصول من المعلمين والمشرفين",
      });
    }

    // Remove all class associations
    await user.setTeachingClasses([]);

    res.status(200).json({
      success: true,
      message: "تم إزالة جميع الفصول بنجاح",
    });
  } catch (error) {
    console.error("Error removing classes:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إزالة الفصول",
      error: error.message,
    });
  }
};

// Get all teachers/supervisors with their assigned classes
module.exports.getTeachersWithClasses = async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: {
        role: {
          [Op.in]: ["teacher", "supervisor"],
        },
      },
      include: [
        {
          model: Classes,
          as: "teachingClasses",
          attributes: ["id", "location"],
          include: [
            {
              model: Levels,
              as: "level",
              attributes: ["level", "stage"],
            },
          ],
        },
      ],
      attributes: ["id", "name", "phone", "code", "role", "image"],
    });

    // Process images to URLs
    const teachersWithImages = await Promise.all(
      teachers.map(async (teacher) => {
        const teacherData = teacher.toJSON();

        if (teacherData.image) {
          const { buildImageUrl } = require("../util/userHelpers");
          teacherData.image = buildImageUrl(req, teacherData.image);
        } else {
          teacherData.image = null;
        }

        return teacherData;
      })
    );

    res.status(200).json({
      success: true,
      message: "تم جلب المعلمين والمشرفين مع فصولهم بنجاح",
      teachers: teachersWithImages,
    });
  } catch (error) {
    console.error("Error getting teachers with classes:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب المعلمين والمشرفين",
      error: error.message,
    });
  }
};

// Bulk import for teachers (CSV or Excel). Field name: 'file'.
module.exports.bulkImportTeachers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "يرجى رفع ملف CSV أو Excel في الحقل 'file'",
      });
    }

    const originalName = (req.file.originalname || "").toLowerCase();
    const isCsv = originalName.endsWith(".csv");
    const isExcel =
      originalName.endsWith(".xlsx") || originalName.endsWith(".xls");

    if (!isCsv && !isExcel) {
      return res.status(400).json({
        success: false,
        message: "صيغة الملف غير مدعومة. استخدم CSV أو Excel فقط",
      });
    }

    const results = {
      total: 0,
      successful: [],
      failed: [],
      existing: [],
    };

    const ensureBirthday = (value) => {
      const ExcelJS = require("exceljs");
      const coerceStringToDate = (strVal) => {
        const str = String(strVal || "").trim();
        if (!str) return null;
        let match = str.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
        if (match) {
          const monthFirst = parseInt(match[1], 10) - 1;
          const daySecond = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          let d = new Date(year, monthFirst, daySecond);
          if (
            !isNaN(d.getTime()) &&
            d.getFullYear() === year &&
            d.getMonth() === monthFirst &&
            d.getDate() === daySecond
          ) {
            return d;
          }
          const dayFirst = parseInt(match[1], 10);
          const monthSecond = parseInt(match[2], 10) - 1;
          d = new Date(year, monthSecond, dayFirst);
          if (
            !isNaN(d.getTime()) &&
            d.getFullYear() === year &&
            d.getMonth() === monthSecond &&
            d.getDate() === dayFirst
          ) {
            return d;
          }
        }
        const iso = new Date(str);
        if (!isNaN(iso.getTime())) return iso;
        return null;
      };
      if (value instanceof Date) return value;
      if (typeof value === "number") {
        const baseDate = new Date(Date.UTC(1899, 11, 30));
        const result = new Date(
          baseDate.getTime() + value * 24 * 60 * 60 * 1000
        );
        return new Date(
          result.getFullYear(),
          result.getMonth(),
          result.getDate()
        );
      }
      if (value && typeof value === "object" && value.text) {
        return coerceStringToDate(value.text);
      }
      return coerceStringToDate(value);
    };

    const upsertFromRow = async (rowObj, rowIndex) => {
      try {
        const required = ["name", "phone", "birthday", "gender", "code", "subject"];
        const missing = required.filter(
          (f) => !rowObj[f] || String(rowObj[f]).trim() === ""
        );
        if (missing.length > 0) {
          results.failed.push({
            row: rowIndex,
            field: "required_fields",
            message: `الحقول المطلوبة مفقودة: ${missing.join(", ")}`,
            data: rowObj,
          });
          return;
        }

        // Basic validations
        if (!/^\d{11}$/.test(String(rowObj.phone))) {
          results.failed.push({
            row: rowIndex,
            field: "phone",
            message: "رقم الهاتف يجب أن يتكون من 11 رقمًا",
            data: rowObj,
          });
          return;
        }
        
        const birthday = ensureBirthday(rowObj.birthday);
        if (!birthday || isNaN(birthday.getTime())) {
          results.failed.push({
            row: rowIndex,
            field: "birthday",
            message: "تاريخ الميلاد غير صحيح",
            data: rowObj,
          });
          return;
        }
        
        const gender = String(rowObj.gender || "").toLowerCase();
        if (!["male", "female"].includes(gender)) {
          results.failed.push({
            row: rowIndex,
            field: "gender",
            message: "الجنس يجب أن يكون male أو female",
            data: rowObj,
          });
          return;
        }

        // Validate subject
        const subject = String(rowObj.subject || "").toLowerCase();
        if (!["taks", "al7an", "coptic"].includes(subject)) {
          results.failed.push({
            row: rowIndex,
            field: "subject",
            message: "التخصص يجب أن يكون taks أو al7an أو coptic",
            data: rowObj,
          });
          return;
        }

        // Duplicate check by code only
        const existingUser = await User.findOne({
          where: { code: rowObj.code },
        });
        if (existingUser) {
          results.existing.push({
            row: rowIndex,
            reason: `المعلم موجود بالفعل (${existingUser.role})`,
            conflictType: "code",
            newData: {
              name: String(rowObj.name || ""),
              phone: String(rowObj.phone || ""),
              code: String(rowObj.code || ""),
              subject: String(rowObj.subject || ""),
            },
            existingUser: {
              id: existingUser.id,
              name: existingUser.name,
              phone: existingUser.phone,
              code: existingUser.code,
              role: existingUser.role,
              subject: existingUser.subject,
            },
          });
          return;
        }

        // Hash password (use 'password' if provided; else fallback to 'code')
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(
          rowObj.password ? String(rowObj.password) : String(rowObj.code),
          saltRounds
        );

        const newUser = await User.create({
          name: String(rowObj.name),
          phone: String(rowObj.phone),
          password: hashedPassword,
          birthday,
          gender,
          code: String(rowObj.code),
          role: "teacher",
          subject: subject,
        });

        const userResponse = { ...newUser.toJSON() };
        delete userResponse.password;
        results.successful.push({ row: rowIndex, user: userResponse });
      } catch (e) {
        if (e && e.name === "SequelizeUniqueConstraintError") {
          const pathField =
            (e.errors && e.errors[0] && e.errors[0].path) || "";

          if (String(pathField).includes("code")) {
            results.existing.push({
              row: rowIndex,
              reason: "المعلم موجود بالفعل (code)",
              conflictType: "code",
              newData: {
                name: String(rowObj.name || ""),
                phone: String(rowObj.phone || ""),
                code: String(rowObj.code || ""),
                subject: String(rowObj.subject || ""),
              },
              existingUser: {
                id: null,
                name: rowObj.name || "",
                phone: rowObj.phone || "",
                code: rowObj.code || "",
                role: "teacher",
                subject: rowObj.subject || "",
              },
            });
            return;
          }
        }

        results.failed.push({
          row: rowIndex,
          field: "system_error",
          message: e.message,
          data: rowObj,
        });
      }
    };

    // Helper to normalize incoming header names (Arabic -> internal keys)
    const normalizeHeader = (h) => {
      const trimmed = String(h || "").trim();
      const lower = trimmed.toLowerCase();
      const map = {
        الاسم: "name",
        الهاتف: "phone",
        "تاريخ الميلاد": "birthday",
        الجنس: "gender",
        الكود: "code",
        التخصص: "subject",
        المادة: "subject",
      };
      return map[trimmed] || map[lower] || lower;
    };

    if (isCsv) {
      const csvContent = req.file.buffer.toString("utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          message: "الملف فارغ أو يحتوي على صف واحد فقط",
        });
      }
      const rawHeaders = lines[0].split(",").map((h) => h.trim());
      const headers = rawHeaders.map((h) => normalizeHeader(h));
      const requiredHeaders = ["name", "phone", "birthday", "gender", "code", "subject"];
      const missingHeaders = requiredHeaders.filter(
        (f) => !headers.includes(f)
      );
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          success: false,
          message: `الحقول المطلوبة مفقودة في الملف: ${missingHeaders.join(
            ", "
          )}`,
        });
      }

      results.total = lines.length - 1;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length < headers.length) continue;
        const rowObj = {};
        headers.forEach((h, index) => {
          rowObj[h] = values[index] || "";
        });
        await upsertFromRow(rowObj, i + 1);
      }
    } else if (isExcel) {
      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return res
          .status(400)
          .json({ success: false, message: "لا يمكن قراءة ورقة Excel الأولى" });
      }
      const headerRow = worksheet.getRow(1);
      const headers = headerRow.values.slice(1).map((v) => normalizeHeader(v));
      const requiredHeaders = ["name", "phone", "birthday", "gender", "code", "subject"];
      const missingHeaders = requiredHeaders.filter(
        (f) => !headers.includes(f)
      );
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          success: false,
          message: `الحقول المطلوبة مفقودة في الملف: ${missingHeaders.join(
            ", "
          )}`,
        });
      }

      results.total = 0;
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (!row.values || row.values.length <= 1) continue;
        const rowObj = {};
        headers.forEach((h, idx) => {
          const cell = row.getCell(idx + 1).value;
          rowObj[h] = cell && cell.text !== undefined ? cell.text : cell;
        });
        if (!rowObj.name || Object.keys(rowObj).length <= 1) continue;
        results.total++;
        await upsertFromRow(rowObj, i);
      }
    }

    const summary = {
      totalProcessed: results.total,
      successful: results.successful.length,
      failed: results.failed.length,
      existing: results.existing.length,
      skipped: results.existing.length,
    };

    return res.status(200).json({
      success: true,
      message: `تمت معالجة ${results.total} صف`,
      summary,
      successful: results.successful,
      failed: results.failed,
      existing: results.existing,
      existingUsers: results.existing,
      note: "جميع المستخدمين المرفوعين يتم تعيينهم كمعلمين تلقائياً",
    });
  } catch (error) {
    console.error("bulkImportTeachers error:", error);
    return res.status(500).json({
      success: false,
      message: "فشل في معالجة الملف",
      error: error.message,
    });
  }
};

// Get school statistics
module.exports.getSchoolStats = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const Classes = require("../models/classes");
    const Levels = require("../models/levels");

    // Get user counts by role
    const userStats = await User.findAll({
      attributes: [
        "role",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["role"],
      raw: true,
    });

    // Get total users count
    const totalUsers = await User.count();

    // Get total classes count
    const totalClasses = await Classes.count();

    // Get total levels count
    const totalLevels = await Levels.count();

    // Get classes count by level with level info
    const classesByLevel = await Classes.findAll({
      attributes: [
        "level_id",
        [sequelize.fn("COUNT", sequelize.col("Classes.id")), "count"],
      ],
      include: [
        {
          model: Levels,
          as: "level",
          attributes: ["level", "stage"],
        },
      ],
      group: ["level_id"],
      raw: true,
    });

    // Get students count by level with level info
    const studentsByLevel = await User.findAll({
      attributes: [
        "level_id",
        [sequelize.fn("COUNT", sequelize.col("User.id")), "count"],
      ],
      where: { role: "student" },
      include: [
        {
          model: Levels,
          as: "level",
          attributes: ["level", "stage"],
        },
      ],
      group: ["level_id"],
      raw: true,
    });

    // Convert to more usable format
    const roleCounts = {};
    userStats.forEach((stat) => {
      roleCounts[stat.role] = parseInt(stat.count);
    });

    const classesByLevelMap = {};
    classesByLevel.forEach((stat) => {
      classesByLevelMap[stat.level_id] = parseInt(stat.count);
    });

    // Create a more readable students by level mapping
    const studentsByLevelMap = {};
    studentsByLevel.forEach((stat) => {
      const level = stat["level.level"];
      const stage = stat["level.stage"];

      if (level === 0) {
        studentsByLevelMap["preparatory"] =
          (studentsByLevelMap["preparatory"] || 0) + parseInt(stat.count);
      } else {
        const key = `level${level}`;
        studentsByLevelMap[key] =
          (studentsByLevelMap[key] || 0) + parseInt(stat.count);
      }
    });

    const stats = {
      users: {
        total: totalUsers,
        students: roleCounts.student || 0,
        teachers: roleCounts.teacher || 0,
        admins: roleCounts.admin || 0,
        supervisors: roleCounts.supervisor || 0,
      },
      classes: {
        total: totalClasses,
        byLevel: classesByLevelMap,
      },
      levels: {
        total: totalLevels,
        studentsByLevel: studentsByLevelMap,
      },
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error getting school stats:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب إحصائيات المدرسة",
    });
  }
};
