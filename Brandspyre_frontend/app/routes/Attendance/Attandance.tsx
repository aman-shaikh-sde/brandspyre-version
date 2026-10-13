import { useEffect, useState } from "react";
import Modal from "src/component/Modal";
import UpdateAttendanceForm from "./UpdateAttendance";
import AttendanceReport from "./AttendnceReport";
import AttendanceLogList from "./AttendanceLogList";
import AttendanceSheet from "./AttendanceSheet";
import AttendanceReportSheet from "./AttendanceReportSheet";
import { useAuthStore } from "src/stores/authStore";
import PageHeader from "src/component/ui/PageHeader";

const Attandance = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("employeeattandance");
  const [hydrated, setHydrated] = useState(false);

  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (useAuthStore.persist.hasHydrated()) {
        setHydrated(true);
      } else {
        const unsub = useAuthStore.persist.onHydrate(() => setHydrated(true));
        return () => unsub();
      }
    }
  }, []);

  const tabs =
    role === "superadmin" || role === "hr" || role === "admin"
      ? [
          { id: "employeeattandance", label: "Attendance Log" },
          { id: "createattendance", label: "Attendance Entry" },
          { id: "attendancereport", label: "Report Analysis" },
          { id: "attendancesheet", label: "Detailed Sheet" },
        ]
      : [{ id: "employeeattandance", label: "Attendance Log" }];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Time Logs"
        description="Monitor daily check-ins, check-outs, leave tracking, and attendance reports."
      />

      {/* Modern Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-slate-100 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === "employeeattandance" && <AttendanceLogList />}
        {activeTab === "attendancesheet" && <AttendanceReportSheet />}
        {activeTab === "createattendance" && <AttendanceSheet />}
        {activeTab === "attendancereport" && <AttendanceReport />}
      </div>

      <Modal
        isVisible={showModal}
        maxWidth="2xl"
        onClose={() => setShowModal(false)}
        title="Attendance Approval"
        closeOnOutsideClick={false}
      >
        <UpdateAttendanceForm />
      </Modal>
    </div>
  );
};

export default Attandance;
