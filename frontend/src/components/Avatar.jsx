import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { logout } from "../util/auth";
import { useNavigate } from "react-router-dom";
/**
 * Avatar Component - Perfect for navbar integration
 *
 * Usage Examples:
 *
 * // Basic navbar avatar with menu
 * <Avatar
 *   image={user.image}
 *   name={user.name}
 *   variant="navbar"
 *   size="md"
 * />
 *
 * // Compact navbar avatar (no description text)
 * <Avatar
 *   image={user.image}
 *   name={user.name}
 *   variant="compact"
 *   size="sm"
 * />
 *
 * // Read-only avatar (no menu)
 * <Avatar
 *   image={user.image}
 *   name={user.name}
 *   showMenu={false}
 * />
 *
 * // With custom logout handler
 * <Avatar
 *   image={user.image}
 *   name={user.name}
 *   onLogout={() => navigate('/login')}
 * />
 */

const Avatar = ({
  image,
  name,
  size = "md",
  className = "",
  showMenu = true,
  onLogout,
  variant = "default", // "default", "navbar", "compact"
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  // Variant-specific styling
  const variantClasses = {
    default: "border-2 border-gray-200 hover:border-primary",
    navbar: "border-2 border-gray-100 hover:border-primary/80 shadow-sm",
    compact: "border border-gray-200 hover:border-primary/60",
  };

  // Handle logout
  const handleLogout = () => {
    // Remove token from localStorage
    logout();
    navigate("/login");

    // Call custom logout handler if provided
    if (onLogout) {
      onLogout();
    }

    setIsMenuOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Avatar Image */}
      <button
        onClick={() => showMenu && setIsMenuOpen(!isMenuOpen)}
        className={`${sizeClasses[size]} rounded-full overflow-hidden ${
          variantClasses[variant]
        } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          !showMenu ? "cursor-default" : "cursor-pointer"
        }`}
        aria-label={showMenu ? "User menu" : "User avatar"}
      >
        {image ? (
          <img
            src={image}
            alt={name || "User avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <svg
              className="w-1/2 h-1/2 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && isMenuOpen && (
        <div
          className={`absolute left-full top-full ml-2 mt-2 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 ${
            variant === "compact" ? "w-40" : "w-48"
          }`}
        >
          {/* User Info */}
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {name || "User"}
            </p>
            {variant !== "compact" && (
              <p className="text-xs text-gray-500">Click to view options</p>
            )}
          </div>

          {/* Profile Link */}
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 flex items-center"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg
              className="w-4 h-4 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            الملف الشخصي
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
};

export default Avatar;
