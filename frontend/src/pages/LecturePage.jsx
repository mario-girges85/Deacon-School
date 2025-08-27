import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const humanize = (s) => {
  if (s === "taks") return "طقس";
  if (s === "al7an") return "ألحان";
  if (s === "coptic") return "قبطي";
  return s;
};

const LecturePage = () => {
  const { levelId, subject, semester, lecture } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);
  const fileInputRef = useRef(null);
  const [levelMeta, setLevelMeta] = useState(null);

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
          axios.get(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/api/levels/${levelId}/curriculum`,
            {
              params: { subject, semester },
            }
          ),
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/levels/${levelId}`
          ),
        ]);

        const found = (curRes.data?.curriculum || []).find(
          (c) => Number(c.lecture) === Number(lecture)
        );
        setInfo(found || null);
        setLevelMeta(levelRes.data?.level || null);
      } catch (e) {
        // ignore
      }
    };
    loadInfo();
  }, [levelId, subject, semester, lecture]);

  const onUpload = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("الرجاء اختيار ملف");
      fileInputRef.current?.click();
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      setUploading(true);
      const url = `${
        import.meta.env.VITE_API_BASE_URL
      }/api/levels/${levelId}/curriculum/${subject}/semesters/${semester}/lectures/${lecture}`;
      const res = await axios.post(url, form);
      setInfo(res.data?.curriculum || null);
    } catch (err) {
      setError(err.response?.data?.error || "فشل رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const renderPreview = () => {
    if (!info?.path) return null;
    const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/${info.path.replace(
      /^\/+/,
      ""
    )}`;
    if (info.path.endsWith(".pdf")) {
      return (
        <iframe
          title="pdf"
          src={fullUrl}
          className="w-full h-96 border rounded"
        />
      );
    }
    if (info.path.endsWith(".mp3")) {
      return (
        <audio controls className="w-full">
          <source src={fullUrl} type="audio/mpeg" />
        </audio>
      );
    }
    return (
      <video controls className="w-full rounded">
        <source src={fullUrl} />
      </video>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {info?.path && (
          <div className="mb-6">
            <div className="mb-2 text-sm text-gray-600">
              الملف الحالي:{" "}
              <a
                className="text-blue-600"
                href={`${import.meta.env.VITE_API_BASE_URL}/${info.path.replace(
                  /^\/+/,
                  ""
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                فتح
              </a>
            </div>
            {renderPreview()}
          </div>
        )}

        <form onSubmit={onUpload} className="bg-white p-4 rounded shadow">
          <div className="block text-sm font-medium text-gray-700 mb-2">
            اختر ملف (mp3, mkv, pdf)
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.mkv,.pdf,application/pdf,audio/mpeg,video/x-matroska,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            >
              اختيار ملف
            </button>
            <span className="text-sm text-gray-600 truncate">
              {file?.name || "لم يتم اختيار ملف"}
            </span>
          </div>
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
          >
            {uploading ? "جاري الرفع..." : "رفع الملف"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LecturePage;
