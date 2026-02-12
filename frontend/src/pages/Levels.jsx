import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { isAdmin, getCurrentUser, isAuthenticated } from "../util/auth";

const Levels = () => {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [levelsResponse, classesResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/levels`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/classes`),
      ]);

      setLevels(levelsResponse.data?.levels || []);
      setClasses(classesResponse.data?.classes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const me = isAuthenticated() ? getCurrentUser() : null;
  const isUserAdmin = isAdmin();
  const isStudent = !!me && me.role === "student";

  // Client-side visibility filter
  const visibleLevels = useMemo(() => {
    if (isUserAdmin) return levels;
    if (!me) return [];
    const allowedLevelIds = new Set();
    if (me.level_id) allowedLevelIds.add(me.level_id);
    // include levels of classes user teaches/supervises if available
    if (Array.isArray(me.classes)) {
      me.classes.forEach(
        (c) => c?.level?.id && allowedLevelIds.add(c.level.id)
      );
    }
    return levels.filter((lvl) => allowedLevelIds.has(lvl.id));
  }, [levels, me, isUserAdmin]);

  const visibleClasses = useMemo(() => {
    if (isUserAdmin) return classes;
    if (!me) return [];
    const allowedClassIds = new Set();
    if (me.class_id) allowedClassIds.add(me.class_id);
    if (Array.isArray(me.classes)) {
      me.classes.forEach((c) => c?.id && allowedClassIds.add(c.id));
    }
    return classes.filter((c) => allowedClassIds.has(c.id));
  }, [classes, me, isUserAdmin]);

  const getClassesCountForLevel = (levelId) => {
    return visibleClasses.filter((c) => c.level_id === levelId).length;
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستوى؟")) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/levels/${id}`
      );
      fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error deleting level:", error);
      alert(error.response?.data?.error || "حدث خطأ أثناء حذف المستوى");
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
        return "السنة الأولى";
      case 2:
        return "السنة الثانية";
      case 3:
        return "السنة الثالثة";
      default:
        return `السنة ${stage}`;
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
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">المستويات</h1>
          <p className="text-gray-600">إدارة المستويات والسنوات الدراسية</p>
        </div>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleLevels.map((level) => {
            const classesCount = getClassesCountForLevel(level.id);
            return (
              <div
                key={level.id}
                onClick={() => navigate(`/levels/${level.id}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {getLevelName(level.level)} - {getStageName(level.stage)}
                    </h3>
                    <p className="text-gray-600">
                      المستوى: {level.level} | السنة: {level.stage}
                    </p>
                    {!isStudent && (
                      <p className="text-sm text-gray-500 mt-2">
                        عدد الفصول : {classesCount}
                      </p>
                    )}
                  </div>
                </div>

                {/* Student view: show only location instead of classes list */}
                {isStudent ? (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {(() => {
                      const studentClassForLevel = visibleClasses.find(
                        (c) => c.level_id === level.id
                      );
                      const locationLabel = studentClassForLevel?.location;
                      return (
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">المكان:</span>{" "}
                          <span className="text-gray-600">
                            {locationLabel || "غير متوفر"}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    {/* Classes for this level - non-students */}
                    {classesCount > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          الفصول :
                        </h4>
                        <div className="space-y-1">
                          {visibleClasses
                            .filter((c) => c.level_id === level.id)
                            .slice(0, 3) // Show only first 3 classes
                            .map((classItem) => (
                              <div
                                key={classItem.id}
                                className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                              >
                                {classItem.location}
                              </div>
                            ))}
                          {classesCount > 3 && (
                            <div className="text-xs text-gray-500 italic">
                              و {classesCount - 3} فصول أخرى...
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/classes");
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          عرض جميع الفصول →
                        </button>
                      </div>
                    )}

                    {classesCount === 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          لا توجد فصول بهذا المستوى
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/classes");
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          ربط فصول →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {levels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">لا توجد مستويات حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Levels;
