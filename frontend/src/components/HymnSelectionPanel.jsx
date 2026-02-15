import React, { useState, useEffect } from "react";
import axios from "axios";
import HymnCard from "./HymnCard";

const HymnSelectionPanel = ({
  isOpen,
  onClose,
  onSelectHymns,
  selectedHymns = [],
}) => {
  const [events, setEvents] = useState([]);
  const [hymns, setHymns] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempSelectedHymns, setTempSelectedHymns] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      fetchHymns();
      setTempSelectedHymns(selectedHymns);
    }
  }, [isOpen, selectedHymns]);

  // Update tempSelectedHymns when selectedHymns prop changes
  useEffect(() => {
    setTempSelectedHymns(selectedHymns);
  }, [selectedHymns]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/events`,
      );
      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("حدث خطأ أثناء جلب الأحداث");
    }
  };

  const fetchHymns = async (eventId = null, search = "") => {
    try {
      setLoading(true);
      const params = {};
      if (eventId) params.event_id = eventId;
      if (search) params.search = search;

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/hymns`,
        { params },
      );
      setHymns(response.data.hymns || []);
    } catch (error) {
      console.error("Error fetching hymns:", error);
      setError("حدث خطأ أثناء جلب الالحان");
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setSearchTerm("");
    fetchHymns(event.id);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setSelectedEvent(null);
    fetchHymns(null, term);
  };

  const handleHymnToggle = (hymn) => {
    console.log("Toggling hymn:", hymn);
    setTempSelectedHymns((prev) => {
      const exists = prev.find((h) => h.hymn_id === hymn.id);
      if (exists) {
        return prev.filter((h) => h.hymn_id !== hymn.id);
      } else {
        const newHymn = {
          hymn_id: hymn.id,
          hymn: hymn,
          lyrics_variants: ["arabic"], // default to Arabic only
        };
        console.log("Adding new hymn:", newHymn);
        return [...prev, newHymn];
      }
    });
  };

  const handleLyricsVariantToggle = (hymnId, variant) => {
    setTempSelectedHymns((prev) =>
      prev.map((h) => {
        if (h.hymn_id === hymnId) {
          const currentVariants = h.lyrics_variants || [];
          const newVariants = currentVariants.includes(variant)
            ? currentVariants.filter((v) => v !== variant)
            : [...currentVariants, variant];

          // Ensure at least one variant is selected
          if (newVariants.length === 0) {
            return { ...h, lyrics_variants: ["arabic"] };
          }

          return { ...h, lyrics_variants: newVariants };
        }
        return h;
      }),
    );
  };

  const handleConfirm = () => {
    console.log("Confirming hymn selection:", tempSelectedHymns);
    onSelectHymns(tempSelectedHymns);
    onClose();
  };

  const isHymnSelected = (hymnId) => {
    return tempSelectedHymns.some((h) => h.hymn_id === hymnId);
  };

  const getSelectedHymn = (hymnId) => {
    return tempSelectedHymns.find((h) => h.hymn_id === hymnId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">اختيار الالحان</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <svg
                    className="w-2 h-2 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>مختار</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-2 h-2 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>موجود في الدرس</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Events and Hymns */}
          <div className="flex-1 flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="البحث في الالحان..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
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

            <div className="flex flex-1 overflow-hidden">
              {/* Events Sidebar */}
              <div className="w-64 border-r overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    المناسبات
                  </h3>
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
                        className={`w-full text-right p-3 rounded-lg transition-colors ${
                          selectedEvent?.id === event.id
                            ? "bg-primary text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        {event.name_arabic || event.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hymns Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : hymns.length === 0 ? (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hymns.map((hymn) => (
                      <div key={hymn.id} className="relative">
                        <HymnCard
                          hymn={hymn}
                          onClick={() => handleHymnToggle(hymn)}
                          className={`cursor-pointer transition-all ${
                            isHymnSelected(hymn.id)
                              ? "ring-2 ring-primary bg-primary-50"
                              : "hover:shadow-md"
                          }`}
                        />
                        {isHymnSelected(hymn.id) && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                        {/* Show if hymn is already in curriculum */}
                        {selectedHymns.some((h) => h.hymn_id === hymn.id) &&
                          !isHymnSelected(hymn.id) && (
                            <div className="absolute top-2 left-2">
                              <div
                                className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center"
                                title="موجود في الدرس"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Selected Hymns */}
          <div className="w-80 border-l bg-gray-50 overflow-y-auto">
            <div className="p-4">
              {/* Action Buttons at Top */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={tempSelectedHymns.length === 0}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                    tempSelectedHymns.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`}
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  تأكيد الاختيار ({tempSelectedHymns.length})
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                الالحان المختارة ({tempSelectedHymns.length})
              </h3>

              {/* Show already added hymns */}
              {selectedHymns.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    الالحان الموجودة في الدرس ({selectedHymns.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedHymns.map((hymn) => (
                      <div
                        key={hymn.hymn_id}
                        className="text-sm text-green-700 bg-white p-2 rounded border"
                      >
                        <div className="font-medium">
                          {hymn.hymn?.title_arabic}
                        </div>
                        <div className="text-xs text-green-600">
                          {Array.isArray(hymn.lyrics_variants)
                            ? hymn.lyrics_variants
                                .map((v) =>
                                  v === "arabic"
                                    ? "العربية"
                                    : v === "coptic"
                                      ? "القبطية"
                                      : "العربية القبطية",
                                )
                                .join(", ")
                            : "العربية"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tempSelectedHymns.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  لم يتم اختيار أي الحان
                </p>
              ) : (
                <div className="space-y-3">
                  {tempSelectedHymns.map((selectedHymn) => (
                    <div
                      key={selectedHymn.hymn_id}
                      className="bg-white rounded-lg p-3 shadow-sm"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">
                        {selectedHymn.hymn.title_arabic}
                      </h4>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          أنواع النصوص:
                        </label>
                        <div className="space-y-2">
                          {[
                            { value: "arabic", label: "العربية" },
                            { value: "coptic", label: "القبطية" },
                            {
                              value: "arabic_coptic",
                              label: "العربية القبطية",
                            },
                          ].map((variant) => (
                            <label
                              key={variant.value}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={(
                                  selectedHymn.lyrics_variants || []
                                ).includes(variant.value)}
                                onChange={() =>
                                  handleLyricsVariantToggle(
                                    selectedHymn.hymn_id,
                                    variant.value,
                                  )
                                }
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span>{variant.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleHymnToggle(selectedHymn.hymn)}
                        className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      >
                        إزالة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HymnSelectionPanel;
