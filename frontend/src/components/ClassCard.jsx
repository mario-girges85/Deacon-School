import React from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const ClassCard = ({
  classItem,
  getLevelName,
  getStageName,
  onClick,
  showActionIndicator = true,
  className = "",
  variant = "default", // "default", "compact", "detailed"
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(classItem);
    } else {
      // Default behavior: navigate to class details
      navigate(`/classes/${classItem.id}`);
    }
  };

  const baseClasses =
    "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-100 hover:border-blue-200";
  const cardClasses = `${baseClasses} ${className}`;

  const renderCompact = () => (
    <div className={cardClasses} onClick={handleClick}>
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-2">
          <span className="text-lg">📚</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {classItem.location}
        </h3>
        <p className="text-sm text-gray-600">
          {classItem.level
            ? `${getLevelName(classItem.level.level)} - ${getStageName(
                classItem.level.stage,
                classItem.level.level
              )}`
            : "غير محدد"}
        </p>
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className={cardClasses} onClick={handleClick}>
      {/* Header with icon and title */}
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
          <span className="text-2xl">📚</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {classItem.location}
        </h3>
        <p className="text-gray-600 font-medium">
          {classItem.level
            ? `${getLevelName(classItem.level.level)} - ${getStageName(
                classItem.level.stage,
                classItem.level.level
              )}`
            : "غير محدد"}
        </p>
      </div>

      {/* Class details */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
          <span className="text-gray-600 text-sm">المستوى:</span>
          <span className="font-medium text-gray-900">
            {classItem.level ? getLevelName(classItem.level.level) : "غير محدد"}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
          <span className="text-gray-600 text-sm">السنة :</span>
          <span className="font-medium text-gray-900">
            {classItem.level
              ? getStageName(classItem.level.stage, classItem.level.level)
              : "غير محدد"}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
          <span className="text-gray-600 text-sm">المكان :</span>
          <span className="font-medium text-gray-900">
            {classItem.location}
          </span>
        </div>
      </div>

      {/* Action indicator */}
      {showActionIndicator && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center text-blue-600 text-sm font-medium">
            <span className="mr-1">عرض التفاصيل</span>
            <svg
              className="w-4 h-4 mr-1 rtl:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );

  const renderDefault = () => (
    <div className={cardClasses} onClick={handleClick}>
      {/* Header with icon and title */}
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
          <span className="text-2xl">📚</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {classItem.location}
        </h3>
        <p className="text-gray-600 font-medium">
          {classItem.level
            ? `${getLevelName(classItem.level.level)} - ${getStageName(
                classItem.level.stage,
                classItem.level.level
              )}`
            : "غير محدد"}
        </p>
      </div>

      {/* Class details */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
          <span className="text-gray-600 text-sm">المستوى:</span>
          <span className="font-medium text-gray-900">
            {classItem.level ? getLevelName(classItem.level.level) : "غير محدد"}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
          <span className="text-gray-600 text-sm">السنة :</span>
          <span className="font-medium text-gray-900">
            {classItem.level
              ? getStageName(classItem.level.stage, classItem.level.level)
              : "غير محدد"}
          </span>
        </div>

        <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-md">
          <span className="text-gray-600 text-sm">المكان : {classItem.location}</span>
          
        </div>
      </div>

      {/* Action indicator */}
      {Array.isArray(classItem.students_preview) &&
        classItem.students_preview.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {classItem.students_preview.map((s, idx) => (
                <img
                  key={s.id}
                  src={
                    s.image ||
                    "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(s.name)
                  }
                  alt={s.name}
                  title={s.name}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                  style={{ zIndex: 10 - idx }}
                />
              ))}
            </div>
          </div>
        )}

      {showActionIndicator && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center text-blue-600 text-sm font-medium">
            <span className="mr-1">عرض التفاصيل</span>
            <svg
              className="w-4 h-4 mr-1 rtl:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );

  // Render based on variant
  switch (variant) {
    case "compact":
      return renderCompact();
    case "detailed":
      return renderDetailed();
    default:
      return renderDefault();
  }
};

ClassCard.propTypes = {
  classItem: PropTypes.shape({
    id: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    level: PropTypes.shape({
      level: PropTypes.number.isRequired,
      stage: PropTypes.number.isRequired,
    }),
  }).isRequired,
  getLevelName: PropTypes.func.isRequired,
  getStageName: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  showActionIndicator: PropTypes.bool,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "compact", "detailed"]),
};

export default ClassCard;
