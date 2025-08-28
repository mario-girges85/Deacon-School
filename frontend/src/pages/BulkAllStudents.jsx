import React, { useEffect, useState } from "react";
import axios from "axios";
import * as ExcelJS from "exceljs";

const BulkAllStudents = () => {
  const [classes, setClasses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/classes`
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
  }, []);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError("يرجى اختيار ملف CSV أو Excel صحيح (.csv, .xlsx, .xls)");
      return;
    }
    setUploading(true);
    setError("");
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // No classId in body here; each row must include الفصل
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/bulk-import`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUploadResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "حدث خطأ أثناء رفع الملف");
    } finally {
      setUploading(false);
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
                            الرمز
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
                                <div>الرمز: {item.newData?.code || ""}</div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-yellow-900">
                              <div className="text-xs">
                                <div>الاسم: {item.existingUser?.name}</div>
                                <div>الهاتف: {item.existingUser?.phone}</div>
                                <div>الرمز: {item.existingUser?.code}</div>
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
                                  : "الرمز"}
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
