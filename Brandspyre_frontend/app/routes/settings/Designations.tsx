import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import DataTable from "src/component/DataTable";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import { Trash2 } from "lucide-react";
import { notify } from "~/services/notificationService";

interface Designation {
  id: number;
  branchcode: string;
  department: string;
  designation: string;
}

export default function Designations() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchDesig, setSearchDesig] = useState("");
  const [searchDept, setSearchDept] = useState("");

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/getDesignations`);
      if (res.data?.success || res.data?.status) {
        setDesignations(res.data.data || res.data.designations || []);
      }
    } catch (err) {
      console.error("Error fetching designations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this designation?")) return;
    try {
      await apiClient.delete(`/deleteDesignation/${id}`);
      notify.success("Designation deleted successfully!");
      setDesignations((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Error deleting designation:", err);
      notify.error("Failed to delete designation");
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  const filtered = designations.filter((d) => {
    const matchesDesig = d.designation.toLowerCase().includes(searchDesig.toLowerCase());
    const matchesDept = searchDept ? d.department.toLowerCase().includes(searchDept.toLowerCase()) : true;
    return matchesDesig && matchesDept;
  });

  const thead = () => [
    { data: "#" },
    { data: "Branch Code" },
    { data: "Department" },
    { data: "Designation" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    return filtered.map((des, index) => ({
      id: des.id,
      data: [
        { data: index + 1 },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{des.branchcode}</span> },
        { data: <CrmBadge label={des.department} variant="blue" /> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{des.designation}</span> },
        {
          data: (
            <div className="flex justify-center">
              <button
                onClick={() => handleDelete(des.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                title="Delete Designation"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Designation Management"
        description="Define staff designation titles and job roles mapped across organizational departments."
      />

      <FilterBar
        searchQuery={searchDesig}
        onSearchChange={(val) => setSearchDesig(val)}
        searchPlaceholder="Search designation title..."
        filters={[]}
        onClearAll={() => {
          setSearchDesig("");
          setSearchDept("");
        }}
      />

      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No designation records found"
        enableSorting={true}
      />
    </div>
  );
}
