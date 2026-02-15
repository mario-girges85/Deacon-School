import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated, getAuthHeaders } from "../util/auth";

const Profile = () => {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const me = authed ? getCurrentUser() : null;

  const [imagePreview, setImagePreview] = useState(me?.image || null);
  const [uploading, setUploading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPwd, setSavingPwd] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Teacher schedule states
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    if (!authed) {
      navigate("/login");
    }
    // Fetch current image from server to display existing profile image
    const fetchUserImage = async () => {
      try {
        if (!me?.id) return;
        const headers = { ...getAuthHeaders() };
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/users/${me.id}`,
          { headers }
        );
        const img = res?.data?.user?.image || null;
        if (img) setImagePreview(img);
      } catch (e) {
        // Silent fail; keep placeholder
      }
    };
    if (authed && me?.id) {
      fetchUserImage();
      // Fetch teacher schedule if user is a teacher
      if (me.role === "teacher") {
        fetchTeacherSchedule(me.id);
      }
    }
  }, [authed, navigate, me?.id, me?.role]);

  const fetchTeacherSchedule = async (teacherId) => {
    try {
      setLoadingSchedule(true);
      setScheduleError("");
      
      // Get current schedule
      const scheduleResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/schedule/current`,
        { headers: getAuthHeaders() }
      );

      if (scheduleResponse.data?.success && scheduleResponse.data.rows) {
        // Filter schedule to show only this teacher's assignments
        const teacherSchedule = [];
        scheduleResponse.data.rows.forEach((row) => {
          const timeSlots = scheduleResponse.data.timeSlots || [];
          timeSlots.forEach((timeSlot) => {
            const cell = row[timeSlot.key];
            if (cell?.teacherId === teacherId) {
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
    } catch (error) {
      console.error("Error fetching teacher schedule:", error);
      setScheduleError("حدث خطأ أثناء جلب الجدول التدريسي");
      setTeacherSchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const getSubjectLabel = (subject) => {
    const labels = {
      taks: "طقس",
      al7an: "ألحان", 
      coptic: "قبطي"
    };
    return labels[subject] || subject;
  };

  const getLevelName = (level) => {
    const levels = {
      0: "تمهيدي",
      1: "المستوى الأول",
      2: "المستوى الثاني", 
      3: "المستوى الثالث"
    };
    return levels[level] || `المستوى ${level}`;
  };

  const getStageName = (stage, level) => {
    const stages = {
      1: "السنة الأولى",
      2: "السنة الثانية",
      3: "السنة الثالثة"
    };
    return stages[stage] || `السنة ${stage}`;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const uploadRes = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/users/${me.id}/image`,
        fd,
        { headers: getAuthHeaders() }
      );
      // Prefer server-returned base64 (ensures final stored image is shown)
      if (uploadRes?.data?.image) {
        setImagePreview(uploadRes.data.image);
        // Persist to localStorage user object for Navbar avatar
        try {
          const u = JSON.parse(localStorage.getItem("user") || "null") || {};
          u.image = uploadRes.data.image;
          localStorage.setItem("user", JSON.stringify(u));
          // notify listeners (Navbar) to refresh avatar
          window.dispatchEvent(new Event("user:updated"));
        } catch {}
      } else {
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
        try {
          const u = JSON.parse(localStorage.getItem("user") || "null") || {};
          u.image = imagePreview;
          localStorage.setItem("user", JSON.stringify(u));
          window.dispatchEvent(new Event("user:updated"));
        } catch {}
      }
      setSuccess("تم تحديث الصورة بنجاح");
    } catch (err) {
      console.error("Image upload error:", err);
      setError(err.response?.data?.message || "تعذر تحديث الصورة");
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!passwords.newPassword || passwords.newPassword.length < 6) {
      setError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("تأكيد كلمة المرور غير متطابق");
      return;
    }
    setSavingPwd(true);
    try {
      const headers = { ...getAuthHeaders() };
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/users/${me.id}/password`,
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
        { headers }
      );
      setSuccess("تم تغيير كلمة المرور بنجاح");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Change password error:", err);
      setError(err.response?.data?.message || "تعذر تغيير كلمة المرور");
    } finally {
      setSavingPwd(false);
    }
  };

  if (!authed || !me) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">الملف الشخصي</h1>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              الصورة الشخصية
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-3xl">👤</div>
                )}
              </div>
              <div>
                <label className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark cursor-pointer">
                  تغيير الصورة
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <div className="text-sm text-gray-500 mt-2">
                    جاري رفع الصورة...
                  </div>
                )}
              </div>
            </div>
          </div>

          {(error || success) && (
            <div>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  {success}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              تغيير كلمة المرور
            </h2>
            <form
              onSubmit={handleChangePassword}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  كلمة المرور الحالية
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  مطلوبة عند تغيير المستخدم لكلمته (غير مطلوبة للأدمن)
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <button
                type="submit"
                disabled={savingPwd}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {savingPwd ? "جاري الحفظ..." : "حفظ"}
              </button>
            </form>
          </div>

          {/* Teacher Schedule Section */}
          {me?.role === "teacher" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                جدولي التدريسي
              </h2>
              
              {loadingSchedule ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 text-lg mt-4">جاري تحميل الجدول...</p>
                </div>
              ) : scheduleError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 text-lg">{scheduleError}</p>
                  <button
                    onClick={() => fetchTeacherSchedule(me.id)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : teacherSchedule.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p>لا يوجد جدول تدريسي محدد لك بعد</p>
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
    </div>
  );
};

export default Profile;
