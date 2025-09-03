import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import Avatar from "./Avatar";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const user = storedUser || {};

  // Simple function to check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getLinkClasses = (path) => {
    const baseClasses =
      "px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 rounded-md whitespace-nowrap";
    const activeClasses =
      "text-primary bg-primary/5 relative after:absolute after:-bottom-2 after:right-0 after:left-0 after:mx-auto after:h-0.5 after:w-10 after:bg-primary after:rounded";
    const inactiveClasses = "text-gray-700 hover:text-primary hover:bg-gray-50";

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  const getMobileLinkClasses = (path) => {
    const baseClasses =
      "block px-4 py-3 text-base font-medium transition-all duration-200 rounded-lg flex items-center gap-3";
    const activeClasses = "text-primary bg-primary/10";
    const inactiveClasses = "text-gray-700 hover:text-primary hover:bg-gray-50";

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  // Navigation items with icons
  const navigationItems = [
    { path: "/", label: "الرئيسية", icon: "🏠" },
    { path: "/levels", label: "المستويات", icon: "📚" },
    { path: "/classes", label: "الفصول", icon: "👥" },
    { path: "/bulk-upload", label: "رفع طلاب", icon: "📤" },
    { path: "/schedule", label: "جدول المعلمين", icon: "📅" },
    { path: "/hymns", label: "مكتبة الألحان", icon: "🎵" },
    { path: "/users", label: "المستخدمين", icon: "👤" },
    { path: "/contact", label: "تواصل معنا", icon: "📞" },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Primary Row */}
        <div className="flex items-center justify-between h-16">
          {/* Right: Logo (RTL) */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center group"
              aria-label="الرئيسية"
            >
              <img
                src={logo}
                alt="Logo"
                className="h-10 w-auto transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Center: Nav links (desktop) */}
          <div className="hidden lg:flex items-center">
            <div className="flex items-center gap-1 px-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={getLinkClasses(item.path)}
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Left: Auth / Mobile toggle (RTL) */}
          <div className="flex items-center gap-3">
            {isAuthenticated() ? (
              <div className="hidden lg:flex items-center gap-3 bg-gray-50 rounded-full px-3 py-1.5">
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                    {user?.name || "المستخدم"}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[160px]">
                    {user?.role === "student"
                      ? "طالب"
                      : user?.role === "teacher"
                      ? "معلم"
                      : user?.role === "admin"
                      ? "مدير"
                      : user?.role === "supervisor"
                      ? "مشرف"
                      : "مستخدم"}
                  </span>
                </div>
                <Avatar
                  image={user?.image}
                  name={user?.name}
                  variant="navbar"
                  size="md"
                />
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 rounded-lg hover:bg-gray-50"
                >
                  إنشاء حساب
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors duration-200 rounded-lg shadow-md hover:shadow-lg"
                >
                  تسجيل الدخول
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
              aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Secondary row (small screens): horizontal scroll of links */}
        <div className="lg:hidden -mb-2 pb-2 overflow-x-auto scrollbar-thin">
          <div className="flex gap-1 min-w-max">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${getLinkClasses(item.path)} px-3 py-2`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile slide-over */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="إغلاق القائمة"
            onClick={closeMenu}
          />
          {/* Panel (RTL: from right) */}
          <div
            id="mobile-nav"
            className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Logo" className="h-8 w-auto" />
                <span className="text-sm text-gray-500">القائمة</span>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50"
                aria-label="إغلاق"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={getMobileLinkClasses(item.path)}
                  onClick={closeMenu}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
                {isAuthenticated() ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <Avatar
                      image={user?.image}
                      name={user?.name}
                      variant="compact"
                      size="md"
                    />
                    <div className="flex flex-col text-right leading-tight">
                      <span className="text-sm font-semibold text-gray-900">
                        {user?.name || "المستخدم"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user?.role === "student"
                          ? "طالب"
                          : user?.role === "teacher"
                          ? "معلم"
                          : user?.role === "admin"
                          ? "مدير"
                          : user?.role === "supervisor"
                          ? "مشرف"
                          : "مستخدم"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="block w-full text-right text-gray-700 hover:text-primary hover:bg-gray-50 px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg"
                      onClick={closeMenu}
                    >
                      إنشاء حساب
                    </Link>
                    <Link
                      to="/login"
                      className="block w-full text-right text-white bg-primary hover:bg-primary-dark px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg shadow-md"
                      onClick={closeMenu}
                    >
                      تسجيل الدخول
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
