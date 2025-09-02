import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const EventsManagement = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    id: null,
    name_arabic: "",
  });
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const resetForm = () => setForm({ id: null, name_arabic: "" });

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  const openEditModal = (evt) => {
    setForm({
      id: evt.id,
      name_arabic: evt.name_arabic || evt.name || "",
    });
    setIsModalOpen(true);
  };
  const closeModal = () => {
    if (!saving) setIsModalOpen(false);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBase}/api/events`);
      setEvents(res.data.events || []);
    } catch (e) {
      console.error(e);
      setError("حدث خطأ أثناء جلب المناسبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const q = query.trim();
    if (!q) return events;
    return events.filter((e) => (e.name_arabic || e.name || "").includes(q));
  }, [events, query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name_arabic.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (form.id) {
        await axios.put(`${apiBase}/api/events/${form.id}`, {
          name: form.name_arabic,
          name_arabic: form.name_arabic,
        });
      } else {
        await axios.post(`${apiBase}/api/events`, {
          name: form.name_arabic,
          name_arabic: form.name_arabic,
        });
      }
      await fetchEvents();
      resetForm();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      setError("حدث خطأ أثناء حفظ المناسبة");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذه المناسبة؟")) return;
    try {
      await axios.delete(`${apiBase}/api/events/${id}`);
      await fetchEvents();
    } catch (e) {
      console.error(e);
      setError("حدث خطأ أثناء حذف المناسبة");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مناسبة..."
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent hidden md:block"
            />
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              إضافة مناسبة
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-lg shadow-sm p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">📭</div>
              <p className="text-gray-600">لا توجد مناسبات</p>
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {evt.name_arabic || evt.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(evt)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(evt.id)}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">المعرف: {evt.id}</div>
              </div>
            ))
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {form.id ? "تعديل المناسبة" : "إضافة مناسبة"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المناسبة
                  </label>
                  <input
                    type="text"
                    value={form.name_arabic}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name_arabic: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="أدخل اسم المناسبة"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={saving}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                  >
                    {saving ? "جاري الحفظ..." : form.id ? "تحديث" : "إضافة"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsManagement;
