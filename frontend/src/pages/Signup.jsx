import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "../util/auth";

const Signup = () => {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    birthday: "",
    gender: "male",
    role: "teacher",
    subject: "",
    level_id: "",
    code: "",
    image: null,
  });

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!isAdmin()) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const loadLevels = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/levels`,
        );
        setLevels(res.data.levels || res.data || []);
      } catch (e) {
        console.error("Failed to load levels", e);
      }
    };
    loadLevels();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0] || null;
      setFormData((prev) => ({ ...prev, [name]: file }));
      if (name === "image") {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(file ? URL.createObjectURL(file) : null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const validate = () => {
    const newErrors = {};
    const { name, phone, password, birthday, gender, code } = formData;
    if (!name.trim()) newErrors.name = "الاسم مطلوب";
    if (!/^\d{11}$/.test(String(phone))) newErrors.phone = "رقم هاتف غير صحيح";
    if (!password) newErrors.password = "كلمة المرور مطلوبة";
    if (!birthday) newErrors.birthday = "تاريخ الميلاد مطلوب";
    if (!gender) newErrors.gender = "النوع مطلوب";
    if (!code) newErrors.code = "الكود مطلوب";
    if (["teacher"].includes(formData.role)) {
      if (!formData.subject) newErrors.subject = "التخصص مطلوب";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/users/register`;
      const data = new FormData();
      const fields = [
        "name",
        "phone",
        "password",
        "birthday",
        "gender",
        "role",
        "subject",
        "code",
      ];
      fields.forEach((f) => {
        if (formData[f] !== undefined && formData[f] !== "") {
          data.append(f, formData[f]);
        }
      });
      if (formData.image) data.append("image", formData.image);

      const res = await axios.post(apiUrl, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("تم إنشاء الحساب بنجاح");
      // If user created is staff, optionally redirect to login
      navigate("/login");
    } catch (error) {
      if (error.response) {
        alert(error.response.data?.message || "فشل إنشاء الحساب");
      } else {
        alert("تعذر الاتصال بالخادم");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-2">إنشاء حساب</h2>
          <p className="text-gray-600 text-sm">للمدراء والخدام والمشرفين</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            encType="multipart/form-data"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-10 h-10 text-gray-400"
                  >
                    <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l1.469 1.469M3.75 6.75h.008v.008H3.75V6.75zm.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    <path
                      fill-rule="evenodd"
                      d="M1.5 6A2.25 2.25 0 013.75 3.75h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zm3 10.5a.75.75 0 00.75.75h12a.75.75 0 00.75-.75v-6.379l-2.47 2.47a3.75 3.75 0 01-5.303 0l-.097-.097a1.25 1.25 0 00-1.768 0L4.5 15.621V16.5z"
                      clip-rule="evenodd"
                    />
                  </svg>
                )}
              </div>
              {/* Subject selector moved below role selector in the form body */}
              <div className="flex items-center gap-3">
                <label
                  htmlFor="image"
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  اختر صورة
                </label>
                {formData.image && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    إزالة الصورة
                  </button>
                )}
              </div>
              <input
                id="image"
                type="file"
                name="image"
                accept=".jpg,.jpeg,.png,.heic"
                onChange={handleChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500">
                PNG, JPG, JPEG, HEIC حتى 5MB
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg text-right ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  dir="rtl"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg text-right ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  dir="rtl"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg text-right ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  dir="rtl"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الميلاد *
                </label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg text-right ${
                    errors.birthday ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.birthday && (
                  <p className="text-red-500 text-sm mt-1">{errors.birthday}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  النوع *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg text-right ${
                    errors.gender ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المستخدم *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg text-right border-gray-300"
                >
                  <option value="admin">مدير</option>
                  <option value="teacher">خادم</option>
                  <option value="supervisor">مشرف</option>
                </select>
              </div>

              {formData.role === "teacher" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التخصص (للخدام)
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg text-right ${
                      errors.subject ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">اختر التخصص</option>
                    <option value="taks">طقس</option>
                    <option value="al7an">ألحان</option>
                    <option value="coptic">قبطي</option>
                  </select>
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subject}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كود المستخدم *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg text-right ${
                    errors.code ? "border-red-500" : "border-gray-300"
                  }`}
                  dir="rtl"
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </div>
            </div>

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
                {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
