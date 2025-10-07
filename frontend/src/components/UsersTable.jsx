import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const UsersTable = ({
  users,
  loading = false,
  onDelete = null,
  emptyMessage = "لا يوجد مستخدمون",
  emptySubMessage = "قد يكون هذا بسبب عدم وجود مستخدمين مسجلين أو مشكلة في الاتصال",
}) => {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [previewImage, setPreviewImage] = useState(null); // { url, name }

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return users;

    return [...users].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested level data
      if (sortConfig.key === "level") {
        aValue = a.level?.level || 0;
        bValue = b.level?.level || 0;
      }

      // Handle date sorting
      if (sortConfig.key === "birthday") {
        aValue = new Date(a.birthday || 0);
        bValue = new Date(b.birthday || 0);
      }

      // Handle string values
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [users, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg
          className="w-4 h-4 ml-2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    if (sortConfig.direction === "asc") {
      return (
        <svg
          className="w-4 h-4 ml-2 text-blue-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return (
      <svg
        className="w-4 h-4 ml-2 text-blue-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    );
  };
  const getGenderName = (gender) => {
    return gender === "male" ? "ذكر" : "أنثى";
  };

  // Build initials from first and second names
  const getInitials = (fullName = "") => {
    try {
      const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "?";
      const first = parts[0].charAt(0).toUpperCase();
      const second = parts.length > 1 ? parts[1].charAt(0).toUpperCase() : "";
      return first + second || first || "?";
    } catch {
      return "?";
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case "student":
        return "طالب";
      case "teacher":
        return "خادم";
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
        return "السنة الأولى";
      case 2:
        return "السنة الثانية";
      case 3:
        if (level === 0) {
          return "مرحلة غير صحيحة";
        }
        return "السنة الثالثة";
      default:
        return `السنة ${stage}`;
    }
  };

  const getFullLevelInfo = (user) => {
    if (
      user.level &&
      user.level.level !== undefined &&
      user.level.stage !== undefined
    ) {
      const levelName = getLevelName(user.level.level);
      const stageName = getStageName(user.level.stage, user.level.level);
      return `${levelName} - ${stageName}`;
    }
    return "غير محدد";
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "teacher":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "supervisor":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "student":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getGenderColor = (gender) => {
    return gender === "male"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-pink-50 text-pink-700 border-pink-200";
  };

  const formatBirthday = (birthday) => {
    if (!birthday) return "غير محدد";

    try {
      const date = new Date(birthday);
      if (isNaN(date.getTime())) {
        return "تاريخ غير صحيح";
      }

      // Format as YYYY-MM-DD for consistency
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting birthday:", error);
      return "تاريخ غير صحيح";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-600 transition ease-in-out duration-150">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            جاري التحميل...
          </div>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500">{emptySubMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th
                scope="col"
                className="py-4 px-6 text-center text-sm font-semibold text-gray-900"
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  الصورة
                </div>
              </th>
              <th
                scope="col"
                className="py-4 px-6 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  الاسم
                  {getSortIcon("name")}
                </div>
              </th>
              <th
                scope="col"
                className="py-4 px-6 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                onClick={() => handleSort("code")}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  الكود
                  {getSortIcon("code")}
                </div>
              </th>
              <th
                scope="col"
                className="py-4 px-6 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                onClick={() => handleSort("birthday")}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  تاريخ الميلاد
                  {getSortIcon("birthday")}
                </div>
              </th>
              <th
                scope="col"
                className="py-4 px-6 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                onClick={() => handleSort("level")}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  المستوى
                  {getSortIcon("level")}
                </div>
              </th>
              <th
                scope="col"
                className="py-4 px-6 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                onClick={() => handleSort("phone")}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  رقم الهاتف
                  {getSortIcon("phone")}
                </div>
              </th>
              <th
                scope="col"
                className="py-4 px-6 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                onClick={() => handleSort("role")}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  الدور
                  {getSortIcon("role")}
                </div>
              </th>
              <th
                scope="col"
                className="py-4 px-6 text-center text-sm font-semibold text-gray-900"
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                  الفصول
                </div>
              </th>
              {onDelete && (
                <th
                  scope="col"
                  className="py-4 px-6 text-center text-sm font-semibold text-gray-900"
                >
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                    الإجراءات
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedUsers.map((user, index) => (
              <tr
                key={user.id}
                className={`hover:bg-gray-50 transition-colors duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="whitespace-nowrap py-4 px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {user.image ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 cursor-pointer"
                          src={user.image}
                          alt={user.name}
                          title="تكبير الصورة"
                          onClick={() =>
                            setPreviewImage({
                              url: user.image,
                              name: user.name,
                            })
                          }
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-2 ring-gray-200">
                          <span className="text-sm font-bold text-white tracking-wide">
                            {getInitials(user.name)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap py-4 px-6">
                  <button
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {user.name}
                  </button>
                  <div className="text-xs text-gray-500 font-mono">
                    #{user.id.slice(0, 8)}
                  </div>
                </td>
                <td className="whitespace-nowrap py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    {user.code}
                  </span>
                </td>
                <td className="whitespace-nowrap py-4 px-6">
                  <div className="text-sm text-gray-900 font-mono">
                    {formatBirthday(user.birthday)}
                  </div>
                </td>
                <td className="whitespace-nowrap py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    {getFullLevelInfo(user)}
                  </span>
                </td>
                <td className="whitespace-nowrap py-4 px-6">
                  <div className="text-sm text-gray-900 font-mono">
                    {user.phone}
                  </div>
                </td>
                <td className="whitespace-nowrap py-4 px-6">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td className="whitespace-nowrap py-4 px-6">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {user.classes && user.classes.length > 0 ? (
                      user.classes.map((classItem, idx) => (
                        <span
                          key={classItem.id || idx}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                          title={classItem.location}
                        >
                          {classItem.location
                            ? classItem.location.length > 20
                              ? classItem.location.substring(0, 20) + "..."
                              : classItem.location
                            : "فصل غير محدد"}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        لا توجد فصول
                      </span>
                    )}
                  </div>
                </td>
                {onDelete && (
                  <td className="whitespace-nowrap py-4 px-6 text-center">
                    <div className="flex flex-col gap-2 items-center">
                      {onDelete && (
                        <button
                          onClick={() => onDelete(user)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image lightbox overlay */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-800 truncate">
                {previewImage.name || "صورة المستخدم"}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setPreviewImage(null)}
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewImage.url}
                alt={previewImage.name || "صورة"}
                className="mx-auto max-h-[70vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;

// Image preview modal (lightbox)
// Rendered inline at the end to avoid separate component wiring
// Note: This relies on the state defined above; keep it after export for clarity
// eslint-disable-next-line no-unused-vars
const _UsersTableImagePreviewOverlay = () => null;
