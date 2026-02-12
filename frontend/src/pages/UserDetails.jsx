import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../util/axiosConfig";
import { isAuthenticated, getCurrentUser } from "../util/auth";

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminSchedule, setAdminSchedule] = useState(null);
  const [adminScheduleLoading, setAdminScheduleLoading] = useState(false);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/users/${userId}`);
        if (res.data?.success) {
          setUser(res.data.user);
        } else {
          setError("فشل في جلب بيانات المستخدم");
        }
      } catch (e) {
        setError("حدث خطأ أثناء جلب بيانات المستخدم");
      } finally {
        setLoading(false);
      }
    };
    if (userId) load();
  }, [userId]);

  // Prevent students from viewing teacher profiles
  useEffect(() => {
    if (!user) return;
    const viewer = isAuthenticated() ? getCurrentUser() : null;
    const isStudentViewer = viewer?.role === "student";
    if (isStudentViewer && user.role === "teacher") {
      navigate(-1);
    }
  }, [user, navigate]);

  // Load teacher schedule for display
  useEffect(() => {
    const loadTeacherSchedule = async () => {
      if (!user || user.role !== "teacher") return;
      try {
        setAdminScheduleLoading(true);
        
        // Get current schedule
        const scheduleResponse = await apiClient.get("/schedule/current");
        
        if (scheduleResponse.data?.success && scheduleResponse.data.rows) {
          // Filter schedule to show only this teacher's assignments
          const teacherSchedule = [];
          scheduleResponse.data.rows.forEach((row) => {
            const timeSlots = scheduleResponse.data.timeSlots || [];
            timeSlots.forEach((timeSlot) => {
              const cell = row[timeSlot.key];
              if (cell?.teacherId === user.id) {
                teacherSchedule.push({
                  classId: row.class.id,
                  className: row.class.location,
                  level: row.class.level,
                  timeSlot: timeSlot.label,
                  timeSlotKey: timeSlot.key,
                  subject: cell.subject,
                  subjectLabel: getSubjectLabel(cell.subject),
                });
              }
            });
          });
          setTeacherSchedule(teacherSchedule);
        } else {
          setTeacherSchedule([]);
        }
      } catch (e) {
        console.error("Error loading teacher schedule:", e);
        setTeacherSchedule([]);
      } finally {
        setAdminScheduleLoading(false);
      }
    };
    loadTeacherSchedule();
  }, [user]);

  const getSubjectLabel = (subject) => {
    const labels = {
      taks: "طقس",
      al7an: "ألحان", 
      coptic: "قبطي"
    };
    return labels[subject] || subject;
  };

  const getRoleName = (role) => {
    switch (role) {
      case "student":
        return "طالب";
      case "teacher":
        return "معلم";
      case "admin":
        return "مدير";
      case "supervisor":
        return "مشرف";
      default:
        return role;
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
        if (level === 0) return "مرحلة غير صحيحة";
        return "المرحلة الثالثة";
      default:
        return `المرحلة ${stage}`;
    }
  };

  const formatBirthday = (birthday) => {
    if (!birthday) return "غير محدد";
    try {
      const date = new Date(birthday);
      if (isNaN(date.getTime())) return "تاريخ غير صحيح";
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    } catch {
      return "تاريخ غير صحيح";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const fullLevel = user.level
    ? `${getLevelName(user.level.level)} - ${getStageName(
        user.level.stage,
        user.level.level
      )}`
    : "غير محدد";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">تفاصيل المستخدم</h1>
          <button
            onClick={() => navigate("/users")}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            رجوع للمستخدمين
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <label
              className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-200 cursor-pointer group"
              title="تغيير الصورة"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 m-0.5 px-1.5 py-0.5 rounded bg-white/85 border border-gray-200 shadow-sm flex items-center gap-1 text-gray-700 text-[10px] opacity-90 group-hover:opacity-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path d="M9 2.25a.75.75 0 00-.53.22L7.06 3.88H5.25A2.25 2.25 0 003 6.13v10.5A2.25 2.25 0 005.25 18.9h13.5A2.25 2.25 0 0021 16.63V6.13A2.25 2.25 0 0018.75 3.88h-1.81l-1.41-1.41a.75.75 0 00-.53-.22H9zM12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm0 1.5a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
                <span>{uploadingImage ? "..." : "رفع"}</span>
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.heic"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploadingImage(true);
                    const form = new FormData();
                    form.append("image", file);
                    const res = await apiClient.put(
                      `/users/${user.id}/image`,
                      form
                    );
                    if (res.data?.success && res.data?.image) {
                      setUser((prev) => ({ ...prev, image: res.data.image }));
                    } else {
                      alert(res.data?.message || "فشل تحديث الصورة");
                    }
                  } catch (err) {
                    alert("تعذر رفع الصورة حالياً");
                  } finally {
                    setUploadingImage(false);
                  }
                }}
              />
            </label>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900">
                {user.name}
              </h2>
              <div className="text-sm text-gray-500 font-mono">
                #{user.id?.slice(0, 8)}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
              {getRoleName(user.role)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-gray-700">
            <div>
              <span className="font-medium">الهاتف:</span>{" "}
              {user.phone || "غير محدد"}
            </div>
            <div>
              <span className="font-medium">الكود:</span> {user.code || "—"}
            </div>
            <div>
              <span className="font-medium">تاريخ الميلاد:</span>{" "}
              {formatBirthday(user.birthday)}
            </div>
            <div>
              <span className="font-medium">المستوى:</span> {fullLevel}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            الفصول المرتبطة
          </h3>
          {user.classes && user.classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.classes.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/classes/${c.id}`)}
                  className="p-4 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="font-medium text-gray-900">{c.location}</div>
                  {c.level && (
                    <div className="text-sm text-gray-600 mt-1">
                      {getLevelName(c.level.level)} -{" "}
                      {getStageName(c.level.stage, c.level.level)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">لا توجد فصول مرتبطة</div>
          )}
        </div>

        {user.role === "admin" && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              جدول المدرسة (عرض فقط)
            </h3>
            {adminScheduleLoading && (
              <div className="text-gray-500">جاري تحميل الجدول...</div>
            )}
            {adminSchedule && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="border px-3 py-2 text-right">الفصل</th>
                      {adminSchedule.timeSlots.map((ts) => (
                        <th
                          key={ts.key}
                          className="border px-3 py-2 text-right"
                        >
                          {ts.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adminSchedule.rows.map((row) => (
                      <tr key={row.class.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 text-right">
                          <div className="font-medium">
                            {row.class.location}
                          </div>
                          <div className="text-xs text-gray-500">
                            المستوى {row.class.level?.level} - المرحلة{" "}
                            {row.class.level?.stage}
                          </div>
                        </td>
                        {adminSchedule.timeSlots.map((ts) => (
                          <td
                            key={ts.key}
                            className="border px-3 py-2 text-right"
                          >
                            <div className="font-medium">
                              {row[ts.key]?.subject === "taks" && "طقس"}
                              {row[ts.key]?.subject === "al7an" && "ألحان"}
                              {row[ts.key]?.subject === "coptic" && "قبطي"}
                            </div>
                            <div className="text-xs text-gray-600">
                              {row[ts.key]?.teacherId
                                ? `معلم: ${row[ts.key].teacherId}`
                                : "غير معيّن"}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {user.role === "teacher" && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              جدول الحصص
            </h3>
            
            {adminScheduleLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 text-lg mt-4">جاري تحميل الجدول...</p>
              </div>
            ) : teacherSchedule.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                <p>لا يوجد جدول حصص محدد لهذا المعلم بعد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right px-3 py-2 font-semibold text-gray-700">الفصل</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-700">المستوى</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-700">الفترة</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-700">المادة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherSchedule.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-3 text-right font-medium">
                          {item.className}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-600">
                          {item.level ? 
                            `${getLevelName(item.level.level)} - ${getStageName(item.level.stage, item.level.level)}` 
                            : "—"
                          }
                        </td>
                        <td className="px-3 py-3 text-right text-gray-600">
                          {item.timeSlot}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.subjectLabel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
