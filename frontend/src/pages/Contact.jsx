import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../util/axiosConfig";
import { isAuthenticated } from "../util/auth";

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    try {
      setSending(true);
      const res = await apiClient.post("/contact", formData);
      if (res.data?.success) {
        setSent(true);
        setFormData({ subject: "", message: "" });
      } else {
        alert(res.data?.message || "حدث خطأ أثناء الإرسال");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "تعذر إرسال الرسالة. حاول مرة أخرى.";
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-gray-600 mb-4">يجب تسجيل الدخول لإرسال رسالة</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            تم إرسال رسالتك بنجاح
          </h1>
          <p className="text-gray-600">
            سنتواصل معك في أقرب وقت ممكن.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            إرسال رسالة أخرى
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              تواصل معنا
            </h1>
            <p className="text-gray-600 text-lg">
              تواصل معنا، يسعدنا تلقي رسائلكم
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  الموضوع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
                  placeholder="موضوع الرسالة"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  الرسالة <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 resize-vertical"
                  placeholder="اكتب رسالتك هنا"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {sending ? "جاري الإرسال..." : "إرسال الرسالة"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
