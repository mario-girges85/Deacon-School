import React from "react";

const HymnCard = ({
  hymn,
  onClick,
  className = "",
  showEvent = true,
  showDuration = true,
  showDescription = true,
  showLyricsInfo = true,
  showAudioIcon = true,
  clickable = true,
}) => {
  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(hymn);
    }
  };

  const cardClasses = `
    bg-white rounded-lg shadow-sm overflow-hidden
    ${clickable ? "hover:shadow-md transition-shadow cursor-pointer" : ""}
    ${className}
  `.trim();

  return (
    <div className={cardClasses} onClick={handleClick}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {hymn.title_arabic}
          </h3>
          {showAudioIcon && hymn.audio_path && (
            <div className="flex-shrink-0 ml-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.814a1 1 0 011.617.814zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {showEvent && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">
              {hymn.event?.name_arabic || hymn.event?.name}
            </span>
          </div>
        )}

        {showDuration && hymn.duration && (
          <div className="flex items-center gap-1 mb-3">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-gray-500">
              {formatDuration(hymn.duration)}
            </span>
          </div>
        )}

        {showDescription && hymn.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {hymn.description}
          </p>
        )}

        {showLyricsInfo && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              {hymn.lyrics_arabic && "عربي"}
              {hymn.lyrics_arabic && hymn.lyrics_coptic && " • "}
              {hymn.lyrics_coptic && "قبطي"}
              {hymn.lyrics_arabic_coptic &&
                (hymn.lyrics_arabic || hymn.lyrics_coptic) &&
                " • "}
              {hymn.lyrics_arabic_coptic && "قبطي معرب "}
            </span>
            {clickable && <span>انقر للعرض</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default HymnCard;
