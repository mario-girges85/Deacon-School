import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const AddStudent = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    birthday: "",
    gender: "male",
    code: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/classes/${classId}`
      );
      setClassData(response.data.class || response.data);
    } catch (error) {
      console.error("Error fetching class data:", error);
      setError("حدث خطأ أثناء جلب بيانات الفصل");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.phone ||
      !formData.birthday ||
      !formData.gender ||
      !formData.code
    ) {
      setError("جميع الحقول مطلوبة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get class data to extract level_id
      const classResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/classes/${classId}`
      );
      const levelId = (classResponse.data.class || classResponse.data)
        ?.level_id;

      if (!levelId) {
        setError("الفصل يجب أن يكون مرتبط بمستوى");
        return;
      }

      // Create user with level and class relations.
      // Do NOT send role; backend defaults to 'student'.
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/register`,
        {
          ...formData,
          password: formData.code, // Use code as default password
          class_id: classId,
          level_id: levelId,
        }
      );

      // Navigate back to class details
      navigate(`/classes/${classId}`);
    } catch (error) {
      console.error("Error creating user:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "حدث خطأ أثناء إنشاء الطالب";
      setError(msg);
    } finally {
      setLoading(false);
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
        return level === 0 ? "مرحلة غير صحيحة" : "المرحلة الثالثة";
      default:
        return `المرحلة ${stage}`;
    }
  };

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                إضافة طالب جديد
              </h1>
              <p className="text-gray-600">
                إضافة طالب للفصل: {classData.location}
              </p>
            </div>
            <button
              onClick={() => navigate(`/classes/${classId}`)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              العودة لتفاصيل الفصل
            </button>
          </div>
        </div>

        {/* Class Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            معلومات الفصل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">الموقع:</span>
              <span className="font-medium mr-2">{classData.location}</span>
            </div>
            <div>
              <span className="text-gray-600">المستوى:</span>
              <span className="font-medium mr-2">
                {classData.level
                  ? getLevelName(classData.level.level)
                  : "غير محدد"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">المرحلة:</span>
              <span className="font-medium mr-2">
                {classData.level
                  ? getStageName(classData.level.stage, classData.level.level)
                  : "غير محدد"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">معرف الفصل:</span>
              <span className="font-medium mr-2 font-mono text-sm">
                {classId}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            بيانات الطالب
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  اسم الطالب *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0501234567"
                  required
                />
              </div>

              {/* Birthday */}
              <div>
                <label
                  htmlFor="birthday"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  تاريخ الميلاد *
                </label>
                <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  الجنس *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>

              {/* Code */}
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  الرمز التعريفي *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ST001"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button
                type="button"
                onClick={() => navigate(`/classes/${classId}`)}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "جاري الإضافة..." : "إضافة الطالب"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
