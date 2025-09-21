import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as ExcelJS from "exceljs";
import {
  isAuthenticated,
  isAdmin,
  getAuthHeaders,
  notifyForbidden,
} from "../util/auth";

const BulkTeacherUpload = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    // Check authentication and admin role
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    if (!isAdmin()) {
      notifyForbidden();
      navigate("/");
      return;
    }
  }, [navigate]);

  const downloadTemplate = () => {
    // Create Excel template (Arabic headers) and set phone column as text
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("قالب المعلمين");

    // Add headers (Arabic)
    const headers = ["الاسم", "الهاتف", "تاريخ الميلاد", "الجنس", "الكود", "التخصص"];

    worksheet.addRow(headers);

    // Ensure all columns have width; set phone column to text format to preserve leading zeros
    worksheet.columns.forEach((column, idx) => {
      column.width = 18;
      column.numFmt = "General";
    });
    
    // Explicitly set phone column (2) format to text
    const phoneCol = worksheet.getColumn(2);
    phoneCol.numFmt = "@";
    phoneCol.alignment = { horizontal: "left" };

    // Add data validation for gender column (column D)
    worksheet.dataValidations.add("D2:D1000", {
      type: "list",
      allowBlank: false,
      formulae: ['"male,female"'],
      promptTitle: "اختر الجنس",
      prompt: "اختر إما male أو female",
      errorTitle: "قيمة غير صحيحة",
      error: "يجب اختيار male أو female فقط",
    });

    // Add data validation for subject column (column F)
    worksheet.dataValidations.add("F2:F1000", {
      type: "list",
      allowBlank: false,
      formulae: ['"taks,al7an,coptic"'],
      promptTitle: "اختر التخصص",
      prompt: "اختر إما taks أو al7an أو coptic",
      errorTitle: "قيمة غير صحيحة",
      error: "يجب اختيار taks أو al7an أو coptic فقط",
    });

    // Style the headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Generate and download the file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "teachers_template.xlsx");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      setError("يرجى اختيار ملف CSV أو Excel صحيح (.csv, .xlsx, .xls)");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setUploadResult(null);
    setTimeRemaining(null);
    setStartTime(Date.now());

    // Simulate progress during upload with time tracking
    const progressInterval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress < 85) {
          // More gradual progress increments for smoother time estimation
          const increment = Math.random() * 5 + 2; // 2-7% increments
          const newProgress = Math.min(prevProgress + increment, 85);
          const elapsedTime = (Date.now() - startTime) / 1000;
          const remaining = calculateTimeRemaining(newProgress, elapsedTime);
          setTimeRemaining(remaining);
          return newProgress;
        }
        return prevProgress;
      });
    }, 500); // Slower interval for more stable estimates

    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers = {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/bulk-import-teachers`,
        formData,
        { 
          headers,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // Use the higher of simulated progress or actual upload progress, but cap at 85%
            setUploadProgress((prevProgress) => {
              const actualProgress = Math.min(percentCompleted, 85);
              const newProgress = Math.max(prevProgress, actualProgress);
              
              // Calculate time remaining based on actual upload progress
              const elapsedTime = (Date.now() - startTime) / 1000;
              const remaining = calculateTimeRemaining(newProgress, elapsedTime);
              setTimeRemaining(remaining);
              
              return newProgress;
            });
          }
        }
      );

      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Small delay to show 100% before showing results
      setTimeout(() => {
        setUploadResult(response.data);
        setUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error uploading file:", error);

      if (error.response?.status === 401) {
        // Unauthorized - redirect to login
        navigate("/login");
        return;
      }

      if (error.response?.status === 403) {
        // Forbidden - not admin
        setError("ليس لديك صلاحية لرفع المعلمين");
        return;
      }

      setError(error.response?.data?.error || "حدث خطأ أثناء رفع الملف");
      setUploading(false);
      setUploadProgress(0);
      setTimeRemaining(null);
    }
  };

  const formatTimeRemaining = (seconds) => {
    const roundedSeconds = Math.round(seconds);
    
    if (roundedSeconds < 60) {
      return `${roundedSeconds} ثانية`;
    } else if (roundedSeconds < 3600) {
      const minutes = Math.round(roundedSeconds / 60);
      return `${minutes} دقيقة`;
    } else {
      const hours = Math.round(roundedSeconds / 3600);
      return `${hours} ساعة`;
    }
  };

  const calculateTimeRemaining = (progress, elapsedTime) => {
    if (progress <= 0 || elapsedTime < 2) return null;
    
    // Only calculate after we have meaningful progress (at least 5%)
    if (progress < 5) return null;
    
    const estimatedTotalTime = (elapsedTime / progress) * 100;
    const remainingTime = estimatedTotalTime - elapsedTime;
    
    // Cap the maximum estimated time to 10 minutes (600 seconds)
    const maxReasonableTime = 600;
    const cappedRemainingTime = Math.min(remainingTime, maxReasonableTime);
    
    // Don't show time if it's less than 5 seconds
    return cappedRemainingTime > 5 ? cappedRemainingTime : null;
  };

  const getSubjectName = (subject) => {
    switch (subject) {
      case "taks":
        return "التكس";
      case "al7an":
        return "الحان";
      case "coptic":
        return "قبطي";
      default:
        return subject;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                إضافة مجموعة معلمين
              </h1>
              <p className="text-gray-600">
                رفع ملف CSV أو Excel يحتوي على بيانات المعلمين
              </p>
            </div>
            <button
              onClick={() => navigate("/users")}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              العودة للمستخدمين
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            تعليمات الاستخدام
          </h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>قم بتحميل قالب Excel أدناه</li>
            <li>املأ القالب ببيانات المعلمين مع مراعاة التنسيق التالي:</li>
            <div className="mr-6 mt-2 space-y-1 text-sm">
              <div>
                <strong>الاسم:</strong> النص العربي أو الإنجليزي (مثال: أحمد محمد)
              </div>
              <div>
                <strong>الهاتف:</strong> أرقام فقط، 11 رقم (مثال: 05012345678)
              </div>
              <div>
                <strong>تاريخ الميلاد:</strong> mm/dd/yyyy (مثال: 01/15/1985)
              </div>
              <div>
                <strong>الجنس:</strong> male أو female
              </div>
              <div>
                <strong>الكود:</strong> كود فريد للمعلم (مثال: T001)
              </div>
              <div>
                <strong>التخصص:</strong> taks أو al7an أو coptic
              </div>
            </div>
            <li>سيتم تعيين الدور تلقائياً كمعلم</li>
            <li>قم برفع الملف المملوء</li>
            <li>سيتم إنشاء المعلمين في قاعدة البيانات</li>
          </ol>
        </div>

        {/* Download Template */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            تحميل قالب Excel
          </h3>
          <p className="text-gray-600 mb-4">
            قم بتحميل القالب واملأه ببيانات المعلمين. القالب باللغة العربية، وتم
            ضبط عمود الهاتف كـ نص للحفاظ على الصفر في بداية الرقم. الدور يتم
            تعيينه تلقائياً كمعلم.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>ملاحظة مهمة:</strong> تأكد من أن تاريخ الميلاد بالتنسيق
              الصحيح mm/dd/yyyy (مثال: 01/15/1985)
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>ميزة جديدة:</strong> القالب يحتوي على قوائم منسدلة للجنس والتخصص،
              وعمود الهاتف مضبوط كنصي للحفاظ على الأصفار البادئة
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            تحميل قالب Excel
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            رفع ملف Excel
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
              disabled={uploading}
            />
            <label
              htmlFor="excel-upload"
              className={`cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition-colors duration-200`}
            >
              {uploading ? "جاري الرفع..." : "اختر ملف CSV/Excel"}
            </label>
            <p className="mt-2 text-sm text-gray-500">
              {uploading ? "يرجى الانتظار..." : "أو اسحب وأفلت الملف هنا"}
            </p>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  جاري معالجة الملف...
                </span>
                <div className="flex items-center gap-3">
                  {timeRemaining && timeRemaining > 0 && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      متبقي: {formatTimeRemaining(timeRemaining)}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {uploadProgress < 30 && "جاري رفع الملف..."}
                {uploadProgress >= 30 && uploadProgress < 70 && "جاري معالجة البيانات..."}
                {uploadProgress >= 70 && uploadProgress < 100 && "جاري إنهاء المعالجة..."}
                {uploadProgress >= 100 && "تم بنجاح!"}
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              تقرير رفع الملف
            </h3>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.summary?.totalProcessed || 0}
                </div>
                <div className="text-sm text-green-700">إجمالي المعلمين</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadResult.summary?.successful || 0}
                </div>
                <div className="text-sm text-blue-700">تم إضافتهم</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {uploadResult.summary?.skipped || 0}
                </div>
                <div className="text-sm text-yellow-700">تم تخطيهم</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.summary?.failed || 0}
                </div>
                <div className="text-sm text-red-700">فشل في الإضافة</div>
              </div>
            </div>

            {/* Successfully Created Teachers */}
            {uploadResult.successful && uploadResult.successful.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                    ✓
                  </span>
                  المعلمون المضافون بنجاح ({uploadResult.successful.length})
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-green-200">
                          <th className="text-right py-2 px-3 font-medium text-green-700">
                            الصف
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-green-700">
                            الاسم
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-green-700">
                            الهاتف
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-green-700">
                            الكود
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-green-700">
                            التخصص
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-green-700">
                            المعرف
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-200">
                        {uploadResult.successful.map((item, index) => (
                          <tr key={index} className="hover:bg-green-100">
                            <td className="py-2 px-3 text-green-900">
                              {item.row}
                            </td>
                            <td className="py-2 px-3 text-green-900">
                              {item.user?.name || ""}
                            </td>
                            <td className="py-2 px-3 text-green-900">
                              {item.user?.phone || ""}
                            </td>
                            <td className="py-2 px-3 text-green-900">
                              {item.user?.code || ""}
                            </td>
                            <td className="py-2 px-3 text-green-900">
                              {getSubjectName(item.user?.subject || "")}
                            </td>
                            <td className="py-2 px-3 text-green-900 font-mono text-xs">
                              {item.user?.id || ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Teachers (Skipped) */}
            {uploadResult.existingUsers && uploadResult.existingUsers.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                    ⚠
                  </span>
                  المعلمون الموجودون مسبقاً ({uploadResult.existingUsers.length})
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-yellow-200">
                          <th className="text-right py-2 px-3 font-medium text-yellow-700">
                            الصف
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-yellow-700">
                            البيانات الجديدة
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-yellow-700">
                            المعلم الموجود
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-yellow-700">
                            نوع التعارض
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-200">
                        {uploadResult.existingUsers.map((item, index) => (
                          <tr key={index} className="hover:bg-yellow-100">
                            <td className="py-2 px-3 text-yellow-900">
                              {item.row}
                            </td>
                            <td className="py-2 px-3 text-yellow-900">
                              <div className="text-xs">
                                <div>الاسم: {item.newData?.name || ""}</div>
                                <div>الهاتف: {item.newData?.phone || ""}</div>
                                <div>الكود: {item.newData?.code || ""}</div>
                                <div>التخصص: {getSubjectName(item.newData?.subject || "")}</div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-yellow-900">
                              <div className="text-xs">
                                <div>الاسم: {item.existingUser.name}</div>
                                <div>الهاتف: {item.existingUser.phone}</div>
                                <div>الكود: {item.existingUser.code}</div>
                                <div>التخصص: {getSubjectName(item.existingUser.subject || "")}</div>
                                <div>المعرف: {item.existingUser.id}</div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-yellow-900">
                              <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                                الكود
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {uploadResult.failed && uploadResult.failed.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                    ✗
                  </span>
                  الأخطاء ({uploadResult.failed.length})
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="space-y-3">
                    {uploadResult.failed.map((error, index) => (
                      <div
                        key={index}
                        className="border-b border-red-200 pb-3 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded mr-2">
                                الصف {error.row}
                              </span>
                              <span className="text-red-800 font-medium">
                                {error.field === "required_fields" && "الحقول المطلوبة فارغة"}
                                {error.field === "gender" && "خطأ في الجنس"}
                                {error.field === "subject" && "خطأ في التخصص"}
                                {error.field === "phone" && "خطأ في رقم الهاتف"}
                                {error.field === "birthday" && "خطأ في تاريخ الميلاد"}
                                {error.field === "system_error" && "خطأ في النظام"}
                                {!["required_fields", "gender", "subject", "phone", "birthday", "system_error"].includes(error.field) && error.field}
                              </span>
                            </div>
                            <p className="text-red-700 text-sm mb-2">
                              {error.message}
                            </p>
                            {error.data && Object.keys(error.data).length > 0 && (
                              <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                                <strong>البيانات:</strong>{" "}
                                {JSON.stringify(error.data, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {uploadResult.summary?.successful > 0 && (
                  <span className="text-green-600">
                    ✓ تم إضافة {uploadResult.summary.successful} معلم بنجاح
                  </span>
                )}
                {uploadResult.summary?.skipped > 0 && (
                  <span className="text-yellow-600 mr-4">
                    ⚠ تم تخطي {uploadResult.summary.skipped} معلم
                  </span>
                )}
                {uploadResult.summary?.failed > 0 && (
                  <span className="text-red-600 mr-4">
                    ✗ فشل في إضافة {uploadResult.summary.failed} معلم
                  </span>
                )}
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={() => {
                    setUploadResult(null);
                    setError("");
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  رفع ملف آخر
                </button>
                <button
                  onClick={() => navigate("/users")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  العودة للمستخدمين
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Excel Format Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            تنسيق ملف Excel
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-2 px-3 font-medium text-gray-700">
                    الحقل
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">
                    الوصف
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">
                    مطلوب
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">
                    مثال
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 px-3 text-gray-900">name</td>
                  <td className="py-2 px-3 text-gray-600">اسم المعلم</td>
                  <td className="py-2 px-3 text-gray-600">نعم</td>
                  <td className="py-2 px-3 text-gray-600">أحمد محمد</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-900">phone</td>
                  <td className="py-2 px-3 text-gray-600">رقم الهاتف</td>
                  <td className="py-2 px-3 text-gray-600">نعم</td>
                  <td className="py-2 px-3 text-gray-600">05012345678</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-900">birthday</td>
                  <td className="py-2 px-3 text-gray-600">تاريخ الميلاد</td>
                  <td className="py-2 px-3 text-gray-600">نعم</td>
                  <td className="py-2 px-3 text-gray-600">01/15/1985</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-900">gender</td>
                  <td className="py-2 px-3 text-gray-600">الجنس</td>
                  <td className="py-2 px-3 text-gray-600">نعم</td>
                  <td className="py-2 px-3 text-gray-600">male/female</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-900">code</td>
                  <td className="py-2 px-3 text-gray-600">الكود</td>
                  <td className="py-2 px-3 text-gray-600">نعم</td>
                  <td className="py-2 px-3 text-gray-600">T001</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-900">subject</td>
                  <td className="py-2 px-3 text-gray-600">التخصص</td>
                  <td className="py-2 px-3 text-gray-600">نعم</td>
                  <td className="py-2 px-3 text-gray-600">taks/al7an/coptic</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkTeacherUpload;
