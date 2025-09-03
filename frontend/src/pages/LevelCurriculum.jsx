import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../util/axiosConfig";

const SUBJECTS = [
  { key: "taks", label: "طقس" },
  { key: "al7an", label: "ألحان" },
  { key: "coptic", label: "قبطي" },
];

const LevelCurriculum = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [levelMeta, setLevelMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filePresence, setFilePresence] = useState({
    taks: {},
    al7an: {},
    coptic: {},
  });
  const [hymnPresence, setHymnPresence] = useState({
    al7an: {},
  });

  useEffect(() => {
    const loadLevel = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/levels/${levelId}`);
        setLevelMeta(res.data?.level || null);
      } catch (e) {
        setError("تعذر تحميل بيانات المستوى");
      } finally {
        setLoading(false);
      }
    };
    loadLevel();
  }, [levelId]);

  // Load curriculum presence per semester
  useEffect(() => {
    const loadPresence = async () => {
      try {
        // Load curriculum for all subjects to get file presence
        const res = await apiClient.get(`/api/levels/${levelId}/curriculum`, {
          params: { semester: selectedSemester },
        });

        // Load al7an curriculum separately to get hymns
        const al7anRes = await apiClient.get(
          `/api/levels/${levelId}/curriculum`,
          { params: { semester: selectedSemester, subject: "al7an" } }
        );
        const rows = res.data?.curriculum || [];
        const al7anRows = al7anRes.data?.curriculum || [];
        console.log("Curriculum data received:", rows);
        console.log("Al7an curriculum data received:", al7anRows);

        // Merge al7an data with hymns into main rows
        const al7anWithHymns = al7anRows.reduce((acc, al7anRow) => {
          acc[al7anRow.id] = al7anRow;
          return acc;
        }, {});

        const mergedRows = rows.map((row) => {
          if (row.subject === "al7an" && al7anWithHymns[row.id]) {
            return al7anWithHymns[row.id];
          }
          return row;
        });

        console.log("Merged curriculum data:", mergedRows);

        const next = { taks: {}, al7an: {}, coptic: {} };
        const hymnNext = { al7an: {} };

        mergedRows.forEach((r) => {
          const subj = (r.subject || "").toLowerCase();
          if (next[subj] !== undefined) {
            const lectureNum = Number(r.lecture);
            if (!next[subj][lectureNum]) {
              next[subj][lectureNum] = {
                audio: false,
                pdf: false,
                video: false,
              };
            }

            // Check for different file types
            if (r.audio_path) next[subj][lectureNum].audio = true;
            if (r.pdf_path) next[subj][lectureNum].pdf = true;
            if (r.video_path) next[subj][lectureNum].video = true;

            // Legacy support for old path field
            if (r.path && !r.audio_path && !r.pdf_path && !r.video_path) {
              const ext = r.path.toLowerCase().split(".").pop();
              if (ext === "mp3") next[subj][lectureNum].audio = true;
              else if (ext === "pdf") next[subj][lectureNum].pdf = true;
              else if (ext === "mkv") next[subj][lectureNum].video = true;
            }

            // Check for hymns (only for al7an subject)
            if (subj === "al7an" && r.hymns && r.hymns.length > 0) {
              console.log(
                `Found hymns for ${subj} lecture ${lectureNum}:`,
                r.hymns
              );
              if (!hymnNext[subj][lectureNum]) {
                hymnNext[subj][lectureNum] = false;
              }
              hymnNext[subj][lectureNum] = true;
            }
          }
        });
        console.log("File presence:", next);
        console.log("Hymn presence:", hymnNext);
        setFilePresence(next);
        setHymnPresence(hymnNext);
      } catch (e) {
        // silent fail on presence
        setFilePresence({ taks: {}, al7an: {}, coptic: {} });
        setHymnPresence({ al7an: {} });
      }
    };
    loadPresence();
  }, [levelId, selectedSemester]);

  const lectures = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i + 1),
    []
  );

  const renderFileIndicators = (subject, lecture) => {
    const files = filePresence[subject]?.[lecture];
    const hasHymns = hymnPresence[subject]?.[lecture];

    if (!files && !hasHymns) return null;

    const indicators = [];

    // File indicators
    if (files) {
      if (files.audio) {
        indicators.push(
          <span
            key="audio"
            className="inline-block mr-1 h-2 w-2 rounded-full bg-blue-500"
            title="ملف صوتي"
          />
        );
      }
      if (files.pdf) {
        indicators.push(
          <span
            key="pdf"
            className="inline-block mr-1 h-2 w-2 rounded-full bg-green-500"
            title="ملف PDF"
          />
        );
      }
      if (files.video) {
        indicators.push(
          <span
            key="video"
            className="inline-block mr-1 h-2 w-2 rounded-full bg-purple-500"
            title="ملف فيديو"
          />
        );
      }
    }

    // Hymn indicator (only for al7an subject)
    if (subject === "al7an" && hasHymns) {
      indicators.push(
        <span
          key="hymns"
          className="inline-block mr-1 h-2 w-2 rounded-full bg-yellow-500"
          title="ترانيم مرتبطة"
        />
      );
    }

    return indicators;
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
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">المنهج الدراسي</h1>
          <button
            onClick={() => navigate("/levels")}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            رجوع للمستويات
          </button>
        </div>

        {levelMeta && (
          <div className="mb-4 text-gray-700">
            <span className="font-medium">المستوى:</span> {levelMeta.level}{" "}
            &nbsp;| &nbsp; <span className="font-medium">المرحلة:</span>{" "}
            {levelMeta.stage}
          </div>
        )}

        {/* File Type Legend */}
        <div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            مؤشرات الملفات:
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
              <span>ملف صوتي</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
              <span>ملف PDF</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-purple-500"></span>
              <span>ملف فيديو</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-500"></span>
              <span>ترانيم مرتبطة</span>
            </div>
          </div>
        </div>

        {/* Semesters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSemester(s)}
              className={`p-6 rounded-lg shadow-md text-center transition border ${
                selectedSemester === s
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-800 hover:shadow-lg border-gray-200"
              }`}
            >
              {s === 1 ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني"}
            </button>
          ))}
        </div>

        {/* Subjects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUBJECTS.map((subj) => (
            <div key={subj.key} className="bg-white rounded-lg shadow">
              <button
                className="w-full text-right p-4 font-semibold border-b hover:bg-gray-50"
                onClick={() =>
                  setExpandedSubject((prev) =>
                    prev === subj.key ? null : subj.key
                  )
                }
              >
                {subj.label}
              </button>
              {expandedSubject === subj.key && (
                <div className="p-4 grid grid-cols-2 gap-2">
                  {lectures.map((lec) => (
                    <button
                      key={lec}
                      onClick={() =>
                        navigate(
                          `/levels/${levelId}/curriculum/${subj.key}/semesters/${selectedSemester}/lectures/${lec}`
                        )
                      }
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded text-right flex items-center justify-between"
                    >
                      <span>المحاضرة {lec}</span>
                      <div className="flex items-center">
                        {renderFileIndicators(subj.key, lec)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelCurriculum;
