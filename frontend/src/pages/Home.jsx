import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isAuthenticated } from "../util/auth";
import { getCurrentUser } from "../util/auth";
import axios from "axios";

const UserData = () => {
  const user = getCurrentUser();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const profileImage = storedUser?.image || null;

  if (!user) {
    return null;
  }

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

  const arabicClassName = user.class
    ? classLabels[user.class] || user.class
    : "";

  // You can customize which fields to show based on your token structure
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4 text-primary">
        بيانات المستخدم
      </h2>
      {profileImage && (
        <div className="w-full flex justify-center mb-4">
          <img
            src={profileImage}
            alt={user?.name || "الصورة الشخصية"}
            className="w-24 h-24 rounded-full object-cover border border-gray-200"
          />
        </div>
      )}
      <div className="space-y-2 text-right">
        {user.name && (
          <div>
            <span className="font-bold">الاسم: </span>
            <span>{user.name}</span>
          </div>
        )}

        {user.role && (
          <div>
            <span className="font-bold">الدور: </span>
            <span>{roleLabels[user.role] || user.role}</span>
          </div>
        )}

        {user.class && (
          <div>
            <span className="font-bold">الصف: </span>
            <span>{arabicClassName}</span>
          </div>
        )}

        {user.birthday && (
          <div>
            <span className="font-bold">تاريخ الميلاد: </span>
            <span>{formattedBirthday}</span>
          </div>
        )}

        {user.gender && (
          <div>
            <span className="font-bold">النوع: </span>
            <span>{genderLabel}</span>
          </div>
        )}

        {user.code && (
          <div>
            <span className="font-bold">الكود: </span>
            <span>{user.code}</span>
          </div>
        )}

        {user.phone && (
          <div>
            <span className="font-bold">رقم الهاتف: </span>
            <span>{user.phone}</span>
          </div>
        )}
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

          {/* School Statistics */}
          <SchoolStats />
        </div>
      </div>
    </div>
  );
};

export default Home;
