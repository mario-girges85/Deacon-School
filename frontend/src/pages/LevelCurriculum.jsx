import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

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

  useEffect(() => {
    const loadLevel = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/levels/${levelId}`
        );
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
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/levels/${levelId}/curriculum`,
          { params: { semester: selectedSemester } }
        );
        const rows = res.data?.curriculum || [];
        const next = { taks: {}, al7an: {}, coptic: {} };
        rows.forEach((r) => {
          if (r?.path) {
            const subj = (r.subject || "").toLowerCase();
            if (next[subj] !== undefined) {
              next[subj][Number(r.lecture)] = true;
            }
          }
        });
        setFilePresence(next);
      } catch (e) {
        // silent fail on presence
        setFilePresence({ taks: {}, al7an: {}, coptic: {} });
      }
    };
    loadPresence();
  }, [levelId, selectedSemester]);

  const lectures = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i + 1),
    []
  );

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
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded text-right"
                    >
                      المحاضرة {lec}
                      {filePresence[subj.key]?.[lec] && (
                        <span className="inline-block mr-2 h-2 w-2 rounded-full bg-green-500 align-middle" />
                      )}
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
