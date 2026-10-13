import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import DataTable from "src/component/DataTable";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import { Trash2 } from "lucide-react";
import { notify } from "~/services/notificationService";

interface Department {
  id: number;
  branchcode: string;
  name: string;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filtered, setFiltered] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/getDepartments`);
      if (res.data?.success || res.data?.status) {
        const data = res.data.data || res.data.departments || [];
        setDepartments(data);
        setFiltered(data);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await apiClient.delete(`/deleteDepartment/${id}`);
      notify.success("Department deleted successfully!");
      const updated = departments.filter((dep) => dep.id !== id);
      setDepartments(updated);
      setFiltered(updated);
    } catch (err) {
      console.error("Error deleting department:", err);
      notify.error("Failed to delete department");
    }
  };

  useEffect(() => {
    let temp = [...departments];
    if (searchName.trim() !== "") {
      temp = temp.filter((dep) => dep.name.toLowerCase().includes(searchName.toLowerCase()));
    }
    if (selectedBranch.trim() !== "") {
      temp = temp.filter((dep) => dep.branchcode.toLowerCase().includes(selectedBranch.toLowerCase()));
    }
    setFiltered(temp);
  }, [searchName, selectedBranch, departments]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const thead = () => [
    { data: "#" },
    { data: "Branch Code" },
    { data: "Department Name" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    return filtered.map((dep, index) => ({
      id: dep.id,
      data: [
        { data: index + 1 },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{dep.branchcode}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{dep.name}</span> },
        {
          data: (
            <div className="flex justify-center">
              <button
                onClick={() => handleDelete(dep.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                title="Delete Department"
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
        title="Department Management"
        description="Configure organizational departments and branch assignments across teams."
      />

      <FilterBar
        searchQuery={searchName}
        onSearchChange={(val) => setSearchName(val)}
        searchPlaceholder="Search department name..."
        filters={[]}
        onClearAll={() => {
          setSearchName("");
          setSelectedBranch("");
        }}
      />

      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No department records found"
        enableSorting={true}
      />
    </div>
  );
}
