import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CopticKeyboard from "../../components/CopticKeyboard";
import {
  isAuthenticated,
  isAdmin,
  getAuthHeaders,
  notifyForbidden,
} from "../../util/auth";

const AddEditHymn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [events, setEvents] = useState([]);
  const [hymn, setHymn] = useState({
    title_arabic: "",
    event_id: "",
    lyrics_arabic: "",
    lyrics_coptic: "",
    lyrics_arabic_coptic: "",
    description: "",
    duration: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const copticInputRef = useRef(null);

  useEffect(() => {
    // Admin only
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    if (!isAdmin()) {
      notifyForbidden();
      navigate("/hymns");
      return;
    }

    fetchEvents();
    if (isEdit) {
      fetchHymn();
    }
  }, [id, isEdit, navigate]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/events`
      );
      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("حدث خطأ أثناء جلب الأحداث");
    }
  };

  const fetchHymn = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/hymns/${id}`
      );
      setHymn(response.data.hymn);
    } catch (error) {
      console.error("Error fetching hymn:", error);
      setError("حدث خطأ أثناء جلب اللحن");
    }
  };

  const handleInputChange = (field, value) => {
    setHymn((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const hymnData = {
        ...hymn,
        duration: hymn.duration ? parseInt(hymn.duration) : null,
      };

      let response;
      const headers = { ...getAuthHeaders() };
      if (isEdit) {
        response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/api/hymns/${id}`,
          hymnData,
          { headers }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/hymns`,
          hymnData,
          { headers }
        );
      }

      const hymnId = response.data.hymn.id;

      if (audioFile) {
        await uploadAudio(hymnId);
      }

      setSuccess(isEdit ? "تم تحديث اللحن بنجاح" : "تم إنشاء اللحن بنجاح");
      setTimeout(() => {
        navigate(`/hymns/${hymnId}`);
      }, 1500);
    } catch (error) {
      console.error("Error saving hymn:", error);
      setError(error.response?.data?.error || "حدث خطأ أثناء حفظ اللحن");
    } finally {
      setLoading(false);
    }
  };

  const uploadAudio = async (hymnId) => {
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/hymns/${hymnId}/audio`,
        formData,
        {
          headers: getAuthHeaders(),
        }
      );
    } catch (error) {
      console.error("Error uploading audio:", error);
      throw error;
    } finally {
      setUploadingAudio(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/hymns")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            العودة للمكتبة
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? "تعديل اللحن" : "إضافة لحن جديدة"}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              معلومات أساسية
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان (عربي) *
                </label>
                <input
                  type="text"
                  value={hymn.title_arabic}
                  onChange={(e) =>
                    handleInputChange("title_arabic", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المناسبة *
                </label>
                <select
                  value={hymn.event_id}
                  onChange={(e) =>
                    handleInputChange("event_id", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">اختر المناسبة</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name_arabic || event.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <textarea
                value={hymn.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              الكلمات
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    الكلمات (عربي)
                  </label>
                </div>
                <textarea
                  value={hymn.lyrics_arabic}
                  onChange={(e) =>
                    handleInputChange("lyrics_arabic", e.target.value)
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="أدخل كلمات اللحن باللغة العربية..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    الكلمات (قبطي)
                  </label>
                  <button
                    type="button"
                    onClick={() => setKeyboardOpen((v) => !v)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    {keyboardOpen ? "إخفاء اللوحة" : "لوحة مفاتيح قبطية"}
                  </button>
                </div>
                <textarea
                  ref={copticInputRef}
                  value={hymn.lyrics_coptic}
                  onChange={(e) =>
                    handleInputChange("lyrics_coptic", e.target.value)
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent coptic-text"
                  style={{ fontFamily: "CopticFont, serif", fontSize: "1.1em" }}
                  placeholder="أدخل كلمات اللحن باللغة القبطية..."
                />
                {keyboardOpen && (
                  <CopticKeyboard
                    isOpen={true}
                    onClose={() => setKeyboardOpen(false)}
                    targetInputRef={copticInputRef}
                    inline={true}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الكلمات (عربي قبطي)
                </label>
                <textarea
                  value={hymn.lyrics_arabic_coptic}
                  onChange={(e) =>
                    handleInputChange("lyrics_arabic_coptic", e.target.value)
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="أدخل كلمات اللحن بالقبطي المعرب..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              الملف الصوتي
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رفع ملف صوتي
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                الصيغ المدعومة: MP3, WAV, OGG, M4A (حد أقصى 50 ميجابايت)
              </p>
            </div>
            {hymn.audio_path && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الملف الحالي
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.814a1 1 0 011.617.814z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">ملف صوتي متاح</p>
                      <p className="text-xs text-gray-500">
                        سيتم استبداله عند رفع ملف جديد
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/hymns")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || uploadingAudio}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploadingAudio
                ? "جاري الحفظ..."
                : isEdit
                ? "تحديث"
                : "إنشاء"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditHymn;
