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

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getLinkClasses = (path) => {
    const baseClasses =
      "px-3 py-2 text-sm font-medium transition-colors duration-200";
    const activeClasses = "text-primary";
    const inactiveClasses = "text-gray-700 hover:text-primary";

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  const getMobileLinkClasses = (path) => {
    const baseClasses =
      "block px-3 py-3 text-base font-medium transition-colors duration-200 rounded-md";
    const activeClasses = "text-primary bg-gray-50";
    const inactiveClasses = "text-gray-700 hover:text-primary hover:bg-gray-50";

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8 space-x-reverse">
            <Link to="/" className={getLinkClasses("/")}>
              الرئيسية
            </Link>

            {/* Class-related links - accessible to everyone */}
            <Link to="/levels" className={getLinkClasses("/levels")}>
              المستويات
            </Link>
            <Link to="/classes" className={getLinkClasses("/classes")}>
              الفصول
            </Link>

            <>
              <Link to="/users" className={getLinkClasses("/users")}>
                المستخدمين
              </Link>

              <Link to="/contact" className={getLinkClasses("/contact")}>
                تواصل معنا
              </Link>
            </>
          </div>

          {/* Desktop Auth Buttons */}
          {isAuthenticated() ? (
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex flex-col text-center leading-tight">
                <span className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                  {user?.name || "المستخدم"}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[160px]">
                  {user?.role || "student"}
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
            <div className="hidden lg:flex items-center space-x-4 space-x-reverse">
              <Link
                to="/signup"
                className="text-gray-700 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200"
              >
                إنشاء حساب
              </Link>
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200"
              >
                تسجيل الدخول
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary focus:outline-none focus:text-primary p-2"
              aria-label="Toggle menu"
            >
              <svg
                className={`h-6 w-6 transition-transform duration-200 ${
                  isMenuOpen ? "rotate-90" : ""
                }`}
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

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "max-h-96 opacity-100 pb-6"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="pt-4 pb-2 space-y-1">
            {/* Mobile Navigation Links */}
            <Link
              to="/"
              className={getMobileLinkClasses("/")}
              onClick={toggleMenu}
            >
              الرئيسية
            </Link>

            {/* Class-related links - accessible to everyone */}
            <Link
              to="/levels"
              className={getMobileLinkClasses("/levels")}
              onClick={toggleMenu}
            >
              المستويات
            </Link>
            <Link
              to="/classes"
              className={getMobileLinkClasses("/classes")}
              onClick={toggleMenu}
            >
              الفصول
            </Link>

            <>
              <Link
                to="/users"
                className={getMobileLinkClasses("/users")}
                onClick={toggleMenu}
              >
                المستخدمين
              </Link>
            </>
            <Link
              to="/contact"
              className={getMobileLinkClasses("/contact")}
              onClick={toggleMenu}
            >
              تواصل معنا
            </Link>
            {/* Mobile Auth Section */}
            {isAuthenticated() ? (
              <div className="pt-4 space-y-3 px-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    image={user?.image}
                    name={user?.name}
                    variant="compact"
                    size="md"
                  />
                  <div className="flex flex-col text-center leading-tight">
                    <span className="text-sm font-semibold text-gray-900">
                      {user?.name || "المستخدم"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user?.role || "student"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-4 space-y-3">
                <Link
                  to="/signup"
                  className="block w-full text-right text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-3 text-base font-medium transition-colors duration-200 rounded-md"
                  onClick={toggleMenu}
                >
                  إنشاء حساب
                </Link>
                <Link
                  to="/login"
                  className="block w-full text-right text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-3 text-base font-medium transition-colors duration-200 rounded-md"
                  onClick={toggleMenu}
                >
                  تسجيل الدخول
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
