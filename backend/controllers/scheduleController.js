const { User, Classes, Levels } = require("../models/relationships");
const TeacherSubjectAssignment = require("../models/teacherSubjectAssignment");
const { Op } = require("sequelize");

// Fixed time slots
const TIME_SLOTS = [
  { key: "A", label: "3:30 - 4:10" },
  { key: "B", label: "4:25 - 5:05" },
  { key: "C", label: "5:20 - 6:00" },
];

// Subjects (order matters for cyclic permutation)
const SUBJECTS = ["taks", "al7an", "coptic"];

// Generate cyclic subject→slot template offset by class index
function getSubjectSlotForClassIndex(classIndex) {
  // For a class i, rotate subjects by i % 3 across slots A,B,C
  const mapping = {};
  for (let s = 0; s < SUBJECTS.length; s += 1) {
    const slotIndex = s; // A,B,C in order
    const subjectIndex = (s + (classIndex % 3)) % SUBJECTS.length;
    mapping[TIME_SLOTS[slotIndex].key] = SUBJECTS[subjectIndex];
  }
  return mapping; // { A: subjX, B: subjY, C: subjZ }
}

// Greedy assign teachers per subject and slot with constraints
function assignTeachersGreedy({
  classes,
  subjectSlotByClass,
  subjectTeachers,
}) {
  // Track teacher usage per slot and total
  const teacherUsage = {}; // { teacherId: { total: n, slots: Set<slotKey> } }
  const MAX_CLASSES_PER_TEACHER = 3;

  const schedule = {}; // { classId: { A: { subject, teacherId }, B:..., C:... } }
  const unmet = []; // { classId, className, slot, subject, reason }

  // Initialize schedule shells
  classes.forEach((c) => {
    schedule[c.id] = {
      A: { subject: subjectSlotByClass[c.id].A, teacherId: null },
      B: { subject: subjectSlotByClass[c.id].B, teacherId: null },
      C: { subject: subjectSlotByClass[c.id].C, teacherId: null },
    };
  });

  for (const subject of SUBJECTS) {
    const teachers = (subjectTeachers[subject] || []).slice();
    // Sort teachers by current load (fewest assigned first)
    const sortTeachers = () =>
      teachers.sort((t1, t2) => {
        const u1 = teacherUsage[t1]?.total || 0;
        const u2 = teacherUsage[t2]?.total || 0;
        return u1 - u2;
      });

    for (const slot of TIME_SLOTS) {
      // Collect classes needing this subject in this slot
      const needing = classes.filter(
        (c) => subjectSlotByClass[c.id][slot.key] === subject
      );

      for (const cls of needing) {
        sortTeachers();
        let assigned = false;
        for (const teacherId of teachers) {
          const usage = teacherUsage[teacherId] || {
            total: 0,
            slots: new Set(),
          };
          if (usage.total >= MAX_CLASSES_PER_TEACHER) continue;
          if (usage.slots.has(slot.key)) continue; // cannot teach 2 classes at same slot

          // assign
          schedule[cls.id][slot.key].teacherId = teacherId;
          usage.total += 1;
          usage.slots.add(slot.key);
          teacherUsage[teacherId] = usage;
          assigned = true;
          break;
        }
        if (!assigned) {
          unmet.push({
            classId: cls.id,
            className: cls.location,
            slot: slot.key,
            subject,
            reason: "no available teacher (capacity/slot conflict)",
          });
        }
      }
    }
  }

  return { schedule, unmet };
}

module.exports.generateSchedule = async (req, res) => {
  try {
    const { classIds = null } = req.body || {};
    let { subjectTeachers = {} } = req.body || {};

    // Load classes (optionally filtered) and keep only those with a level
    const where = { level_id: { [Op.ne]: null } };
    if (Array.isArray(classIds) && classIds.length) where.id = classIds;
    const classes = await Classes.findAll({
      where,
      include: [{ model: Levels, as: "level", attributes: ["level", "stage"] }],
      order: [
        [{ model: Levels, as: "level" }, "level", "ASC"],
        [{ model: Levels, as: "level" }, "stage", "ASC"],
      ],
    });

    // Build subject→slot mapping per class (cyclic by index)
    const subjectSlotByClass = {};
    classes.forEach((c, idx) => {
      subjectSlotByClass[c.id] = getSubjectSlotForClassIndex(idx);
    });

    // If subjectTeachers is empty or missing subjects, auto-fill from DB
    const hasAny = Object.values(subjectTeachers || {}).some(
      (arr) => Array.isArray(arr) && arr.length
    );
    if (!hasAny) {
      const teachers = await User.findAll({
        where: { role: "teacher", subject: { [Op.in]: SUBJECTS } },
        attributes: ["id", "subject"],
      });
      const map = { taks: [], al7an: [], coptic: [] };
      teachers.forEach((t) => {
        if (map[t.subject]) map[t.subject].push(t.id);
      });
      subjectTeachers = map;
    } else {
      // ensure keys for all subjects exist
      SUBJECTS.forEach((s) => {
        if (!Array.isArray(subjectTeachers[s])) subjectTeachers[s] = [];
      });
    }

    // Compute schedule
    const { schedule, unmet } = assignTeachersGreedy({
      classes,
      subjectSlotByClass,
      subjectTeachers,
    });

    // Build response matrix for UI
    const rows = classes.map((c) => ({
      class: { id: c.id, location: c.location, level: c.level },
      A: schedule[c.id].A,
      B: schedule[c.id].B,
      C: schedule[c.id].C,
    }));

    return res.json({
      success: true,
      timeSlots: TIME_SLOTS,
      subjects: SUBJECTS,
      subjectSlotByClass,
      rows,
      unmet,
    });
  } catch (error) {
    console.error("generateSchedule error:", error);
    return res
      .status(500)
      .json({ success: false, error: "schedule generation failed" });
  }
};

