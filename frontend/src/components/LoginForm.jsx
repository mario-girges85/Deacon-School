import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isAuthenticated } from "../util/auth";

const LoginForm = ({ isCompact = false, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    phoneOrCode: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.phoneOrCode.trim()) {
      newErrors.phoneOrCode = " رقم الهاتف أو الكود مطلوب";
    }
    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/users/login`;

        // Prepare login data
        const loginData = {
          phoneOrCode: formData.phoneOrCode,
          password: formData.password,
        };

        // Make API request
        const response = await axios.post(apiUrl, loginData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        localStorage.setItem("token", response.data.token);
        const user = response.data.user || {};
        // Persist class_id and level_id explicitly
        localStorage.setItem("user", JSON.stringify(user));
        if (user.class_id != null)
          localStorage.setItem("class_id", String(user.class_id));
        if (user.level_id != null)
          localStorage.setItem("level_id", String(user.level_id));
        try {
          window.dispatchEvent(new Event("user:updated"));
        } catch {}

        // Handle successful response
        console.log("Login successful:", response.data);
        alert("تم تسجيل الدخول بنجاح!");

        // Call the success callback if provided
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          navigate("/");
        }

        // Reset form
        setFormData({
          phoneOrCode: "",
          password: "",
        });
        setErrors({});
        setIsLoading(false);
      } catch (error) {
        console.error("Login error:", error);

        // Handle different types of errors
        if (error.response) {
          // Server responded with error status
          const errorMessage =
            error.response.data?.message || "حدث خطأ أثناء تسجيل الدخول";
          alert(`خطأ: ${errorMessage}`);
        } else if (error.request) {
          // Request was made but no response received
          alert(
            "خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى."
          );
        } else {
          // Something else happened
          alert("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
        }
        setIsLoading(false);
      }
    }
  };

  if (isCompact) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto border border-gray-100">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-primary mb-3">تسجيل الدخول</h3>
          <p className="text-gray-600">أدخل بياناتك للوصول إلى حسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone or ID Field */}
          <div>
            <label
              htmlFor="phoneOrCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              رقم الهاتف أو الكود *
            </label>
            <input
              type="text"
              id="phoneOrCode"
              name="phoneOrCode"
              value={formData.phoneOrCode}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 text-right ${
                errors.phoneOrCode ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="أدخل رقم الهاتف أو الكود"
              dir="rtl"
            />
            {errors.phoneOrCode && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneOrCode}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              كلمة المرور *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 text-right ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="أدخل كلمة المرور"
              dir="rtl"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Full login form (original design)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-2">تسجيل الدخول</h2>
          <p className="text-gray-600 text-sm">أدخل بياناتك للوصول إلى حسابك</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone or ID Field */}
            <div>
              <label
                htmlFor="phoneOrCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                رقم الهاتف أو الكود *
              </label>
              <input
                type="text"
                id="phoneOrCode"
                name="phoneOrCode"
                value={formData.phoneOrCode}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 text-right ${
                  errors.phoneOrCode ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="أدخل رقم الهاتف أو الكود"
                dir="rtl"
              />
              {errors.phoneOrCode && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phoneOrCode}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                كلمة المرور *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 text-right ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="أدخل كلمة المرور"
                dir="rtl"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-left">
              <a href="#" className="text-sm text-primary hover:underline">
                نسيت كلمة المرور؟
              </a>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">أو</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
