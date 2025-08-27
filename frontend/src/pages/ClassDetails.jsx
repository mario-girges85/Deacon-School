import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import UsersTable from "../components/UsersTable";

const ClassDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState({
    taks_teacher_id: null,
    al7an_teacher_id: null,
    coptic_teacher_id: null,
  });
  const [savingAssignments, setSavingAssignments] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClassDetails();
    }
  }, [id]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);

      const [classResponse, usersResponse, assignResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/classes/${id}`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users/get-users`),
        axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/classes/${id}/teacher-assignments`
        ),
      ]);

      if (!classResponse.data?.success) {
        setError("فشل في جلب تفاصيل الفصل");
        setClassData(null);
      } else {
        setClassData(classResponse.data.class);
      }

      if (
        usersResponse.data?.success &&
        Array.isArray(usersResponse.data.users)
      ) {
        // Users payload now includes both students (single class) and teachers' classes list.
        // We need only students with class_id === id
        const filteredStudents = usersResponse.data.users.filter(
          (user) => user.role === "student" && user.class_id === id
        );
        setStudents(filteredStudents);

        // Collect teachers and supervisors for assignment dropdowns
        const teacherUsers = usersResponse.data.users.filter((u) =>
          ["teacher", "supervisor"].includes(u.role)
        );
        setTeachers(teacherUsers);
      } else {
        setStudents([]);
      }

      if (assignResponse.data?.success) {
        setAssignments({
          taks_teacher_id: assignResponse.data.assignments.taks_teacher_id,
          al7an_teacher_id: assignResponse.data.assignments.al7an_teacher_id,
          coptic_teacher_id: assignResponse.data.assignments.coptic_teacher_id,
        });
      }
    } catch (error) {
      setError("حدث خطأ أثناء جلب تفاصيل الفصل");
    } finally {
      setLoading(false);
    }
  };

  const saveAssignments = async () => {
    try {
      // Partial updates allowed: backend preserves existing assignments for omitted fields
      setSavingAssignments(true);
      await axios
        .put(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/classes/${id}/teacher-assignments`,
          assignments
        )
        .then(() => {
          alert("تم حفظ التعيينات بنجاح");
        })
        .catch((e) => {
          const msg = e?.response?.data?.error || "تعذر حفظ التعيينات";
          alert(msg);
        });
    } catch (e) {
      alert("تعذر حفظ التعيينات");
    } finally {
      setSavingAssignments(false);
    }
  };

  const getLevelName = (level) => {
    switch (level) {
      case 0:
        return "المستوى التمهيدي";
      case 1:
        return "المستوى الأول";
      case 2:
        return "المستوى الثاني";
      case 3:
        return "المستوى الثالث";
      default:
        return `المستوى ${level}`;
    }
  };

  const getStageName = (stage, level) => {
    switch (stage) {
      case 1:
        return "المرحلة الأولى";
      case 2:
        return "المرحلة الثانية";
      case 3:
        if (level === 0) {
          return "مرحلة غير صحيحة";
        }
        return "المرحلة الثالثة";
      default:
        return `المرحلة ${stage}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => navigate("/classes")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            العودة للفصول
          </button>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">الفصل غير موجود</p>
          <button
            onClick={() => navigate("/classes")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            العودة للفصول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                تفاصيل الفصل
              </h1>
              <p className="text-gray-600">معلومات مفصلة عن الفصل والطلاب</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 space-x-reverse">
              <button
                aria-label="إضافة طالب واحد"
                onClick={() => navigate(`/classes/${id}/add-student`)}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-sm ring-1 ring-inset ring-green-500/20 transition-all duration-200 hover:shadow-md hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M12 4.5a.75.75 0 0 1 .75.75V11h5.75a.75.75 0 0 1 0 1.5H12.75v5.75a.75.75 0 0 1-1.5 0V12.5H5.5a.75.75 0 0 1 0-1.5h5.75V5.25A.75.75 0 0 1 12 4.5Z" />
                </svg>
                <span>إضافة طالب واحد</span>
              </button>
              <button
                aria-label="إضافة مجموعة طلاب"
                onClick={() => navigate(`/classes/${id}/bulk-upload`)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white shadow-sm ring-1 ring-inset ring-blue-500/20 transition-all duration-200 hover:shadow-md hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M12 3a4 4 0 1 1-3.995 4.2A4 4 0 0 1 12 3Zm-7 15.5a6.5 6.5 0 0 1 13 0V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1.5Zm14.25-7.75a.75.75 0 0 1 .75.75v2h2a.75.75 0 0 1 0 1.5h-2v2a.75.75 0 0 1-1.5 0v-2h-2a.75.75 0 0 1 0-1.5h2v-2a.75.75 0 0 1 .75-.75Z" />
                </svg>
                <span>إضافة مجموعة طلاب</span>
              </button>
              <button
                aria-label="العودة للفصول"
                onClick={() => navigate("/classes")}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M10.03 4.97a.75.75 0 0 1 0 1.06L6.06 10h12.19a.75.75 0 0 1 0 1.5H6.06l3.97 3.97a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" />
                </svg>
                <span>العودة للفصول</span>
              </button>
            </div>
          </div>
        </div>

        {/* Class Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                معلومات الفصل
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">الموقع:</span>
                  <span className="text-gray-900">{classData.location}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">المستوى:</span>
                  <span className="text-gray-900">
                    {classData.level
                      ? getLevelName(classData.level.level)
                      : "غير محدد"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">المرحلة:</span>
                  <span className="text-gray-900">
                    {classData.level
                      ? getStageName(
                          classData.level.stage,
                          classData.level.level
                        )
                      : "غير محدد"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">عدد الطلاب:</span>
                  <span className="text-gray-900">{students.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">id الفصل:</span>
                  <span className="text-gray-900 font-mono text-sm">{id}</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-bold text-blue-600">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {classData.level
                  ? `${getLevelName(classData.level.level)} - ${getStageName(
                      classData.level.stage,
                      classData.level.level
                    )}`
                  : "فصل بدون مستوى"}
              </h3>
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">الطلاب</h2>
            <span className="text-sm text-gray-500">
              إجمالي الطلاب: {students.length}
            </span>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                لا يوجد طلاب في هذا الفصل حالياً
              </p>
              <p className="text-sm text-gray-400 mt-2">
                قد يكون هذا بسبب عدم وجود طلاب مسجلين أو مشكلة في الاتصال
              </p>
            </div>
          ) : (
            <UsersTable
              users={students}
              emptyMessage="لا يوجد طلاب في هذا الفصل حالياً"
              emptySubMessage="قد يكون هذا بسبب عدم وجود طلاب مسجلين أو مشكلة في الاتصال"
            />
          )}
        </div>

        {/* Teacher Subject Assignments */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              تعيين المعلمين حسب المادة
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طقس
              </label>
              <select
                value={assignments.taks_teacher_id || ""}
                onChange={(e) =>
                  setAssignments((prev) => ({
                    ...prev,
                    taks_teacher_id: e.target.value || null,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">بدون تعيين</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role === "teacher" ? "معلم" : "مشرف"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ألحان
              </label>
              <select
                value={assignments.al7an_teacher_id || ""}
                onChange={(e) =>
                  setAssignments((prev) => ({
                    ...prev,
                    al7an_teacher_id: e.target.value || null,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">بدون تعيين</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role === "teacher" ? "معلم" : "مشرف"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                قبطي
              </label>
              <select
                value={assignments.coptic_teacher_id || ""}
                onChange={(e) =>
                  setAssignments((prev) => ({
                    ...prev,
                    coptic_teacher_id: e.target.value || null,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">بدون تعيين</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role === "teacher" ? "معلم" : "مشرف"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveAssignments}
              disabled={savingAssignments}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-white shadow-sm transition-all duration-200 hover:bg-primary-dark disabled:opacity-60"
            >
              {savingAssignments ? "جارِ الحفظ..." : "حفظ التعيينات"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
