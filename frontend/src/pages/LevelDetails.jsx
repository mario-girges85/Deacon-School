import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { isAuthenticated, getCurrentUser } from "../util/auth";

const LevelDetails = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [level, setLevel] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLevelData();
  }, [levelId]);

  const fetchLevelData = async () => {
    try {
      setLoading(true);
      const [levelResponse, classesResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/levels/${levelId}`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/classes`),
      ]);

      setLevel(levelResponse.data?.level || null);
      setClasses(classesResponse.data?.classes || []);
    } catch (error) {
      console.error("Error fetching level data:", error);
      setError("حدث خطأ أثناء جلب بيانات المستوى");
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

  const getStageName = (stage) => {
    switch (stage) {
      case 1:
        return "المرحلة الأولى";
      case 2:
        return "المرحلة الثانية";
      case 3:
        return "المرحلة الثالثة";
      default:
        return `المرحلة ${stage}`;
    }
  };

  const getClassesForLevel = () => {
    return classes.filter((c) => c.level_id === levelId);
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
            onClick={fetchLevelData}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">لم يتم العثور على المستوى</p>
          <button
            onClick={() => navigate("/levels")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            العودة للمستويات
          </button>
        </div>
      </div>
    );
  }

  const viewer = isAuthenticated() ? getCurrentUser() : null;
  const isStudentViewer = viewer?.role === "student";
  const levelClasses = isStudentViewer ? [] : getClassesForLevel();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">تفاصيل المستوى</h1>
            <button
              onClick={() => navigate("/levels")}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              رجوع للمستويات
            </button>
          </div>
        </div>

        {/* Level Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {getLevelName(level.level)} - {getStageName(level.stage)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {level.level}
              </div>
              <div className="text-sm text-gray-600">المستوى</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {level.stage}
              </div>
              <div className="text-sm text-gray-600">المرحلة</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {levelClasses.length}
              </div>
              <div className="text-sm text-gray-600">عدد الفصول</div>
            </div>
          </div>
        </div>


        {/* Classes Section (hidden for students) */}
        {!isStudentViewer && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              الفصول
            </h3>

            {levelClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {levelClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    onClick={() => navigate(`/classes/${classItem.id}`)}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {classItem.location}
                    </h4>
                    <p className="text-sm text-gray-600">
                      عدد الطلاب: {classItem.students_count || 0}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg mb-4">
                  لا توجد فصول مرتبطة بهذا المستوى
                </p>
                <button
                  onClick={() => navigate("/classes")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  إنشاء فصل جديد
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelDetails;
