import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  isAuthenticated,
  isAdmin,
  getAuthHeaders,
  notifyForbidden,
} from "../util/auth";

const SUBJECT_LABELS = { taks: "طقس", al7an: "ألحان", coptic: "قبطي" };
const SUBJECT_STYLES = {
  taks: {
    icon: "📜",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    cellBg: "bg-blue-50/40",
    cellRing: "ring-blue-200",
  },
  al7an: {
    icon: "🎵",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
    cellBg: "bg-purple-50/40",
    cellRing: "ring-purple-200",
  },
  coptic: {
    icon: "✝️",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900",
    cellBg: "bg-amber-50/40",
    cellRing: "ring-amber-200",
  },
};

const Schedule = () => {
  const navigate = useNavigate();
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
  const [isEditing, setIsEditing] = useState(false);
  const [showTeacherSelection, setShowTeacherSelection] = useState(false);
  const [error, setError] = useState("");
  const [dragInfo, setDragInfo] = useState(null); // { classId, slotKey }

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    if (!isAdmin()) {
      notifyForbidden();
      navigate("/");
      return;
    }
    const fetchTeachers = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/teachers-by-subject`,
          { headers: { ...getAuthHeaders() } }
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
    const fetchExistingSchedule = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/schedule/current`,
          { headers: { ...getAuthHeaders() } }
        );
        if (
          res.data?.success &&
          Array.isArray(res.data.rows) &&
          res.data.rows.length > 0
        ) {
          setResult(res.data);
          setEditedRows(res.data.rows);
        }
      } catch (e) {
        // ignore if none exists
      }
    };
    fetchTeachers();
    fetchExistingSchedule();
  }, [navigate]);

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
      // First click reveals selection UI; second click actually generates
      if (!showTeacherSelection) {
        setShowTeacherSelection(true);
        return;
      }
      setLoading(true);
      setError("");
      setResult(null);
      setEditedRows(null);
      const payload = { subjectTeachers: selectedTeachers };
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/schedule/generate`,
        payload,
        { headers: { ...getAuthHeaders() } }
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
    if (!isEditing) return;
    setDragInfo({ classId, slotKey });
  };

  const handleDrop = (targetClassId, targetSlotKey) => {
    if (!isEditing) return;
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
    // Confirm when there are changes
    const serialize = (rows) => JSON.stringify(rows);
    const changed =
      serialize(result?.rows || []) !== serialize(editedRows || []);
    if (changed) {
      const ok = window.confirm("هل تريد حفظ التغييرات الحالية على الجدول؟");
      if (!ok) return;
    }
    try {
      setLoading(true);
      setError("");
      // First validate (no persistence)
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/schedule/apply`,
        { rows: editedRows },
        { headers: { ...getAuthHeaders() } }
      );
      // Then save
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/schedule/save`,
        { rows: editedRows },
        { headers: { ...getAuthHeaders() } }
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

        {/* Select teachers per subject (only after first Generate click) */}
        {showTeacherSelection && (
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
        )}

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={generate}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "جارٍ التوليد..."
              : showTeacherSelection
              ? "توليد الجدول"
              : "اختيار المعلمين"}
          </button>
          {showTeacherSelection && (
            <button
              onClick={() => setShowTeacherSelection(false)}
              disabled={loading}
              className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              إلغاء
            </button>
          )}
          {result && (
            <>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={loading || !editedRows}
                  className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  تعديل الجدول
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (result?.rows) setEditedRows(result.rows);
                  }}
                  disabled={loading}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  إلغاء التعديل
                </button>
              )}
            </>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !editedRows || !isEditing}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            حفظ الجدول
          </button>
          {isEditing && (
            <span className="text-sm text-yellow-700">وضع التعديل مفعل</span>
          )}
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
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                {Object.entries(SUBJECT_LABELS).map(([k, label]) => {
                  const s = SUBJECT_STYLES[k] || {};
                  return (
                    <span
                      key={k}
                      className={`inline-flex items-center gap-2 px-2 py-1 rounded-full ${s.badgeBg} ${s.badgeText}`}
                    >
                      <span>{s.icon}</span>
                      <span>{label}</span>
                    </span>
                  );
                })}
              </div>
              <table className="min-w-full bg-white border rounded-md overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-3 text-right font-semibold">
                      الفصل
                    </th>
                    {result.timeSlots.map((ts) => (
                      <th
                        key={ts.key}
                        className="border px-3 py-3 text-right font-semibold"
                      >
                        {ts.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editedRows.map((row) => (
                    <tr
                      key={row.class.id}
                      className="odd:bg-white even:bg-gray-50/50"
                    >
                      <td className="border px-3 py-3 text-right align-top">
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
                        const s = SUBJECT_STYLES[cell.subject] || {};
                        return (
                          <td
                            key={ts.key}
                            className={`border px-3 py-3 text-right select-none transition ${
                              isEditing
                                ? "cursor-move"
                                : "cursor-default opacity-90"
                            } ${s.cellBg} hover:ring-1 ${s.cellRing}`}
                            draggable={isEditing}
                            onDragStart={() =>
                              handleDragStart(row.class.id, ts.key)
                            }
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(row.class.id, ts.key)}
                            title="اسحب وافلت للتبديل"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${s.badgeBg} ${s.badgeText}`}
                              >
                                <span>{s.icon}</span>
                                <span className="font-medium">
                                  {SUBJECT_LABELS[cell.subject] || cell.subject}
                                </span>
                              </span>
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                  teacherName
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {teacherName
                                  ? `معلم: ${teacherName}`
                                  : "غير معيّن"}
                              </span>
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
