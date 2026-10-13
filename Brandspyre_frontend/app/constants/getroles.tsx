import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";

export const useRoleAccess = (role: string) => {
  const [roleAccess, setRoleAccess] = useState<any>(null); // null until loaded
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleAccess = async () => {
      try {
        const res = await apiClient.get(`/get-roleaccess/${role}`);
        setRoleAccess(res.data || {});
      } catch (err) {
        console.error("Failed to fetch role access", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleAccess();
  }, [role]);

  return { roleAccess, loading };
};
