import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isAuthenticated, isAdmin } from "../util/auth";
import { getCurrentUser } from "../util/auth";
import axios from "axios";
import logo from "../assets/logo.png";
import LoginForm from "../components/LoginForm";

const UserData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [storedUser, setStoredUser] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Small delay to show loading state
        await new Promise((resolve) => setTimeout(resolve, 300));

        const userData = getCurrentUser();
        const storedUserData = JSON.parse(
          localStorage.getItem("user") || "null"
        );

        setUser(userData);
        setStoredUser(storedUserData);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-2xl mx-auto mt-8">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/6"></div>
          </div>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            <div className="w-28 h-28 md:w-32 md:h-32 bg-gray-200 rounded-full"></div>
            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profileImage = storedUser?.image || null;

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
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
        إحصائيات المدرسة
      </h2>

      {/* User Statistics - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-600 mb-1">
            {stats.users.total}
          </div>
          <h3 className="text-sm font-medium text-gray-800">
            إجمالي المستخدمين
          </h3>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-600 mb-1">
            {stats.users.students}
          </div>
          <h3 className="text-sm font-medium text-gray-800">الطلاب</h3>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-600 mb-1">
            {stats.users.teachers}
          </div>
          <h3 className="text-sm font-medium text-gray-800">الخدام</h3>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-600 mb-1">
            {stats.users.admins + stats.users.supervisors}
          </div>
          <h3 className="text-sm font-medium text-gray-800">ادمن</h3>
        </div>
      </div>

      {/* Classes and Levels Statistics - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <div className="text-xl font-bold text-indigo-600 mb-1">
            {stats.classes.total}
          </div>
          <h3 className="text-sm font-medium text-gray-800">إجمالي الفصول</h3>
          <p className="text-xs text-gray-600">
            موزعة على {stats.levels.total} مستوى
          </p>
        </div>
        <div className="text-center p-3 bg-teal-50 rounded-lg">
          <div className="text-xl font-bold text-teal-600 mb-1">
            {stats.levels.total}
          </div>
          <h3 className="text-sm font-medium text-gray-800">
            المستويات التعليمية
          </h3>
          <p className="text-xs text-gray-600">تمهيدي + 3 مستويات × 3 مراحل</p>
        </div>
      </div>

      {/* Students Distribution by Level - Compact */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 text-center">
          توزيع الطلاب حسب المستوى
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="text-center p-2 bg-blue-100 rounded">
            <div className="text-lg font-bold text-blue-700 mb-1">
              {stats.levels.studentsByLevel["preparatory"] || 0}
            </div>
            <div className="text-xs text-blue-600">المستوى التمهيدي</div>
          </div>
          <div className="text-center p-2 bg-green-100 rounded">
            <div className="text-lg font-bold text-green-700 mb-1">
              {stats.levels.studentsByLevel["level1"] || 0}
            </div>
            <div className="text-xs text-green-600">المستوى الأول</div>
          </div>
          <div className="text-center p-2 bg-yellow-100 rounded">
            <div className="text-lg font-bold text-yellow-700 mb-1">
              {stats.levels.studentsByLevel["level2"] || 0}
            </div>
            <div className="text-xs text-yellow-600">المستوى الثاني</div>
          </div>
          <div className="text-center p-2 bg-purple-100 rounded">
            <div className="text-lg font-bold text-purple-700 mb-1">
              {stats.levels.studentsByLevel["level3"] || 0}
            </div>
            <div className="text-xs text-purple-600">المستوى الثالث</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simulate loading time for authentication check and user data
    const checkAuth = async () => {
      try {
        // Small delay to show loading state
        await new Promise((resolve) => setTimeout(resolve, 500));

        const authStatus = isAuthenticated();
        const userData = authStatus ? getCurrentUser() : null;

        setAuthed(authStatus);
        setUser(userData);
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    // Refresh the page to show the authenticated content
    window.location.reload();
  };

  const showUserData = authed && user?.role === "student";
  const showStats = isAdmin();
  const showLogin = !authed;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>

          {/* Loading Text */}
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            جاري التحميل...
          </h2>
          <p className="text-gray-500">
            نرجو الانتظار قليلاً بينما نقوم بتحميل البيانات
          </p>

          {/* Loading Skeleton for main content */}
          <div className="mt-8 max-w-4xl mx-auto px-4">
            <div className="animate-pulse">
              {/* Title skeleton */}
              <div className="h-12 bg-gray-200 rounded-lg w-3/4 mx-auto mb-4"></div>
              <div className="h-12 bg-gray-200 rounded-lg w-2/3 mx-auto mb-8"></div>

              {/* Content skeleton */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>

              {/* User data skeleton */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                  <div className="w-28 h-28 md:w-32 md:h-32 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-16 bg-gray-200 rounded-xl"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {/* Main Content - Centered Layout */}
        <div className="flex flex-col items-center justify-center gap-8 mb-12 w-full">
          {/* Welcome Section */}
          <div className="text-center flex-1 max-w-2xl w-full flex flex-col items-center justify-center">
            <img
              src={logo}
              alt="Logo"
              className="h-20 w-auto mb-6 mx-auto opacity-90"
            />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-4 leading-relaxed">
              مرحباً بكم في موقع مدرسة<br className="block md:hidden" />
              كنيسة القديسة دميانة بالهرم <br className="block md:hidden" />
              للشمامسة
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              مرحباً بكم في الموقع الرسمي لمدرسة شمامسة كنيسة القديسة دميانة.
              هنا يمكنكم الوصول إلى جميع المواد التعليمية والمناهج والموارد التي
              تحتاجونها لرحلتكم التعليمية.
            </p>
          </div>

          {/* Login Section */}
          {showLogin && (
            <div className="flex-shrink-0 w-full max-w-md flex justify-center">
              <LoginForm isCompact={true} onLoginSuccess={handleLoginSuccess} />
            </div>
          )}
        </div>

        {/* Stats and User Data */}
        <div className="w-full flex flex-col items-center justify-center">
          {showStats && <SchoolStats />}
          {showUserData && <UserData />}
        </div>
      </div>
    </div>
  );
};

export default Home;
