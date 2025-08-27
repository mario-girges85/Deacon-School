import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`
        );
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
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-200">
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
            </div>
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
      </div>
    </div>
  );
};

export default UserDetails;