// Validate a proposed schedule without persisting
module.exports.applySchedule = async (req, res) => {
  try {
    const { rows } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "rows array required" });
    }

    // Load all teachers once for validation
    const teachers = await User.findAll({
      where: { role: "teacher" },
      attributes: ["id", "name", "subject"],
    });
    const teacherById = new Map(
      teachers.map((t) => [t.id, { name: t.name, subject: t.subject }])
    );

    const MAX_CLASSES_PER_TEACHER = 3;
    const teacherTotals = new Map();
    const teacherBySlot = { A: new Set(), B: new Set(), C: new Set() };
    const conflicts = [];

    for (const row of rows) {
      // ensure class object
      if (!row?.class?.id) {
        conflicts.push({
          type: "missing_class_info",
          classId: row?.class?.id || "unknown",
          message: "Row missing class info"
        });
        continue;
      }
      
      // class must have 3 distinct subjects
      const subjSet = new Set([row.A?.subject, row.B?.subject, row.C?.subject]);
      if (subjSet.size !== 3) {
        conflicts.push({
          type: "duplicate_subjects",
          classId: row.class.id,
          className: row.class.location || row.class.id,
          message: `Class ${row.class.location || row.class.id} must include 3 distinct subjects`
        });
      }

      for (const slotKey of ["A", "B", "C"]) {
        const cell = row[slotKey];
        if (!cell) continue;
        const tId = cell.teacherId;
        if (!tId) continue; // allow unassigned
        const t = teacherById.get(tId);
        if (!t) {
          conflicts.push({
            type: "unknown_teacher",
            classId: row.class.id,
            className: row.class.location || row.class.id,
            slot: slotKey,
            teacherId: tId,
            message: `Unknown teacher ${tId}`
          });
          continue;
        }
        
        // subject specialty check
        if (t.subject && t.subject !== cell.subject) {
          conflicts.push({
            type: "subject_mismatch",
            classId: row.class.id,
            className: row.class.location || row.class.id,
            slot: slotKey,
            teacherId: tId,
            teacherName: t.name,
            subject: cell.subject,
            teacherSpecialty: t.subject,
            message: `Teacher ${t.name} is not specialized in ${cell.subject}`
          });
        }
        
        // per-slot uniqueness
        if (teacherBySlot[slotKey].has(tId)) {
          conflicts.push({
            type: "slot_conflict",
            classId: row.class.id,
            className: row.class.location || row.class.id,
            slot: slotKey,
            teacherId: tId,
            teacherName: t.name,
            message: `Teacher ${t.name} appears twice in slot ${slotKey}`
          });
        } else {
          teacherBySlot[slotKey].add(tId);
        }
        
        // total cap
        teacherTotals.set(tId, (teacherTotals.get(tId) || 0) + 1);
        if (teacherTotals.get(tId) > MAX_CLASSES_PER_TEACHER) {
          conflicts.push({
            type: "teacher_overload",
            classId: row.class.id,
            className: row.class.location || row.class.id,
            slot: slotKey,
            teacherId: tId,
            teacherName: t.name,
            currentLoad: teacherTotals.get(tId),
            maxLoad: MAX_CLASSES_PER_TEACHER,
            message: `Teacher ${t.name} exceeds max ${MAX_CLASSES_PER_TEACHER} classes (currently ${teacherTotals.get(tId)})`
          });
        }
      }
    }

    const isValid = conflicts.length === 0;
    
    return res.json({
      success: isValid,
      message: isValid ? "Schedule is valid. Not persisted." : "Schedule has conflicts.",
      conflicts: conflicts,
      conflictCount: conflicts.length
    });
  } catch (error) {
    console.error("applySchedule error:", error);
    return res.status(500).json({ success: false, error: "apply failed" });
  }
};

