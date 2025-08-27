import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ClassCard from "../components/ClassCard";

const Classes = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateRelationModal, setShowCreateRelationModal] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesResponse, levelsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/classes`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/levels`),
      ]);

      if (
        classesResponse.data?.success &&
        Array.isArray(classesResponse.data.classes)
      ) {
        setAllClasses(classesResponse.data.classes);
        // Show only classes that have a level relationship
        const classesWithLevels = classesResponse.data.classes.filter(
          (c) => c.level_id
        );
        setClasses(classesWithLevels);
      } else {
        setAllClasses([]);
        setClasses([]);
      }

      if (
        levelsResponse.data?.success &&
        Array.isArray(levelsResponse.data.levels)
      ) {
        setLevels(levelsResponse.data.levels);
      } else {
        setLevels([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelation = () => {
    setSelectedLevelId("");
    setSelectedClassId("");
    setShowCreateRelationModal(true);
  };

  const handleCreateRelationSubmit = async () => {
    if (!selectedLevelId || !selectedClassId) return;

    try {
      setCreating(true);
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/classes/${selectedClassId}`,
        {
          level_id: selectedLevelId,
        }
      );

      setShowCreateRelationModal(false);
      setSelectedLevelId("");
      setSelectedClassId("");
      fetchData(); // Refresh the data
    } catch (error) {
      console.error("Error creating relation:", error);
      alert(error.response?.data?.error || "حدث خطأ أثناء إنشاء العلاقة");
    } finally {
      setCreating(false);
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
        // Level 0 (Preparatory) cannot have stage 3
        if (level === 0) {
          return "مرحلة غير صحيحة";
        }
        return "المرحلة الثالثة";
      default:
        return `المرحلة ${stage}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الفصول</h1>
          <p className="text-gray-600">
            عرض الفصول المرتبطة بالمستويات الدراسية
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            عدد الفصول : {classes.length}
          </div>
          <button
            onClick={handleCreateRelation}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            إنشاء فصل
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">لا توجد فصول حالياً</p>
            <button
              onClick={handleCreateRelation}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              إنشاء فصل
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                getLevelName={getLevelName}
                getStageName={getStageName}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Relation Modal */}
      {showCreateRelationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              إنشاء علاقة بين مستوى وفصل
            </h3>

            {/* Level Selection */}
            <div className="mb-4">
              <label
                htmlFor="level-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                اختر المستوى
              </label>
              <select
                id="level-select"
                value={selectedLevelId}
                onChange={(e) => setSelectedLevelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">اختر المستوى</option>
                {levels
                  .sort((a, b) => {
                    const aName =
                      getLevelName(a.level) +
                      " - " +
                      getStageName(a.stage, a.level);
                    const bName =
                      getLevelName(b.level) +
                      " - " +
                      getStageName(b.stage, b.level);
                    return aName.localeCompare(bName, "ar");
                  })
                  .map((level) => (
                    <option key={level.id} value={level.id}>
                      {getLevelName(level.level)} -{" "}
                      {getStageName(level.stage, level.level)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Class Selection */}
            <div className="mb-6">
              <label
                htmlFor="class-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                اختر الفصل
              </label>
              <select
                id="class-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">اختر الفصل</option>
                {allClasses
                  .filter((c) => !c.level_id) // Only show unassigned classes
                  .sort((a, b) => a.location.localeCompare(b.location, "ar"))
                  .map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.location}
                    </option>
                  ))}
              </select>
              {allClasses.filter((c) => !c.level_id).length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  جميع الفصول مرتبطة بمستويات
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => {
                  setShowCreateRelationModal(false);
                  setSelectedLevelId("");
                  setSelectedClassId("");
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateRelationSubmit}
                disabled={!selectedLevelId || !selectedClassId || creating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "جاري الإنشاء..." : "إنشاء العلاقة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
