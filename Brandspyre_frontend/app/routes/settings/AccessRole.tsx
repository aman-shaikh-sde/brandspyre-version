import { apiClient } from "src/services/apiClient";
import { Edit, Hash, Key, Plus, Trash2, UserCheck, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { notify } from "~/services/notificationService";
import Modal from "src/component/Modal";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import PageHeader from "src/component/ui/PageHeader";
import CrmBadge from "src/component/ui/CrmBadge";

export default function AccessRole() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [role, setRole] = useState<any[]>([]);
  const [currentRole, setCurrentRole] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>(null);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);

  const [formData, setFormData] = useState({
    branchcode: "",
    role: "",
    userId: "",
  });

  const [deleteData, setDeleteData] = useState({
    notes: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.accessToken);
  const branchCodeOption = useBranchStore((state) => state.branchCodeOptions);
  const [roleOptions, setRoleOptions] = useState<any[]>([]);

  const getRole = async () => {
    try {
      const response = await apiClient.get(`/setting/read`);
      setRole(response?.data || []);
    } catch (error) {
      console.error("Error fetching user roles", error);
    }
  };

  useEffect(() => {
    getRole();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBranchChange = async (e: any) => {
    const selectedBranch = e.target.value;
    setFormData((prev) => ({ ...prev, branchcode: selectedBranch, role: "" }));

    if (selectedBranch) {
      try {
        setLoading(true);
        const response = await fetch(`/branch/dropdown?branchcode=${selectedBranch}`);
        const data = await response.json();

        const configured = new Set((role || []).map((r: any) => (r.role || "").toLowerCase().trim()));

        const uniqueRoles = Array.from(
          new Set((data.result || []).map((item: any) => item.role))
        )
          .filter((roleName: any) => !configured.has((roleName || "").toLowerCase().trim()))
          .map((roleName) => ({
            value: roleName,
            label: roleName,
          }));

        setRoleOptions(uniqueRoles);
      } catch (error) {
        console.error("Error fetching roles:", error);
        setRoleOptions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setRoleOptions([]);
    }
  };

  const handleAddRoleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = `/setting/create`;
      const response = await apiClient.post(url, formData);
      if (response.status === 201) {
        setShowAddModal(false);
        notify.success("Access role created successfully!");
        getRole();
        setFormData({ branchcode: "", role: "", userId: "" });
      }
    } catch (error: any) {
      notify.error(error?.response?.data?.error || "Error adding role");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (roleItem: any) => {
    setCurrentRole(roleItem);
    const { _id, id, branch_id, role: rName, create_datetime, last_update_datetime, ...perms } = roleItem;
    setPermissions(perms);
  };

  const handlePermissionChange = (category: string, field: string, value: boolean) => {
    setPermissions((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleUpdatePermissions = async () => {
    if (!currentRole) {
      notify.error("Please select a role first.");
      return;
    }

    try {
      setLoading(true);
      const url = `/setting/edit/${currentRole.id}`;
      const payload = {
        branchcode: currentRole.branchcode.toString(),
        data: permissions,
        userId: formData.userId || "SYSTEM",
      };

      const response = await apiClient.put(url, payload);

      if (response.status === 200) {
        notify.success("Role access permissions updated successfully!");
        getRole();
      }
    } catch (error: any) {
      notify.error(error?.response?.data?.error || "Error updating permissions");
    } finally {
      setLoading(false);
    }
  };

  const renderPermissionCheckboxes = (category: string) => {
    if (!permissions || !permissions[category]) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
        {Object.entries(permissions[category]).map(([key, value]: [string, any]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handlePermissionChange(category, key, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
              {key === "all" ? `Full ${category} Access` : `${key} ${category}`}
            </span>
          </label>
        ))}
      </div>
    );
  };

  const renderPermissionSections = () => {
    if (!permissions) return null;
    const permissionCategories = Object.keys(permissions).filter(
      (key) => !["_id", "id", "branchcode", "role", "create_datetime", "last_update_datetime"].includes(key)
    );

    return permissionCategories.map((category) => (
      <div key={category} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Key className="text-red-700 dark:text-red-400" size={16} />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">{category} Permissions</h4>
        </div>
        {renderPermissionCheckboxes(category)}
      </div>
    ));
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      setLoading(true);
      const url = `/setting/delete/${roleToDelete.id}`;
      await apiClient.delete(url, {
        data: { branchcode: (roleToDelete.branchcode || "").toString(), notes: deleteData.notes },
      });
      notify.success("Role deleted successfully!");
      getRole();
      setShowDeleteModal(false);
      if (currentRole?.id === roleToDelete.id) {
        setCurrentRole(null);
        setPermissions(null);
      }
    } catch (error: any) {
      notify.error(error?.response?.data?.error || "Error deleting role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Access Permissions"
        description="Configure fine-grained module access controls, feature flags, and permission policies for system roles."
        primaryAction={{
          label: "New Role",
          onClick: () => setShowAddModal(true),
          icon: <Plus size={16} />,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Role list */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Configured System Roles</h3>
            <CrmBadge label={`${role.length} Roles`} variant="blue" />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {role.map((rol) => {
              const isSelected = currentRole?.id === rol.id;
              return (
                <div
                  key={rol.id}
                  onClick={() => handleRoleSelect(rol)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold capitalize">{rol.role}</p>
                    <p className={`text-[10px] font-mono ${isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-500"}`}>
                      Branch: {rol.branchcode || "Organization Wide"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoleSelect(rol);
                      }}
                      className={`p-1 rounded ${isSelected ? "hover:bg-slate-800 dark:hover:bg-slate-200" : "hover:bg-slate-200"}`}
                      title="Edit Permissions"
                    >
                      <Edit size={14} />
                    </button>
                    {rol.role?.toLowerCase() !== "admin" && rol.role?.toLowerCase() !== "superadmin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoleToDelete(rol);
                          setShowDeleteModal(true);
                        }}
                        className={`p-1 rounded text-red-500 ${isSelected ? "hover:bg-slate-800 dark:hover:bg-slate-200" : "hover:bg-slate-200"}`}
                        title="Delete Role"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Permissions matrix */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Permission Matrix</p>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {currentRole ? `Configuring: ${currentRole.role} (${currentRole.branchcode})` : "Select a role from the left list"}
              </h3>
            </div>

            {currentRole && (
              <button
                onClick={handleUpdatePermissions}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs transition flex items-center gap-1.5"
              >
                <Save size={14} />
                Save Permissions
              </button>
            )}
          </div>

          {currentRole ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {renderPermissionSections()}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs font-semibold">
              Click on any role in the list to configure module access rules.
            </div>
          )}
        </div>
      </div>

      <Modal isVisible={showAddModal} maxWidth="md" onClose={() => setShowAddModal(false)} title="Create System Role" closeOnOutsideClick={false}>
        <div className="space-y-4 p-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Branch</label>
            <select
              name="branchcode"
              value={formData.branchcode}
              onChange={handleBranchChange}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Branch</option>
              {branchCodeOption?.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">User Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={!formData.branchcode}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 disabled:opacity-50"
            >
              <option value="">Select Role</option>
              {roleOptions?.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">Cancel</button>
            <button onClick={handleAddRoleSubmit} disabled={!formData.branchcode || !formData.role || loading} className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs disabled:opacity-50">Create Role</button>
          </div>
        </div>
      </Modal>

      <Modal isVisible={showDeleteModal} maxWidth="sm" onClose={() => setShowDeleteModal(false)} title="Confirm Role Deletion" closeOnOutsideClick={false}>
        <div className="space-y-4 p-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete role <strong>"{roleToDelete?.role}"</strong>?</p>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={deleteData.notes}
            onChange={(e) => setDeleteData({ notes: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">Cancel</button>
            <button onClick={handleDeleteRole} className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white">{loading ? "Deleting..." : "Confirm Delete"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
