import { useEffect, useState } from "react";
import Modal from "src/component/Modal";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import UpdateLeaveReq from "./EditLeaveRequestForm";
import LeaveTypes from "./LeaveTypes";
import LeaveRequestList from "./LeaveRequestList";
import PageHeader from "src/component/ui/PageHeader";

const Leave = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState("leavereq");
  const [roleAccess, setRoleAccess] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);

  const accesstoken = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const token = accesstoken;

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

  useEffect(() => {
    if (hydrated && token && userRole) {
      fetch(`${BASE_URL}/get-roleaccessdetail/${userRole}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status) setRoleAccess(data.access);
        })
        .catch(() => {});
    }
  }, [hydrated, token, userRole]);

  const tabs = roleAccess?.leaveapproved?.all
    ? [
        { id: "leavereq", label: "Leave Requests" },
        { id: "leavetype", label: "Leave Categories & Policies" },
      ]
    : [{ id: "leavereq", label: "Leave Requests" }];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Apply for leaves, track approval workflows, and manage organizational leave policies."
      />

      {/* Tabs */}
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
        {activeTab === "leavereq" && <LeaveRequestList />}
        {activeTab === "leavetype" && <LeaveTypes />}
      </div>

      <Modal
        isVisible={showEditModal}
        maxWidth="2xl"
        onClose={() => setShowEditModal(false)}
        title="Update Leave Request"
        closeOnOutsideClick={false}
      >
        <UpdateLeaveReq onCancel={() => setShowEditModal(false)} />
      </Modal>
    </div>
  );
};

export default Leave;
