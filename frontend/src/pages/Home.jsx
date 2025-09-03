import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isAuthenticated, isAdmin } from "../util/auth";
import { getCurrentUser } from "../util/auth";
import axios from "axios";

const UserData = () => {
  const user = getCurrentUser();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const profileImage = storedUser?.image || null;

  if (!user) return null;

  const roleLabels = {
    student: "طالب",
    teacher: "معلم",
    admin: "مسؤول",
    supervisor: "مشرف",
  };

  const classLabels = {
    c01: "تمهيدي المرحلة الأولى",
    c02: "تمهيدي المرحلة الثانية",
    c11: "المستوى الأول المرحلة الأولى",
    c12: "المستوى الأول المرحلة الثانية",
    c13: "المستوى الأول المرحلة الثالثة",
    c21: "المستوى الثاني المرحلة الأولى",
    c22: "المستوى الثاني المرحلة الثانية",
    c23: "المستوى الثاني المرحلة الثالثة",
    c31: "المستوى الثالث المرحلة الأولى",
    c32: "المستوى الثالث المرحلة الثانية",
    c33: "المستوى الثالث المرحلة الثالثة",
  };

  const genderLabel =
    user.gender === "male"
      ? "ذكر"
      : user.gender === "female"
      ? "أنثى"
      : user.gender || "";

  const formattedBirthday = user.birthday
    ? new Date(user.birthday).toLocaleDateString("ar-EG")
    : "";

  const classId = user.class_id || localStorage.getItem("class_id") || "";
  const levelId = user.level_id || localStorage.getItem("level_id") || "";
  const classLocation = storedUser?.class?.location || null;
  const levelInfo = storedUser?.level || storedUser?.class?.level || null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-2xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          بياناتي
        </h2>
        {user.code && (
          <span className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary">
            كود: {user.code}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
        <div className="shrink-0">
          <div className="relative">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-1">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={user?.name || "الصورة الشخصية"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl md:text-5xl">👤</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.name && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">الاسم</div>
                <div className="text-gray-900 font-medium">{user.name}</div>
              </div>
            )}

            {user.role && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">الدور</div>
                <div className="text-gray-900 font-medium">
                  {roleLabels[user.role] || user.role}
                </div>
              </div>
            )}

            {(classLocation || classId) && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">الفصل</div>
                <div className="text-gray-900 font-medium">
                  {classLocation || `#${classId}`}
                </div>
              </div>
            )}

            {(levelInfo || levelId) && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">المستوى</div>
                <div className="text-gray-900 font-medium">
                  {levelInfo
                    ? `المستوى ${levelInfo.level} - المرحلة ${levelInfo.stage}`
                    : `#${levelId}`}
                </div>
              </div>
            )}

            {user.phone && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">رقم الهاتف</div>
                <div className="text-gray-900 font-medium">{user.phone}</div>
              </div>
            )}

            {user.birthday && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">تاريخ الميلاد</div>
                <div className="text-gray-900 font-medium">
                  {formattedBirthday}
                </div>
              </div>
            )}

            {user.gender && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">النوع</div>
                <div className="text-gray-900 font-medium">{genderLabel}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SchoolStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/stats`
      );
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("حدث خطأ أثناء جلب الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        إحصائيات المدرسة
      </h2>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.users.total}
          </div>
          <h3 className="font-semibold text-gray-800">إجمالي المستخدمين</h3>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.users.students}
          </div>
          <h3 className="font-semibold text-gray-800">الطلاب</h3>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {stats.users.teachers}
          </div>
          <h3 className="font-semibold text-gray-800">المدرسين</h3>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {stats.users.admins + stats.users.supervisors}
          </div>
          <h3 className="font-semibold text-gray-800">ادمن</h3>
        </div>
      </div>

      {/* Classes and Levels Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {stats.classes.total}
          </div>
          <h3 className="font-semibold text-gray-800">إجمالي الفصول</h3>
          <p className="text-sm text-gray-600">
            موزعة على {stats.levels.total} مستوى
          </p>
        </div>
        <div className="text-center p-4 bg-teal-50 rounded-lg">
          <div className="text-3xl font-bold text-teal-600 mb-2">
            {stats.levels.total}
          </div>
          <h3 className="font-semibold text-gray-800">المستويات التعليمية</h3>
          <p className="text-sm text-gray-600">تمهيدي + 3 مستويات × 3 مراحل</p>
        </div>
      </div>

      {/* Students Distribution by Level */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          توزيع الطلاب حسب المستوى
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-100 rounded-lg">
            <div className="text-xl font-bold text-blue-700 mb-1">
              {stats.levels.studentsByLevel["preparatory"] || 0}
            </div>
            <div className="text-sm text-blue-600">المستوى التمهيدي</div>
          </div>
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <div className="text-xl font-bold text-green-700 mb-1">
              {stats.levels.studentsByLevel["level1"] || 0}
            </div>
            <div className="text-sm text-green-600">المستوى الأول</div>
          </div>
          <div className="text-center p-3 bg-yellow-100 rounded-lg">
            <div className="text-xl font-bold text-yellow-700 mb-1">
              {stats.levels.studentsByLevel["level2"] || 0}
            </div>
            <div className="text-sm text-yellow-600">المستوى الثاني</div>
          </div>
          <div className="text-center p-3 bg-purple-100 rounded-lg">
            <div className="text-xl font-bold text-purple-700 mb-1">
              {stats.levels.studentsByLevel["level3"] || 0}
            </div>
            <div className="text-sm text-purple-600">المستوى الثالث</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const authed = isAuthenticated();
  const user = authed ? getCurrentUser() : null;
  const showUserData = authed && user?.role === "student";
  const showStats = isAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            مرحباً بكم في موقع مدرسة شمامسة{" "}
          </h1>
          <h1 className="text-4xl font-bold text-primary mb-4">
            كنيسة القديسة دميانة
          </h1>

          {showStats && <SchoolStats />}
          {showUserData && <UserData />}
        </div>
      </div>
    </div>
  );
};

export default Home;
