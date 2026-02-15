import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import axios from "axios";
import {
  isAuthenticated,
  isAdmin,
  getAuthHeaders,
  notifyForbidden,
} from "../util/auth";

const ContactMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBase}/contact/messages`, {
        headers: getAuthHeaders(),
      });
      setMessages(res.data.messages || []);
      setError("");
    } catch (e) {
      console.error(e);
      setError("حدث خطأ أثناء جلب الرسائل");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    if (!isAdmin()) {
      notifyForbidden();
      navigate("/");
      return;
    }
    fetchMessages();
  }, [navigate]);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(
        `${apiBase}/contact/messages/${id}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذه الرسالة؟")) return;
    try {
      await axios.delete(`${apiBase}/contact/messages/${id}`, {
        headers: getAuthHeaders(),
      });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      console.error(e);
      setError("حدث خطأ أثناء الحذف");
    }
  };

  const filteredMessages = messages.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const subject = (m.subject || "").toLowerCase();
    const message = (m.message || "").toLowerCase();
    const senderName = (m.sender?.name || "").toLowerCase();
    return subject.includes(q) || message.includes(q) || senderName.includes(q);
  });

  const selected = messages.find((m) => m.id === selectedId);
  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">رسائل تواصل معنا</h1>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            الرئيسية
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message list */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الرسائل..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  لا توجد رسائل
                </div>
              ) : (
                filteredMessages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id);
                      if (!m.is_read) handleMarkAsRead(m.id);
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedId === m.id ? "bg-primary/5 border-r-4 border-r-primary" : ""
                    } ${!m.is_read ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {m.subject || "بدون موضوع"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(m.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message detail: subject, message, profile link */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <span className="text-4xl mb-2">📩</span>
                <p>اختر رسالة لعرضها</p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selected.subject}
                  </h2>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    حذف
                  </button>
                </div>

                <div className="mb-6">
                  <span className="text-xs font-medium text-gray-500">الرسالة</span>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg text-gray-800 whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500">المرسل</span>
                  <div className="mt-2 flex items-center gap-3">
                    <Link to={`/users/${selected.user_id}`} className="flex items-center gap-3 hover:opacity-80">
                      <Avatar
                        image={selected.sender?.image}
                        name={selected.sender?.name}
                        size="md"
                        showMenu={false}
                        variant="compact"
                      />
                      <span className="font-medium text-gray-900">
                        {selected.sender?.name || "—"}
                      </span>
                    </Link>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactMessages;
