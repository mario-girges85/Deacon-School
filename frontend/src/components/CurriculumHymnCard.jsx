import React from "react";
import { useNavigate } from "react-router-dom";

const CurriculumHymnCard = ({
  hymn,
  lyricsVariants = ["arabic"],
  onRemove,
  className = "",
}) => {
  const navigate = useNavigate();
  const getLyricsVariantLabel = (variant) => {
    switch (variant) {
      case "arabic":
        return "العربية";
      case "coptic":
        return "القبطية";
      case "arabic_coptic":
        return "العربية القبطية";
      default:
        return "العربية";
    }
  };

  const getAudioUrl = () => {
    if (!hymn.audio_path) return null;
    return `${import.meta.env.VITE_API_BASE_URL}/${hymn.audio_path}`;
  };

  const handleHymnClick = () => {
    // Navigate to hymn details page with selected lyrics variants
    navigate(`/hymns/${hymn.id}`, {
      state: {
        selectedLyricsVariants: lyricsVariants,
        fromCurriculum: true,
      },
    });
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-primary transition-all duration-200 ${className}`}
      onClick={handleHymnClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            {hymn.title_arabic}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            {hymn.event?.name_arabic || hymn.event?.name}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {lyricsVariants.map((variant) => (
              <span
                key={variant}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {getLyricsVariantLabel(variant)}
              </span>
            ))}
            {hymn.duration && (
              <span className="text-xs text-gray-500">
                {Math.floor(hymn.duration / 60)}:
                {(hymn.duration % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
        </div>

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              onRemove();
            }}
            className="ml-3 p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="إزالة الترانيمة"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {hymn.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {hymn.description}
        </p>
      )}

      {getAudioUrl() && (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <audio controls className="flex-1 h-8">
            <source src={getAudioUrl()} type="audio/mpeg" />
            متصفحك لا يدعم تشغيل الملفات الصوتية.
          </audio>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {hymn.lyrics_arabic && "عربي"}
          {hymn.lyrics_arabic && hymn.lyrics_coptic && " • "}
          {hymn.lyrics_coptic && "قبطي"}
          {hymn.lyrics_arabic_coptic &&
            (hymn.lyrics_arabic || hymn.lyrics_coptic) &&
            " • "}
          {hymn.lyrics_arabic_coptic && "عربي قبطي"}
        </span>
        <span className="text-primary">من المكتبة</span>
      </div>
    </div>
  );
};

export default CurriculumHymnCard;
