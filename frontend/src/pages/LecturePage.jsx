import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../util/axiosConfig";
import HymnSelectionPanel from "../components/HymnSelectionPanel";
import CurriculumHymnCard from "../components/CurriculumHymnCard";
import { isAdmin } from "../util/auth";

const humanize = (s) => {
  if (s === "taks") return "طقس";
  if (s === "al7an") return "ألحان";
  if (s === "coptic") return "قبطي";
  return s;
};

const LecturePage = () => {
  const { levelId, subject, semester, lecture } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState({
    audio: null,
    pdf: null,
    video: null,
  });
  const [uploading, setUploading] = useState({
    audio: false,
    pdf: false,
    video: false,
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [info, setInfo] = useState(null);
  const fileInputRefs = {
    audio: useRef(null),
    pdf: useRef(null),
    video: useRef(null),
  };
  const [levelMeta, setLevelMeta] = useState(null);
  const [selectedHymns, setSelectedHymns] = useState([]);
  const [showHymnSelection, setShowHymnSelection] = useState(false);

  const getLevelName = (lvl) => {
    switch (Number(lvl)) {
      case 0:
        return "المستوى التمهيدي";
      case 1:
        return "المستوى الأول";
      case 2:
        return "المستوى الثاني";
      case 3:
        return "المستوى الثالث";
      default:
        return `المستوى ${lvl}`;
    }
  };

  const getStageName = (stg) => {
    switch (Number(stg)) {
      case 1:
        return "المرحلة الأولى";
      case 2:
        return "المرحلة الثانية";
      case 3:
        return "المرحلة الثالثة";
      default:
        return `المرحلة ${stg}`;
    }
  };

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const [curRes, levelRes] = await Promise.all([
          apiClient.get(`/api/levels/${levelId}/curriculum`, {
            params: { subject, semester },
          }),
          apiClient.get(`/api/levels/${levelId}`),
        ]);

        const found = (curRes.data?.curriculum || []).find(
          (c) => Number(c.lecture) === Number(lecture)
        );
        setInfo(found || null);
        setLevelMeta(levelRes.data?.level || null);

        // Load selected hymns for al7an curriculum
        if (subject === "al7an" && found) {
          setSelectedHymns(found.hymns || []);
        }
      } catch (e) {
        console.error("Error in loadInfo:", e);
        console.error("Error response:", e.response?.data);
      }
    };
    loadInfo();
  }, [levelId, subject, semester, lecture]);

  const onUpload = async (fileType) => {
    setError("");
    const file = files[fileType];
    if (!file) {
      setError("الرجاء اختيار ملف");
      fileInputRefs[fileType].current?.click();
      return;
    }

    // If a file already exists for this type, ask for confirmation to overwrite
    const existingUrl =
      (fileType === "audio" && (info?.audio_url || info?.audio_path || info?.path)) ||
      (fileType === "pdf" && (info?.pdf_url || info?.pdf_path || info?.path)) ||
      (fileType === "video" && (info?.video_url || info?.video_path || info?.path)) ||
      null;
    if (existingUrl) {
      const ok = window.confirm("يوجد ملف لهذا النوع بالفعل. هل تريد استبداله؟");
      if (!ok) return;
    }

    const form = new FormData();
    form.append("file", file);

    try {
      setUploading((prev) => ({ ...prev, [fileType]: true }));
      const url = `${
        import.meta.env.VITE_API_BASE_URL
      }/api/levels/${levelId}/curriculum/${subject}/semesters/${semester}/lectures/${lecture}/${fileType}`;
      const res = await apiClient.post(url, form);
      setInfo(res.data?.curriculum || null);
      setFiles((prev) => ({ ...prev, [fileType]: null }));
    } catch (err) {
      setError(err.response?.data?.error || "فشل رفع الملف");
    } finally {
      setUploading((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  const handleFileChange = (fileType, event) => {
    const file = event.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [fileType]: file }));
  };

  const handleHymnSelection = async (hymns) => {
    try {
      setError("");
      setSuccessMessage("");
      console.log("Selected hymns:", hymns);
      const payload = hymns.map((h, idx) => ({
        hymn_id: h.hymn_id,
        lyrics_variants: h.lyrics_variants || ["arabic"],
        sort_order: idx + 1,
      }));
      console.log("Payload being sent:", payload);

      const response = await apiClient.put(
        `/api/levels/${levelId}/curriculum/${subject}/semesters/${semester}/lectures/${lecture}/hymns`,
        { hymns: payload }
      );

      console.log("Backend response:", response.data);
      console.log("Response status:", response.status);

      setSelectedHymns(hymns);
      setError(""); // Clear any previous errors
      setSuccessMessage("تم حفظ الالحان بنجاح!"); // Show success message
      // Refresh the curriculum data to get updated hymns
      loadInfo();
    } catch (e) {
      console.error("Error in handleHymnSelection:", e);
      console.error("Error response:", e.response?.data);
      console.error("Error status:", e.response?.status);
      setError(e.response?.data?.error);
      setSuccessMessage(""); // Clear success message on error
    }
  };

  const handleRemoveHymn = async (hymnToRemove) => {
    try {
      const updatedHymns = selectedHymns.filter(
        (h) => h.hymn_id !== hymnToRemove.hymn_id
      );
      await handleHymnSelection(updatedHymns);
    } catch (e) {
      setError(e.response?.data?.error || "فشل إزالة الالحانة");
    }
  };

  const deleteFile = async (fileType) => {
    try {
      const ok = window.confirm("هل أنت متأكد من حذف هذا الملف؟");
      if (!ok) return;
      const res = await apiClient.delete(
        `/api/levels/${levelId}/curriculum/${subject}/semesters/${semester}/lectures/${lecture}/${fileType}`
      );
      setInfo(res.data?.curriculum || null);
    } catch (e) {
      setError(e.response?.data?.error || "فشل حذف الملف");
    }
  };

  const getFileForType = (infoObj, type) => {
    if (!infoObj) return null;
    const direct = infoObj[`${type}_url`] || infoObj[`${type}_path`];
    if (direct) return direct;
    // Legacy single path fallback only if extension matches requested type
    const p = infoObj.path || "";
    const lower = String(p).toLowerCase();
    if (!lower) return null;
    if (type === "audio" && lower.endsWith(".mp3")) return p;
    if (type === "pdf" && lower.endsWith(".pdf")) return p;
    if (type === "video" && (lower.endsWith(".mkv") || lower.endsWith(".webm"))) return p;
    return null;
  };

  const renderFilePreview = (filePathOrUrl, fileType) => {
    if (!filePathOrUrl) return null;

    // If already an absolute URL, use it as is; else treat as relative path under API base
    const isAbsolute = /^(https?:)?\/\//i.test(String(filePathOrUrl));
    const normalized = String(filePathOrUrl);
    const fullUrl = isAbsolute
      ? normalized
      : `${import.meta.env.VITE_API_BASE_URL}/${normalized.replace(/^\/+/, "")}`;

    if (fileType === "pdf") {
      return (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">ملف PDF:</h4>
          <iframe
            title="pdf"
            src={fullUrl}
            className="w-full h-96 border rounded"
          />
          {isAdmin() && (
            <div className="mt-2 text-right">
              <button
                onClick={() => deleteFile("pdf")}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded"
              >
                حذف
              </button>
            </div>
          )}
        </div>
      );
    }

    if (fileType === "audio") {
      return (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">ملف صوتي:</h4>
          <audio controls className="w-full">
            <source src={fullUrl} type="audio/mpeg" />
          </audio>
          {isAdmin() && (
            <div className="mt-2 text-right">
              <button
                onClick={() => deleteFile("audio")}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded"
              >
                حذف
              </button>
            </div>
          )}
        </div>
      );
    }

    if (fileType === "video") {
      return (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">ملف فيديو:</h4>
          <video controls className="w-full rounded">
            <source src={fullUrl} />
          </video>
          {isAdmin() && (
            <div className="mt-2 text-right">
              <button
                onClick={() => deleteFile("video")}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded"
              >
                حذف
              </button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderUploadSection = (fileType, label, accept) => (
    <div key={fileType} className="bg-white p-4 rounded shadow mb-4">
      <div className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </div>
      <input
        ref={fileInputRefs[fileType]}
        type="file"
        accept={accept}
        onChange={(e) => handleFileChange(fileType, e)}
        className="hidden"
      />
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => fileInputRefs[fileType].current?.click()}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
        >
          اختيار ملف
        </button>
        <span className="text-sm text-gray-600 truncate">
          {files[fileType]?.name || "لم يتم اختيار ملف"}
        </span>
      </div>
      {files[fileType] && (
        <button
          onClick={() => onUpload(fileType)}
          disabled={uploading[fileType]}
          className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
        >
          {uploading[fileType] ? "جاري الرفع..." : "رفع الملف"}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {`المحاضرة ${lecture} - ${humanize(subject)} - الفصل ${semester}`}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            رجوع
          </button>
        </div>

        <div className="mb-4 text-gray-700">
          {levelMeta && (
            <>
              <span className="font-medium">المستوى:</span>{" "}
              {getLevelName(levelMeta.level)} |{" "}
              <span className="font-medium">المرحلة:</span>{" "}
              {getStageName(levelMeta.stage)} |{" "}
            </>
          )}
          <span className="font-medium">المادة:</span> {humanize(subject)} |{" "}
          <span className="font-medium">الفصل الدراسي:</span> {semester} |{" "}
          <span className="font-medium">المحاضرة:</span> {lecture}
        </div>

        {/* Hymns for al7an - visible to all; controls only for admins */}
        {subject === "al7an" && (
          <div className="mb-6 bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">الحان المحاضرة</h3>
              {isAdmin() && (
                <button
                  onClick={() => setShowHymnSelection(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  إضافة الحان من المكتبة
                </button>
              )}
            </div>

            {selectedHymns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎵</div>
                <p>لم يتم اختيار أي الحان لهذه المحاضرة</p>
                {isAdmin() && (
                  <p className="text-sm">
                    انقر على "إضافة الحان من المكتبة" لاختيار الالحان
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedHymns.map((selectedHymn, index) => (
                  <CurriculumHymnCard
                    key={`${selectedHymn.hymn_id}-${index}`}
                    hymn={selectedHymn.hymn}
                    lyricsVariants={
                      selectedHymns[index].lyrics_variants || [
                        selectedHymn.lyrics_variant,
                      ] || ["arabic"]
                    }
                    {...(isAdmin()
                      ? { onRemove: () => handleRemoveHymn(selectedHymn) }
                      : {})}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* File Previews */}
        {info && (
          <div className="mb-6">
            {getFileForType(info, "audio") &&
              renderFilePreview(getFileForType(info, "audio"), "audio")}
            {getFileForType(info, "pdf") &&
              renderFilePreview(getFileForType(info, "pdf"), "pdf")}
            {getFileForType(info, "video") &&
              renderFilePreview(getFileForType(info, "video"), "video")}
          </div>
        )}

        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        {successMessage && (
          <div className="text-green-600 text-sm mb-3">{successMessage}</div>
        )}

        {/* Upload Sections - Admin Only */}
        {isAdmin() && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderUploadSection("audio", "ملف صوتي (MP3)", ".mp3,audio/mpeg")}
            {renderUploadSection("pdf", "ملف PDF", ".pdf,application/pdf")}
            {renderUploadSection(
              "video",
              "ملف فيديو (MKV)",
              ".mkv,video/x-matroska,video/webm"
            )}
          </div>
        )}
      </div>

      {/* Hymn Selection Panel */}
      {isAdmin() && (
        <HymnSelectionPanel
          isOpen={showHymnSelection}
          onClose={() => setShowHymnSelection(false)}
          onSelectHymns={handleHymnSelection}
          selectedHymns={selectedHymns}
        />
      )}
    </div>
  );
};

export default LecturePage;
