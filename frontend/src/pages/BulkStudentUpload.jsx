import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import * as ExcelJS from "exceljs";
import { isAuthenticated, isAdmin, getAuthHeaders, notifyForbidden } from "../util/auth";

const BulkStudentUpload = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [levels, setLevels] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");

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

    if (classId) {
      fetchClassData();
      fetchLevels();
    }
  }, [classId, navigate]);

  const fetchClassData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/classes/${classId}`
      );
      setClassData(response.data.class || response.data);
    } catch (error) {
      console.error("Error fetching class data:", error);
      setError("حدث خطأ أثناء جلب بيانات الفصل");
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/levels`
      );
      setLevels(response.data.levels || response.data);
    } catch (error) {
      console.error("Error fetching levels:", error);
    }
  };

  const downloadTemplate = () => {
    // Create Excel template (Arabic headers) and set phone column as text
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("قالب الطلاب");

    // Add headers (Arabic)
    const headers = ["الاسم", "الهاتف", "تاريخ الميلاد", "الجنس", "الكود"]; // الدور غير مطلوب

    worksheet.addRow(headers);

    // Ensure all columns have width; set phone column to text format to preserve leading zeros
    worksheet.columns.forEach((column, idx) => {
      column.width = 18;
      column.numFmt = "General";
      if (idx === 1) {
        // Column indexes are 1-based in ExcelJS; idx 1 => first column, so phone is idx 2
      }
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

    // No role column; backend defaults to student

    // Style the headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Set column widths (already set above)

    // Generate and download the file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `students_template_${classData?.location || "class"}.xlsx`
      );
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
    setError("");
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classId", classId);

      const headers = {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/bulk-import`,
        formData,
        { headers }
      );

      setUploadResult(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);

      if (error.response?.status === 401) {
        // Unauthorized - redirect to login
        navigate("/login");
        return;
      }

      if (error.response?.status === 403) {
        // Forbidden - not admin
        setError("ليس لديك صلاحية لرفع الطلاب");
        return;
      }

      setError(error.response?.data?.error || "حدث خطأ أثناء رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const getLevelName = (level) => {
    switch (level) {
      case 0:
        return "المستوى التمهيدي";
      case 1:
        return "المستوى الأول";
      case 2:
        return "المستوى الثاني";
      case 3:
        return "المستوى الثالث";
      default:
        return `المستوى ${level}`;
    }
  };

  const getStageName = (stage, level) => {
    switch (stage) {
      case 1:
        return "المرحلة الأولى";
      case 2:
        return "المرحلة الثانية";
      case 3:
        return level === 0 ? "مرحلة غير صحيحة" : "المرحلة الثالثة";
      default:
        return `المرحلة ${stage}`;
    }
  };

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                إضافة مجموعة طلاب
              </h1>
              <p className="text-gray-600">
                رفع ملف CSV يحتوي على بيانات الطلاب للفصل: {classData.location}
              </p>
            </div>
            <button
              onClick={() => navigate(`/classes/${classId}`)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              العودة لتفاصيل الفصل
            </button>
          </div>
        </div>

        {/* Class Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            معلومات الفصل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">الموقع:</span>
              <span className="font-medium mr-2">{classData.location}</span>
            </div>
            <div>
              <span className="text-gray-600">المستوى:</span>
              <span className="font-medium mr-2">
                {classData.level
                  ? getLevelName(classData.level.level)
                  : "غير محدد"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">المرحلة:</span>
              <span className="font-medium mr-2">
                {classData.level
                  ? getStageName(classData.level.stage, classData.level.level)
                  : "غير محدد"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">معرف الفصل:</span>
              <span className="font-medium mr-2 font-mono text-sm">
                {classId}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            تعليمات الاستخدام
          </h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>قم بتحميل قالب Excel أدناه</li>
            <li>املأ القالب ببيانات الطلاب مع مراعاة التنسيق التالي:</li>
            <div className="mr-6 mt-2 space-y-1 text-sm">
              <div>
                <strong>الاسم:</strong> النص العربي أو الإنجليزي (مثال: أحمد
                محمد)
              </div>
              <div>
                <strong>الهاتف:</strong> أرقام فقط، 10 أرقام على الأقل (مثال:
                0501234567)
              </div>
              <div>
                <strong>تاريخ الميلاد:</strong> mm/dd/yyyy (مثال: 01/15/2005)
              </div>
              <div>
                <strong>الجنس:</strong> male أو female
              </div>
              <div>
                <strong>الكود:</strong> كود فريد للطالب (مثال: ST001)
              </div>
              {/* الدور محذوف من القالب؛ يتم تعيينه تلقائياً كطالب */}
            </div>
            <li>سيتم تعيين المستوى والفصل تلقائياً للطلاب</li>
            <li>قم برفع الملف المملوء</li>
            <li>سيتم إنشاء الطلاب في قاعدة البيانات</li>
          </ol>
        </div>

        {/* Download Template */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            تحميل قالب Excel
          </h3>
          <p className="text-gray-600 mb-4">
            قم بتحميل القالب واملأه ببيانات الطلاب. القالب باللغة العربية، وتم
            ضبط عمود الهاتف كـ نص للحفاظ على الصفر في بداية الرقم. الدور يتم
            تعيينه تلقائياً كطالب.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>ملاحظة مهمة:</strong> تأكد من أن تاريخ الميلاد بالتنسيق
              الصحيح mm/dd/yyyy (مثال: 01/15/2005)
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>ميزة جديدة:</strong> القالب يحتوي على قوائم منسدلة للجنس،
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
                  {uploadResult.summary?.totalProcessed ||
                    uploadResult.totalStudents}
                </div>
                <div className="text-sm text-green-700">إجمالي الطلاب</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadResult.summary?.successful ||
                    uploadResult.successCount}
                </div>
                <div className="text-sm text-blue-700">تم إضافتهم</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {uploadResult.summary?.skipped || uploadResult.skippedCount}
                </div>
                <div className="text-sm text-yellow-700">تم تخطيهم</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.summary?.failed || uploadResult.errorCount}
                </div>
                <div className="text-sm text-red-700">فشل في الإضافة</div>
              </div>
            </div>

            {/* Successfully Created Users */}
            {(uploadResult.successful || uploadResult.createdUsers) &&
              (uploadResult.successful?.length ||
                uploadResult.createdUsers?.length) > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                      ✓
                    </span>
                    الطلاب المضافون بنجاح (
                    {uploadResult.successful?.length ||
                      0 ||
                      uploadResult.createdUsers?.length ||
                      0}
                    )
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
                          {(
                            uploadResult.successful || uploadResult.createdUsers
                          ).map((item, index) => (
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

            {/* Existing Users (Skipped) */}
            {(uploadResult.existingUsers || uploadResult.existing) &&
              (uploadResult.existingUsers?.length ||
                0 ||
                uploadResult.existing?.length ||
                0) > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                      ⚠
                    </span>
                    المستخدمون الموجودون مسبقاً (
                    {uploadResult.existingUsers?.length ||
                      0 ||
                      uploadResult.existing?.length ||
                      0}
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
                            uploadResult.existingUsers || uploadResult.existing
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
                                  <div>الاسم: {item.existingUser.name}</div>
                                  <div>الهاتف: {item.existingUser.phone}</div>
                                  <div>الكود: {item.existingUser.code}</div>
                                  {item.existingUser.class && (
                                    <div>
                                      الفصل: {item.existingUser.class.location}
                                    </div>
                                  )}
                                  <div>المعرف: {item.existingUser.id}</div>
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
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                    ✗
                  </span>
                  الأخطاء ({uploadResult.errors.length})
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="space-y-3">
                    {uploadResult.errors.map((error, index) => (
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
                                {error.field === "required_fields" &&
                                  "الحقول المطلوبة فارغة"}
                                {error.field === "gender" && "خطأ في الجنس"}
                                {error.field === "role" && "خطأ في الدور"}
                                {error.field === "phone" && "خطأ في رقم الهاتف"}
                                {error.field === "birthday" &&
                                  "خطأ في تاريخ الميلاد"}
                                {error.field === "system_error" &&
                                  "خطأ في النظام"}
                                {![
                                  "required_fields",
                                  "gender",
                                  "role",
                                  "phone",
                                  "birthday",
                                  "system_error",
                                ].includes(error.field) && error.field}
                              </span>
                            </div>
                            <p className="text-red-700 text-sm mb-2">
                              {error.message}
                            </p>
                            {error.data &&
                              Object.keys(error.data).length > 0 && (
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
                    ✓ تم إضافة {uploadResult.summary.successful} طالب بنجاح
                  </span>
                )}
                {uploadResult.summary?.skipped > 0 && (
                  <span className="text-yellow-600 mr-4">
                    ⚠ تم تخطي {uploadResult.summary.skipped} طالب
                  </span>
                )}
                {uploadResult.summary?.failed > 0 && (
                  <span className="text-red-600 mr-4">
                    ✗ فشل في إضافة {uploadResult.summary.failed} طالب
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
                  onClick={() => navigate(`/classes/${classId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  العودة لتفاصيل الفصل
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
                  <td className="py-2 px-3 text-gray-600">اسم الطالب</td>
                  <td className="py-2 px-3 text-gray-600">نعم</td>
                  <td className="py-2 px-3 text-gray-600">أحمد محمد</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-900">phone</td>
                  <td className="py-2 px-3 text-gray-600">رقم الهاتف</td>
                  <td className="py-2 px-3 text-gray-600">نعم</td>
                  <td className="py-2 px-3 text-gray-600">0501234567</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-900">birthday</td>
                  <td className="py-2 px-3 text-gray-600">تاريخ الميلاد</td>
                  <td className="py-2 px-3 text-gray-600">نعم</td>
                  <td className="py-2 px-3 text-gray-600">01/15/2005</td>
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
                  <td className="py-2 px-3 text-gray-600">ST001</td>
                </tr>
                {/* لا يوجد عمود للدور */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkStudentUpload;
