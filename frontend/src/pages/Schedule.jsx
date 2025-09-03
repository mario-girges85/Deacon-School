import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const SUBJECT_LABELS = { taks: "طقس", al7an: "ألحان", coptic: "قبطي" };

const Schedule = () => {
  const [teachersBySubject, setTeachersBySubject] = useState({
    taks: [],
    al7an: [],
    coptic: [],
  });
  const [selectedTeachers, setSelectedTeachers] = useState({
    taks: [],
    al7an: [],
    coptic: [],
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [editedRows, setEditedRows] = useState(null); // local editable schedule
  const [error, setError] = useState("");
  const [dragInfo, setDragInfo] = useState(null); // { classId, slotKey }

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/teachers-by-subject`
        );

        if (res.data.success) {
          const { teachersBySubject } = res.data;
          setTeachersBySubject(teachersBySubject);
          setSelectedTeachers({
            taks: teachersBySubject.taks.map((t) => t.id),
            al7an: teachersBySubject.al7an.map((t) => t.id),
            coptic: teachersBySubject.coptic.map((t) => t.id),
          });
        } else {
          setTeachersBySubject({ taks: [], al7an: [], coptic: [] });
        }
      } catch (e) {
        console.error("Error fetching teachers:", e);
        setTeachersBySubject({ taks: [], al7an: [], coptic: [] });
      }
    };
    fetchTeachers();
  }, []);

  const teacherNameById = useMemo(() => {
    const map = new Map();
    Object.values(teachersBySubject).forEach((arr) => {
      (arr || []).forEach((t) => {
        map.set(t.id, t.name);
      });
    });
    return map;
  }, [teachersBySubject]);

  const teacherSubjectById = useMemo(() => {
    const map = new Map();
    Object.entries(teachersBySubject).forEach(([subject, arr]) => {
      (arr || []).forEach((t) => map.set(t.id, subject));
    });
    return map;
  }, [teachersBySubject]);

  const toggleTeacher = (subject, teacherId, checked) => {
    setSelectedTeachers((prev) => {
      const set = new Set(prev[subject] || []);
      if (checked) set.add(teacherId);
      else set.delete(teacherId);
      return { ...prev, [subject]: Array.from(set) };
    });
  };

  const generate = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);
      setEditedRows(null);
      const payload = { subjectTeachers: selectedTeachers };
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/schedule/generate`,
        payload
      );
      setResult(res.data);
      setEditedRows(res.data.rows);
    } catch (e) {
      setError(e?.response?.data?.error || "فشل توليد الجدول");
    } finally {
      setLoading(false);
    }
  };

  // Validation helpers
  const validateSchedule = (rows) => {
    const MAX_CLASSES_PER_TEACHER = 3;
    const teacherTotal = new Map(); // id -> count
    const teacherBySlot = { A: new Set(), B: new Set(), C: new Set() };

    for (const row of rows) {
      // Class must have three distinct subjects
      const subjSet = new Set([row.A?.subject, row.B?.subject, row.C?.subject]);
      if (subjSet.size !== 3) {
        return {
          ok: false,
          message: `الفصل ${row.class.location} يجب أن يحتوي على المواد الثلاث دون تكرار`,
        };
      }

      for (const slotKey of ["A", "B", "C"]) {
        const cell = row[slotKey];
        const tId = cell?.teacherId;
        if (!tId) continue;
        // subject specialty match
        const specialty = teacherSubjectById.get(tId);
        if (specialty && specialty !== cell.subject) {
          return {
            ok: false,
            message: `المعلم ${
              teacherNameById.get(tId) || tId
            } ليس متخصصًا في مادة ${
              SUBJECT_LABELS[cell.subject] || cell.subject
            }`,
          };
        }
        // per-slot uniqueness
        if (teacherBySlot[slotKey].has(tId)) {
          return {
            ok: false,
            message: `لا يمكن تعيين المعلم ${
              teacherNameById.get(tId) || tId
            } لفصلين في نفس الفترة`,
          };
        }
        teacherBySlot[slotKey].add(tId);
        // total cap
        teacherTotal.set(tId, (teacherTotal.get(tId) || 0) + 1);
        if (teacherTotal.get(tId) > MAX_CLASSES_PER_TEACHER) {
          return {
            ok: false,
            message: `المعلم ${
              teacherNameById.get(tId) || tId
            } تجاوز الحد الأقصى (3 فصول)`,
          };
        }
      }
    }
    return { ok: true };
  };

  const handleDragStart = (classId, slotKey) => {
    setDragInfo({ classId, slotKey });
  };

  const handleDrop = (targetClassId, targetSlotKey) => {
    if (!dragInfo || !editedRows) return;
    const { classId: sourceClassId, slotKey: sourceSlotKey } = dragInfo;
    setDragInfo(null);
    if (sourceClassId === targetClassId && sourceSlotKey === targetSlotKey)
      return;
    // simulate swap then validate
    const next = editedRows.map((row) => ({
      ...row,
      A: { ...row.A },
      B: { ...row.B },
      C: { ...row.C },
    }));
    const findRow = (cid) => next.find((r) => r.class.id === cid);
    const sRow = findRow(sourceClassId);
    const tRow = findRow(targetClassId);
    if (!sRow || !tRow) return;
    const tmp = { ...sRow[sourceSlotKey] };
    sRow[sourceSlotKey] = { ...tRow[targetSlotKey] };
    tRow[targetSlotKey] = tmp;

    const validation = validateSchedule(next);
    if (!validation.ok) {
      alert(validation.message);
      return; // reject change
    }
    setEditedRows(next);
  };

  const handleSubmit = async () => {
    if (!editedRows) return;
    try {
      setLoading(true);
      setError("");
      // First validate (no persistence)
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/schedule/apply`,
        { rows: editedRows }
      );
      // Then save
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/schedule/save`,
        { rows: editedRows }
      );
      alert(res.data?.message || "تم حفظ الجدول بنجاح");
    } catch (e) {
      setError(e?.response?.data?.error || "تعذر حفظ الجدول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            جدولة المعلمين
          </h1>
          <p className="text-gray-600">
            اختر معلمي كل مادة من القوائم، ثم اضغط توليد. يمكنك سحب أي خانة
            وإفلاتها للتبديل قبل الإرسال.
          </p>
        </div>

        {/* Select teachers per subject (no IDs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(SUBJECT_LABELS).map(([key, label]) => (
            <div key={key} className="bg-white border rounded-md p-4">
              <h3 className="font-semibold mb-2">{label}</h3>
              {teachersBySubject[key].length === 0 ? (
                <p className="text-sm text-gray-500">
                  لا يوجد معلمون لهذا التخصص
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {teachersBySubject[key].map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={(selectedTeachers[key] || []).includes(t.id)}
                        onChange={(e) =>
                          toggleTeacher(key, t.id, e.target.checked)
                        }
                      />
                      <span>{t.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={generate}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "جارٍ التوليد..." : "توليد الجدول"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !editedRows}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            إرسال الجدول
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Visualization */}
        {editedRows && result && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">النتيجة</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="border px-3 py-2 text-right">الفصل</th>
                    {result.timeSlots.map((ts) => (
                      <th key={ts.key} className="border px-3 py-2 text-right">
                        {ts.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editedRows.map((row) => (
                    <tr key={row.class.id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-right">
                        <div className="font-medium">{row.class.location}</div>
                        <div className="text-xs text-gray-500">
                          المستوى {row.class.level?.level} - المرحلة{" "}
                          {row.class.level?.stage}
                        </div>
                      </td>
                      {result.timeSlots.map((ts) => {
                        const cell = row[ts.key];
                        const teacherName = cell.teacherId
                          ? teacherNameById.get(cell.teacherId) ||
                            cell.teacherId
                          : null;
                        return (
                          <td
                            key={ts.key}
                            className="border px-3 py-2 text-right cursor-move select-none"
                            draggable
                            onDragStart={() =>
                              handleDragStart(row.class.id, ts.key)
                            }
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(row.class.id, ts.key)}
                            title="اسحب وافلت للتبديل"
                          >
                            <div className="font-medium">
                              {SUBJECT_LABELS[cell.subject] || cell.subject}
                            </div>
                            <div
                              className={`text-xs ${
                                teacherName ? "text-green-700" : "text-red-700"
                              }`}
                            >
                              {teacherName
                                ? `معلم: ${teacherName}`
                                : "غير معيّن"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.unmet && result.unmet.length > 0 && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800">
                <h3 className="font-semibold mb-2">غير المعيّنين</h3>
                <ul className="list-disc list-inside text-sm">
                  {result.unmet.map((u, i) => (
                    <li key={i}>
                      فصل: {u.className || u.classId}, فترة: {u.slot}, مادة:{" "}
                      {SUBJECT_LABELS[u.subject] || u.subject} — {u.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
