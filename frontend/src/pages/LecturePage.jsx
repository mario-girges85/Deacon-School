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
  const [files, setFiles] = useState({
    audio: null,
    pdf: null,
    video: null
  });
  const [uploading, setUploading] = useState({
    audio: false,
    pdf: false,
    video: false
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);
  const fileInputRefs = {
    audio: useRef(null),
    pdf: useRef(null),
    video: useRef(null)
  };
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

  const onUpload = async (fileType) => {
    setError("");
    const file = files[fileType];
    if (!file) {
      setError("الرجاء اختيار ملف");
      fileInputRefs[fileType].current?.click();
      return;
    }

    const form = new FormData();
    form.append("file", file);
    
    try {
      setUploading(prev => ({ ...prev, [fileType]: true }));
      const url = `${
        import.meta.env.VITE_API_BASE_URL
      }/api/levels/${levelId}/curriculum/${subject}/semesters/${semester}/lectures/${lecture}/${fileType}`;
      const res = await axios.post(url, form);
      setInfo(res.data?.curriculum || null);
      setFiles(prev => ({ ...prev, [fileType]: null }));
    } catch (err) {
      setError(err.response?.data?.error || "فشل رفع الملف");
    } finally {
      setUploading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  const handleFileChange = (fileType, event) => {
    const file = event.target.files?.[0] || null;
    setFiles(prev => ({ ...prev, [fileType]: file }));
  };

  const renderFilePreview = (filePath, fileType) => {
    if (!filePath) return null;
    
    const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/${filePath.replace(/^\/+/, "")}`;
    
    if (fileType === "pdf") {
      return (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">ملف PDF:</h4>
          <iframe
            title="pdf"
            src={fullUrl}
            className="w-full h-96 border rounded"
          />
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

        {/* File Previews */}
        {info && (
          <div className="mb-6">
            {info.audio_path && renderFilePreview(info.audio_path, "audio")}
            {info.pdf_path && renderFilePreview(info.pdf_path, "pdf")}
            {info.video_path && renderFilePreview(info.video_path, "video")}
            {info.path && !info.audio_path && !info.pdf_path && !info.video_path && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">الملف الحالي:</h4>
                <a
                  className="text-blue-600"
                  href={`${import.meta.env.VITE_API_BASE_URL}/${info.path.replace(/^\/+/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  فتح الملف
                </a>
              </div>
            )}
          </div>
        )}

        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

        {/* Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderUploadSection("audio", "ملف صوتي (MP3)", ".mp3,audio/mpeg")}
          {renderUploadSection("pdf", "ملف PDF", ".pdf,application/pdf")}
          {renderUploadSection("video", "ملف فيديو (MKV)", ".mkv,video/x-matroska,video/webm")}
        </div>
      </div>
    </div>
  );
};

export default LecturePage;
