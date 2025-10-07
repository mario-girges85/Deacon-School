import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "../../util/auth";
import axios from "axios";
import HymnCard from "../../components/HymnCard";

const HymnsLibrary = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [allHymns, setAllHymns] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // full object
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
    fetchHymns();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/events`
      );
      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("حدث خطأ أثناء جلب المناسبات");
    }
  };

  const fetchHymns = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/hymns`
      );
      setAllHymns(response.data.hymns || []);
    } catch (error) {
      console.error("Error fetching hymns:", error);
      setError("حدث خطأ أثناء جلب الألحان");
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setSearchTerm("");
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setSelectedEvent(null);
  };

  // Build filtered hymns client-side
  const filteredHymns = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const eventId = selectedEvent?.id || null;
    return (allHymns || []).filter((h) => {
      if (eventId && String(h.event_id) !== String(eventId)) return false;
      if (!q) return true;
      const fields = [
        h.title_arabic,
        h.description,
        h.lyrics_arabic,
        h.lyrics_coptic,
        h.lyrics_arabic_coptic,
      ]
        .filter(Boolean)
        .join("\n")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [allHymns, searchTerm, selectedEvent]);

  // Debounce typing, but filtering is instant; this only avoids rapid state churn
  useEffect(() => {
    const t = setTimeout(() => {}, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleHymnClick = (hymn) => {
    navigate(`/hymns/${hymn.id}`);
  };

  if (loading && filteredHymns.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">مكتبة الألحان</h1>
            <p className="mt-2 text-gray-600">
              استكشف مجموعة  الألحان الكنسية
            </p>
          </div>
          {isAdmin() && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/events")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إدارة المناسبات
              </button>
              <button
                onClick={() => navigate("/hymns/add")}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                إضافة لحن جديد
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="البحث في الالحان..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Events Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                المناسبات 
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setSearchTerm("");
                    fetchHymns();
                  }}
                  className={`w-full text-right p-3 rounded-lg transition-colors ${
                    !selectedEvent && !searchTerm
                      ? "bg-primary text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  جميع الالحان
                </button>
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    className={`w-full text-right p-3 rounded-lg transition-colors flex items-center justify-between ${
                      selectedEvent?.id === event.id
                        ? "bg-primary text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    <span>{event.name_arabic || event.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hymns Grid */}
          <div className="lg:col-span-3">
            {selectedEvent && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedEvent.name_arabic || selectedEvent.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    ({filteredHymns.length} لحن)
                  </span>
                </div>
                {selectedEvent.description && (
                  <p className="mt-2 text-gray-600">
                    {selectedEvent.description}
                  </p>
                )}
              </div>
            )}

            {searchTerm && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  نتائج البحث عن: "{searchTerm}"
                </h3>
                <span className="text-sm text-gray-500">
                  ({filteredHymns.length} لحن)
                </span>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredHymns.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎵</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد الحان
                </h3>
                <p className="text-gray-500">
                  {selectedEvent
                    ? "لا توجد الحان لهذا الحدث"
                    : searchTerm
                    ? "لم يتم العثور على الحان تطابق البحث"
                    : "لم يتم إضافة أي الحان بعد"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredHymns.map((hymn) => (
                  <HymnCard
                    key={hymn.id}
                    hymn={hymn}
                    onClick={handleHymnClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HymnsLibrary;