// Persist schedule to DB (per-class subject teacher mapping)
module.exports.saveSchedule = async (req, res) => {
  try {
    const { rows } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "rows array required" });
    }

    // Reuse apply validation first
    const teachers = await User.findAll({
      where: { role: "teacher" },
      attributes: ["id", "name", "subject"],
    });
    const teacherById = new Map(
      teachers.map((t) => [t.id, { name: t.name, subject: t.subject }])
    );
    const MAX = 3;
    const totals = new Map();
    const bySlot = { A: new Set(), B: new Set(), C: new Set() };
    for (const row of rows) {
      const subjSet = new Set([row.A?.subject, row.B?.subject, row.C?.subject]);
      if (subjSet.size !== 3)
        return res.status(400).json({
          success: false,
          error: `Class ${
            row.class?.location || row.class?.id
          } must include 3 distinct subjects`,
        });
      for (const slotKey of ["A", "B", "C"]) {
        const tId = row[slotKey]?.teacherId;
        if (!tId) continue;
        const t = teacherById.get(tId);
        if (!t)
          return res
            .status(400)
            .json({ success: false, error: `Unknown teacher ${tId}` });
        if (t.subject && t.subject !== row[slotKey].subject)
          return res.status(400).json({
            success: false,
            error: `Teacher ${t.name} is not specialized in ${row[slotKey].subject}`,
          });
        if (bySlot[slotKey].has(tId))
          return res.status(400).json({
            success: false,
            error: `Teacher ${t.name} appears twice in slot ${slotKey}`,
          });
        bySlot[slotKey].add(tId);
        totals.set(tId, (totals.get(tId) || 0) + 1);
        if (totals.get(tId) > MAX)
          return res.status(400).json({
            success: false,
            error: `Teacher ${t.name} exceeds max 3 classes`,
          });
      }
    }

    // Persist per-class subject assignments
    for (const row of rows) {
      const classId = row.class?.id;
      if (!classId) continue;
      // Determine teacher per subject from slots
      const findTeacherFor = (subject) => {
        for (const key of ["A", "B", "C"]) {
          const cell = row[key];
          if (cell && cell.subject === subject) return cell.teacherId || null;
        }
        return null;
      };
      const payload = {
        class_id: classId,
        taks_teacher_id: findTeacherFor("taks"),
        al7an_teacher_id: findTeacherFor("al7an"),
        coptic_teacher_id: findTeacherFor("coptic"),
      };
      const [record, created] = await TeacherSubjectAssignment.findOrCreate({
        where: { class_id: classId },
        defaults: payload,
      });
      if (!created) {
        await record.update(payload);
      }
    }

    return res.json({ success: true, message: "تم حفظ الجدول بنجاح" });
  } catch (error) {
    console.error("saveSchedule error:", error);
    return res.status(500).json({ success: false, error: "save failed" });
  }
};

// Fetch the currently saved schedule from DB
module.exports.getCurrentSchedule = async (req, res) => {
  try {
    // Load classes with levels (ordered consistently)
    const classes = await Classes.findAll({
      where: { level_id: { [Op.ne]: null } },
      include: [
        { model: Levels, as: "level", attributes: ["level", "stage"] },
        { model: TeacherSubjectAssignment, as: "teacherAssignment" },
      ],
      order: [
        [{ model: Levels, as: "level" }, "level", "ASC"],
        [{ model: Levels, as: "level" }, "stage", "ASC"],
      ],
    });

    // Preload teachers for name/subject mapping (optional, can be used by UI)
    const teachers = await User.findAll({
      where: { role: "teacher", subject: { [Op.in]: SUBJECTS } },
      attributes: ["id", "name", "subject"],
    });
    const teacherById = new Map(teachers.map((t) => [t.id, t]));

    // Build subject→slot mapping per class (same as generator, to keep UI shape)
    const subjectSlotByClass = {};
    classes.forEach((c, idx) => {
      subjectSlotByClass[c.id] = getSubjectSlotForClassIndex(idx);
    });

    // Construct rows using saved teacher assignments
    const rows = classes.map((c) => {
      const assign = c.teacherAssignment || {};
      const teacherForSubject = (subject) => {
        if (subject === "taks") return assign.taks_teacher_id || null;
        if (subject === "al7an") return assign.al7an_teacher_id || null;
        if (subject === "coptic") return assign.coptic_teacher_id || null;
        return null;
      };

      // Determine which subject is in each slot for this class index
      const slotMap = subjectSlotByClass[c.id];
      const buildCell = (slotKey) => {
        const subject = slotMap[slotKey];
        const teacherId = teacherForSubject(subject);
        return { subject, teacherId };
      };

      return {
        class: { id: c.id, location: c.location, level: c.level },
        A: buildCell("A"),
        B: buildCell("B"),
        C: buildCell("C"),
      };
    });

    return res.json({
      success: true,
      timeSlots: TIME_SLOTS,
      subjects: SUBJECTS,
      subjectSlotByClass,
      rows,
      teacherLookup: Object.fromEntries(
        Array.from(teacherById.entries()).map(([id, t]) => [
          id,
          { name: t.name, subject: t.subject },
        ])
      ),
    });
  } catch (error) {
    console.error("getCurrentSchedule error:", error);
    return res.status(500).json({ success: false, error: "fetch failed" });
  }
};
