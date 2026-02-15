import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import Avatar from "./Avatar";
import { isAdmin } from "../util/auth";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const [user, setUser] = useState(storedUser || {});

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

  // Keep avatar in sync when profile image changes
  useEffect(() => {
    const refreshUser = () => {
      const u = JSON.parse(localStorage.getItem("user") || "null") || {};
      setUser(u);
    };
    const onStorage = (e) => {
      if (e.key === "user" || e.key === null) refreshUser();
    };
    const onUserUpdated = () => refreshUser();
    window.addEventListener("storage", onStorage);
    window.addEventListener("user:updated", onUserUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("user:updated", onUserUpdated);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if (isMenuOpen) setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Navigation items with icons
  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";
  const showLevels = !isStudent && !isTeacher; // admin and supervisor only
  const navigationItems = [
    { path: "/", label: "الرئيسية", icon: "🏠" },
    ...(showLevels ? [{ path: "/levels", label: "المستويات", icon: "📚" }] : []),
    { path: "/classes", label: "الفصول", icon: "👥" },
    ...(isAdmin()
      ? [{ path: "/schedule", label: "جدول الخدام", icon: "📅" }]
      : []),
    ...(isAdmin() ? [{ path: "/hymns", label: "مكتبة الألحان", icon: "🎵" }] : []),
    // Only show Users link for admins
    ...(isAdmin() ? [{ path: "/users", label: "المستخدمين", icon: "👤" }] : []),
    ...(isAdmin() ? [{ path: "/contact-messages", label: "رسائل التواصل", icon: "📩" }] : []),
    ...(!isAdmin() ? [{ path: "/contact", label: "تواصل معنا", icon: "📞" }] : []),
  ];

  return (
    <>
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
                        ? "خادم"
                        : user?.role === "admin"
                        ? "ادمن"
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
                    to="/login"
                    className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors duration-200 rounded-lg shadow-md hover:shadow-lg"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              )}

              {/* Admin-only signup button removed from navbar */}

              {/* Mobile avatar (replaces old menu icon) */}
              {isAuthenticated() ? (
                <div className="lg:hidden flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {user?.name || "المستخدم"}
                  </span>
                  <Avatar
                    image={user?.image}
                    name={user?.name}
                    variant="navbar"
                    size="sm"
                  />
                </div>
              ) : (
                <Link
                  to="/login"
                  className="lg:hidden px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors duration-200 rounded-lg shadow-md"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </div>

          {/* Secondary row (small screens): horizontal scroll of links */}
          {!isMenuOpen && (
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
          )}
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
              className={`absolute right-0 top-0 h-full w-[22rem] max-w-[100vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
                isMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Logo" className="h-8 w-auto" />
                  <span className="text-base font-medium text-gray-700">
                    القائمة
                  </span>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-full text-gray-700 hover:text-white hover:bg-primary transition-colors"
                  aria-label="إغلاق"
                >
                  <svg
                    className="h-5 w-5"
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

              <div className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-4rem)] pb-24">
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
                            ? "خادم"
                            : user?.role === "admin"
                            ? "مدير"
                            : user?.role === "supervisor"
                            ? "مشرف"
                            : "مستخدم"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      className="block w-full text-right text-white bg-primary hover:bg-primary-dark px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg shadow-md"
                      onClick={closeMenu}
                    >
                      تسجيل الدخول
                    </Link>
                  )}

                  {/* Admin-only signup button in mobile menu */}
                  {isAuthenticated() && isAdmin() && (
                    <Link
                      to="/signup"
                      className="block w-full text-right text-gray-700 hover:text-primary hover:bg-gray-50 px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg border border-gray-200"
                      onClick={closeMenu}
                    >
                      إنشاء حساب جديد
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Bottom mobile nav */}
      {/* Visible only on small screens */}
      {/* Safe-area aware for modern phones */}
      {!isMenuOpen && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200">
          <div className="grid grid-cols-5 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            {[
              { path: "/", label: "الرئيسية", icon: "🏠" },
              ...(showLevels ? [{ path: "/levels", label: "المستويات", icon: "📚" }] : []),
              { path: "/classes", label: "الفصول", icon: "👥" },
              ...(isAdmin() ? [{ path: "/hymns", label: "الألحان", icon: "🎵" }] : []),
              isAuthenticated()
                ? { path: "/profile", label: "حسابي", icon: "👤" }
                : { path: "/login", label: "دخول", icon: "🔑" },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md text-xs ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
