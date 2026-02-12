import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as ExcelJS from "exceljs";
import { isAuthenticated, isAdmin, getAuthHeaders } from "../util/auth";

const BulkAllStudents = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
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
      navigate("/");
      return;
    }

    const fetchClasses = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/classes`
        );
        const all = res.data.classes || [];
        // Keep only classes that are related to a level
        const withLevel = all.filter((c) => !!c.level);
        setClasses(withLevel);
      } catch (e) {
        console.error("Failed to load classes", e);
      }
    };
    fetchClasses();
  }, [navigate]);

  const downloadTemplate = () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("قالب الطلاب لجميع الفصول");
    const headers = [
      "الاسم",
      "الهاتف",
      "تاريخ الميلاد",
      "الجنس",
      "الكود",
      "الفصل",
    ];
    ws.addRow(headers);
    ws.columns.forEach((c, idx) => {
      c.width = 20;
      c.numFmt = "General";
    });
    const phoneCol = ws.getColumn(2);
    phoneCol.numFmt = "@";
    phoneCol.alignment = { horizontal: "left" };

    // Gender validation D2:D1000
    ws.dataValidations.add("D2:D1000", {
      type: "list",
      allowBlank: false,
      formulae: ['"male,female"'],
      promptTitle: "اختر الجنس",
      prompt: "male أو female",
      errorTitle: "قيمة غير صحيحة",
      error: "يجب اختيار male أو female فقط",
    });

    // Class validation using hidden data sheet to avoid Excel 255-char limit
    const dataSheet = workbook.addWorksheet("Data");
    const classLocations = (classes || [])
      .filter((c) => !!c.level)
      .map((c) => c.location || "");
    if (classLocations.length) {
      // Write class locations in column A
      classLocations.forEach((loc, idx) => {
        dataSheet.getCell(idx + 1, 1).value = loc;
      });
      // Hide data sheet
      dataSheet.state = "veryHidden";

      // Set validation to the range in data sheet
      const lastRow = classLocations.length;
      const range = `Data!$A$1:$A$${lastRow}`;
      ws.dataValidations.add("F2:F1000", {
        type: "list",
        allowBlank: false,
        formulae: [`=${range}`],
        promptTitle: "اختر الفصل",
        prompt: "اختر موقع الفصل من القائمة",
        errorTitle: "قيمة غير صحيحة",
        error: "يرجى اختيار فصل من القائمة",
      });
    }

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `students_template_all.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
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
      const fd = new FormData();
      fd.append("file", file);
      // No classId in body here; each row must include الفصل
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/users/bulk-import`,
        fd,
        { 
          headers: getAuthHeaders(),
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
        setUploadResult(res.data);
        setUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (err) {
      clearInterval(progressInterval);
      console.error("Error uploading file:", err);

      if (err.response?.status === 401) {
        // Unauthorized - redirect to login
        navigate("/login");
        return;
      }

      if (err.response?.status === 403) {
        // Forbidden - not admin
        setError("ليس لديك صلاحية لرفع الطلاب");
        return;
      }

      setError(err.response?.data?.error || "حدث خطأ أثناء رفع الملف");
      setUploading(false);
      setUploadProgress(0);
      setTimeRemaining(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              رفع طلاب لجميع الفصول
            </h1>
            <p className="text-gray-600">
              استخدم هذا القالب لتوزيع الطلاب على عدة فصول. يجب تعبئة عمود
              الفصل.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            تحميل القالب
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            رفع ملف CSV/Excel
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload-all"
              disabled={uploading}
            />
            <label
              htmlFor="excel-upload-all"
              className={`cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition-colors duration-200`}
            >
              {uploading ? "جاري الرفع..." : "اختر ملف CSV/Excel"}
            </label>
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

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            تعليمات الاستخدام
          </h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>قم بتحميل القالب العام من زر "تحميل القالب".</li>
            <li>
              املأ الأعمدة: الاسم، الهاتف، تاريخ الميلاد، الجنس، الكود، الفصل.
            </li>
            <li>الهاتف نصي للحفاظ على الصفر البادئ، ويجب أن يكون 11 رقمًا.</li>
            <li>
              الفصل يجب اختياره من القائمة المنسدلة (الفصول المرتبطة بمستويات
              فقط).
            </li>
            <li>الجنس يكون male أو female فقط.</li>
            <li>احفظ الملف ثم ارفعه لرؤية تقرير النتائج.</li>
          </ol>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {uploadResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              تقرير رفع الملف
            </h3>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadResult.summary?.totalProcessed || 0}
                </div>
                <div className="text-sm text-blue-700">إجمالي الصفوف</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.summary?.successful || 0}
                </div>
                <div className="text-sm text-green-700">تمت الإضافة</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {uploadResult.summary?.skipped || 0}
                </div>
                <div className="text-sm text-yellow-700">
                  تم تخطيهم (موجود مسبقًا)
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.summary?.failed || 0}
                </div>
                <div className="text-sm text-red-700">فشل</div>
              </div>
            </div>

            {/* Successful rows */}
            {(uploadResult.successful || []).length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-green-800 mb-4">
                  الطلاب المضافون بنجاح ({uploadResult.successful.length})
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

            {/* Existing (skipped) */}
            {(uploadResult.existing || uploadResult.existingUsers || [])
              .length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-yellow-800 mb-4">
                  المستخدمون الموجودون مسبقًا (
                  {(uploadResult.existing || uploadResult.existingUsers).length}
                  )
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
                            المستخدم الموجود
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-yellow-700">
                            نوع التعارض
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-200">
                        {(
                          uploadResult.existing || uploadResult.existingUsers
                        ).map((item, index) => (
                          <tr key={index} className="hover:bg-yellow-100">
                            <td className="py-2 px-3 text-yellow-900">
                              {item.row}
                            </td>
                            <td className="py-2 px-3 text-yellow-900">
                              <div className="text-xs">
                                <div>الاسم: {item.newData?.name || ""}</div>
                                <div>الهاتف: {item.newData?.phone || ""}</div>
                                <div>الكود: {item.newData?.code || ""}</div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-yellow-900">
                              <div className="text-xs">
                                <div>الاسم: {item.existingUser?.name}</div>
                                <div>الهاتف: {item.existingUser?.phone}</div>
                                <div>الكود: {item.existingUser?.code}</div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-yellow-900">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  item.conflictType === "phone"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {item.conflictType === "phone"
                                  ? "رقم الهاتف"
                                  : "الكود"}
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
            {(uploadResult.failed || uploadResult.errors || []).length > 0 && (
              <div className="mb-2">
                <h4 className="text-lg font-semibold text-red-800 mb-4">
                  الأخطاء ({(uploadResult.failed || uploadResult.errors).length}
                  )
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="space-y-3 text-sm text-red-700">
                    {(uploadResult.failed || uploadResult.errors).map(
                      (err, i) => (
                        <div
                          key={i}
                          className="border-b border-red-200 pb-3 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                              الصف {err.row}
                            </span>
                            <span>{err.field || "خطأ"}</span>
                          </div>
                          <div className="mt-1">{err.message}</div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkAllStudents;
