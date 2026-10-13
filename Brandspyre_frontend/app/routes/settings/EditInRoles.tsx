import { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";
const EditUserRoleForm = ({ user, token, onSuccess, onCancel }) => {
  const [role, setRole] = useState(user.position || "");
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (user) {
      setRole(user.position || "");
    }
  }, [user]);

  // ? Fetch roles dynamically from the same API
  // useEffect(() => {
  //   async function fetchRoles() {
  //     try {
  //       const res = await fetch(`/users/read`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });
  //       const result = await res.json();
  //       if (result?.data) {
  //         // extract unique roles
  //         const uniqueRoles = [...new Set(result.data.map((u) => u.role))];
  //         setRoles(uniqueRoles);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching roles:", err);
  //     }
  //   }
  //   fetchRoles();
  // }, [token]);

  // ? Fetch roles from /setting/read
  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await apiClient.get(`/setting/read`);

        console.log("Roles Response: ", response.data);

        if (Array.isArray(response.data)) {
          // Extract only role names
          const extracted = response.data
            .map((item) => item.role)
            .filter((r) => r && r.trim() !== ""); // remove empty roles

          // Make unique list
          const uniqueRoles = [...new Set(extracted)];

          setRoles(uniqueRoles);
        }
      } catch (error) {
        console.log("Error fetching roles:", error);
      }
    }

    fetchRoles();
  }, [token]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(
        `/users/edit`,
        {
          profile: {
            staff_id: user.staff_id, // ? must come from API, make sure you mapped this
            role: role,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify.success("User role updated successfully!");
      onSuccess();
    } catch (err) {
      console.error("Error updating role:", err);
      notify.error("Failed to update role");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium">Staff ID</label>
        <input
          type="text"
          value={user.staff_id || ""}
          disabled
          className="w-full border rounded px-3 py-2 mt-1 bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border rounded px-3 py-2 mt-1"
          required
        >
          <option value="">Select Role</option>
          {roles.map((r, index) => {
  const label = r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
  return (
    <option key={index} value={r}>
      {label}
    </option>
  );
})}
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Update
        </button>
      </div>
    </form>
  );
};

export default EditUserRoleForm;
