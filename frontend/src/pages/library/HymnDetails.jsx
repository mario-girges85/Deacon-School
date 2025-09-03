import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { isAdmin } from "../../util/auth";

const HymnDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [hymn, setHymn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get selected lyrics variants from navigation state
  const selectedLyricsVariants = location.state?.selectedLyricsVariants || [
    "arabic",
  ];
  const fromCurriculum = location.state?.fromCurriculum || false;

  // Set initial active tab based on selected variants
  const [activeTab, setActiveTab] = useState(
    selectedLyricsVariants[0] || "arabic"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const isSeekingRef = useRef(false);

  const getSeekTimeFromEvent = (clientX) => {
    const bar = progressBarRef.current;
    if (!bar || duration <= 0) return 0;
    const rect = bar.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ratio = rect.width > 0 ? x / rect.width : 0;
    return Math.min(Math.max(ratio * duration, 0), duration);
  };

  useEffect(() => {
    fetchHymn();
  }, [id]);

  const fetchHymn = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/hymns/${id}`
      );
      setHymn(response.data.hymn);
    } catch (error) {
      console.error("Error fetching hymn:", error);
      setError("حدث خطأ أثناء جلب الترانيمة");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getAudioUrl = () =>
    `${import.meta.env.VITE_API_BASE_URL}/${hymn.audio_path}`;

  const buildDownloadFilename = () => {
    const path = hymn?.audio_path || "";
    const extMatch = path.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : "mp3";
    const base = (hymn?.title_arabic || "hymn")
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
    return `${base}.${ext}`;
  };

  const handleDirectDownload = async () => {
    try {
      const url = getAudioUrl();
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = buildDownloadFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error("Download error:", e);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
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

  if (error || !hymn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">
            {error || "الترانيمة غير موجودة"}
          </p>
          <button
            onClick={() => navigate("/hymns")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            العودة للمكتبة
          </button>
        </div>
      </div>
    );
  }

  const allTabs = [
    { id: "arabic", label: "العربية", content: hymn.lyrics_arabic },
    { id: "coptic", label: "القبطية", content: hymn.lyrics_coptic },
    {
      id: "arabic_coptic",
      label: "العربية القبطية",
      content: hymn.lyrics_arabic_coptic,
    },
  ];

  // Filter tabs based on selected lyrics variants if coming from curriculum
  const tabs = fromCurriculum
    ? allTabs.filter(
        (tab) => selectedLyricsVariants.includes(tab.id) && tab.content
      )
    : allTabs.filter((tab) => tab.content);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(fromCurriculum ? -1 : "/hymns")}
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
          {isAdmin() && (
            <button
              onClick={() => navigate(`/hymns/${id}/edit`)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              تعديل
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {hymn.title_arabic}
              </h1>

              {fromCurriculum && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">
                      من المحاضرة - النصوص المختارة:{" "}
                      {selectedLyricsVariants
                        .map((v) =>
                          v === "arabic"
                            ? "العربية"
                            : v === "coptic"
                            ? "القبطية"
                            : "العربية القبطية"
                        )
                        .join(", ")}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg text-gray-600">
                  {hymn.event?.name_arabic || hymn.event?.name}
                </span>
                {hymn.duration && (
                  <span className="text-sm text-gray-500">
                    • {formatDuration(hymn.duration)}
                  </span>
                )}
              </div>
              {hymn.description && (
                <p className="text-gray-600">{hymn.description}</p>
              )}
            </div>
          </div>

          {hymn.audio_path && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <audio
                  ref={audioRef}
                  controls
                  className="flex-1"
                  src={getAudioUrl()}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  متصفحك لا يدعم تشغيل الملفات الصوتية.
                </audio>
                <button
                  type="button"
                  onClick={handleDirectDownload}
                  className="px-3 py-2 bg-primary text-white rounded hover:bg-primary-dark whitespace-nowrap"
                >
                  تنزيل مباشر
                </button>
              </div>
            </div>
          )}
        </div>

        {tabs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-6">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`${activeTab === tab.id ? "block" : "hidden"}`}
                >
                  <div
                    className={`prose max-w-none ${
                      tab.id === "coptic" ? "coptic-text" : ""
                    }`}
                    style={{
                      fontFamily:
                        tab.id === "coptic" ? "CopticFont, serif" : "inherit",
                      fontSize: tab.id === "coptic" ? "1.2em" : "inherit",
                      lineHeight: "1.8",
                      whiteSpace: "pre-wrap",
                      textAlign: "right",
                      direction: "rtl",
                    }}
                  >
                    {tab.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tabs.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد كلمات متاحة
            </h3>
            <p className="text-gray-500">
              لم يتم إضافة كلمات لهذه الترانيمة بعد
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HymnDetails;
