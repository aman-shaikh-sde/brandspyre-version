import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import DataTable from "src/component/DataTable";
import { FileDown, ArrowLeft, Bot, Sparkles } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AIReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.reportData) {
      setReportData(location.state.reportData);
      setReportType(location.state.reportType || "");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [location]);

  const handleBack = () => {
    navigate("/ai-assistant");
  };

  const handleExportExcel = () => {
    if (!reportData?.details) return;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData.details);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${reportType}_report.xlsx`);
  };

  const handleExportPDF = () => {
    if (!reportData?.details) return;

    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text(`${reportType.replace(/_/g, " ").toUpperCase()} Report`, 14, 10);

    if (reportData.details.length > 0) {
      const columns = Object.keys(reportData.details[0]).map((key) => ({
        header: key,
        dataKey: key,
      }));

      autoTable(doc, {
        columns,
        body: reportData.details,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [22, 160, 133], fontSize: 9, halign: "center" },
        theme: "grid",
        tableWidth: "auto",
      });
    }

    doc.save(`${reportType}_report.pdf`);
  };

  const getTableHeaders = () => {
    if (!reportData?.details || reportData.details.length === 0) return [];

    const keys = Object.keys(reportData.details[0]);
    return keys.map((key) => ({ data: key.charAt(0).toUpperCase() + key.slice(1) }));
  };

  const getTableBody = () => {
    if (!reportData?.details) return [];

    return reportData.details.map((item: any, index: number) => ({
      id: index,
      data: Object.values(item).map((value) => ({ data: value })),
    }));
  };

  const getSummaryCards = () => {
    if (!reportData?.summary) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(reportData.summary).map(([key, value]) => (
          <div
            key={key}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {key.replace(/_/g, " ").toUpperCase()}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {value as number}
            </p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading report...</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center font-sans">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
            <Bot className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Feature Preview • Coming Soon</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Autonomous AI Reporting Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Automated executive briefings, milestone risk matrices, and financial yield forecasts generated on-demand by the BrandSpyre Business AI Assistant.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Capability
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                Live PDF & Excel Digests
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Security
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                PBAC Permission Gated
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore AI Assistant Demo</span>
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft size={20} />
          Back to AI Assistant
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {reportType.replace(/_/g, " ").toUpperCase()} Report
        </h1>
      </div>

      {getSummaryCards()}

      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <FileDown size={18} />
          Export Excel
        </button>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <FileDown size={18} />
          Export PDF
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {reportData.details && reportData.details.length > 0 ? (
          <DataTable
            thead={getTableHeaders}
            tbody={getTableBody}
            responsive={true}
            className="min-w-full"
          />
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No detailed data available for this report
          </div>
        )}
      </div>
    </div>
  );
};

export default AIReport;
