import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UsersTable from "../components/UsersTable";
import { isAuthenticated, isAdmin, getAuthHeaders } from "../util/auth";

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  useEffect(() => {
    // Check authentication (basic check for UX)
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Note: Real role check happens on backend
    // This is just for UX - if user is not admin, they'll get 403 from backend
    fetchUsers();
  }, [navigate]);

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = users;

    // Filter by search term (name, phone, code)
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm) ||
          (user.code &&
            user.code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by role
    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Filter by level
    if (filterLevel !== "all") {
      filtered = filtered.filter((user) => {
        if (!user.level) return false;
        const levelKey = `${user.level.level}-${user.level.stage}`;
        return levelKey === filterLevel;
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterLevel]);

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟`)) {
      try {
        const headers = getAuthHeaders();
        await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/delete/${userId}`,
          { headers }
        );

        // Remove user from local state
        setUsers(users.filter((user) => user.id !== userId));

        // Show success message
        alert("تم حذف المستخدم بنجاح");
      } catch (err) {
        console.error("Delete error:", err);

        if (err.response?.status === 401) {
          // Unauthorized - redirect to login
          navigate("/login");
          return;
        }

        if (err.response?.status === 403) {
          // Forbidden - not admin
          alert("ليس لديك صلاحية لحذف المستخدمين");
          return;
        }

        alert("حدث خطأ في حذف المستخدم");
      }
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/get-users`,
        { headers }
      );

      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        setError(response.data.message || "حدث خطأ في جلب البيانات");
      }
    } catch (err) {
      console.error("Fetch users error:", err);

      if (err.response?.status === 401) {
        // Unauthorized - redirect to login
        navigate("/login");
        return;
      }

      if (err.response?.status === 403) {
        // Forbidden - not admin
        setError("ليس لديك صلاحية للوصول إلى هذه الصفحة");
        return;
      }

      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              إدارة المستخدمين
            </h1>
            <p className="mt-2 text-gray-600 text-center">
              عرض وإدارة جميع المستخدمين في النظام
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">
                  إجمالي المستخدمين
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">المديرين</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">المدرسين</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter((u) => u.role === "teacher").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">الطلاب</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter((u) => u.role === "student").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث
              </label>
              <input
                type="text"
                placeholder="البحث بالاسم، الهاتف، أو الرمز..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الدور
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">جميع الأدوار</option>
                <option value="admin">مدير</option>
                <option value="teacher">معلم</option>
                <option value="student">طالب</option>
              </select>
            </div>

            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المستوى
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">جميع المستويات</option>
                <option value="0-1">المستوى التمهيدي - المرحلة الأولى</option>
                <option value="0-2">المستوى التمهيدي - المرحلة الثانية</option>
                <option value="1-1">المستوى الأول - المرحلة الأولى</option>
                <option value="1-2">المستوى الأول - المرحلة الثانية</option>
                <option value="1-3">المستوى الأول - المرحلة الثالثة</option>
                <option value="2-1">المستوى الثاني - المرحلة الأولى</option>
                <option value="2-2">المستوى الثاني - المرحلة الثانية</option>
                <option value="2-3">المستوى الثاني - المرحلة الثالثة</option>
                <option value="3-1">المستوى الثالث - المرحلة الأولى</option>
                <option value="3-2">المستوى الثالث - المرحلة الثانية</option>
                <option value="3-3">المستوى الثالث - المرحلة الثالثة</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterRole("all");
                setFilterLevel("all");
              }}
              className="w-full lg:w-auto bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              مسح الفلاتر
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              المستخدمين المطابقين:{" "}
              <span className="font-semibold text-primary-600">
                {filteredUsers.length}
              </span>
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              قائمة المستخدمين
            </h3>
          </div>

          <UsersTable
            users={filteredUsers}
            loading={loading}
            onDelete={(user) => handleDelete(user.id, user.name)}
            emptyMessage={
              users.length === 0
                ? "لا يوجد مستخدمين"
                : "لا توجد نتائج تطابق الفلاتر المحددة"
            }
            emptySubMessage={
              users.length === 0
                ? "ابدأ بإضافة المستخدمين الجدد"
                : "جرب تغيير معايير البحث"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Users;
