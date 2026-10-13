import { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { useAuthStore } from "src/stores/authStore";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";

const departmentOptions = [
  "architecture",
  "visualization",
  "structural",
  "drafting",
  "hr",
  "sales",
  "consulting",
];

export const useStaffFilter = (branchcode) => {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [staffOptions, setStaffOptions] = useState([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);
  const token = useAuthStore((state) => state.accessToken);
  useEffect(() => {
    if (selectedDepartment && branchcode) {
      fetchStaffOptions();
    }
  }, [selectedDepartment, branchcode]);

  const fetchStaffOptions = async () => {
    setIsFetchingStaff(true);
    try {
      let url = `/users/dropdown?department=${selectedDepartment}`;

      const baseBranchCode = branchcode ? branchcode.split('/')[0] : "";
      if (baseBranchCode) {
        url += `&branchcode=${baseBranchCode}`;
      }

      const response = await apiClient.get(url);
      console.log("responsefostaffidinleadd", response);
      if (response.data?.data) {
        const options = response.data.data.map((user) => ({
          value: user.staff_id,
          label: `${user.firstname} ${user.lastname} - ${user.designation}`,
        }));
        setStaffOptions(options);
      }
    } catch (err) {
      notify.error("Failed to fetch staff options");
      setStaffOptions([]);
    } finally {
      setIsFetchingStaff(false);
    }
  };

  const handleDepartmentChange = (value) => {
    setSelectedDepartment(value);
  };

  return {
    departmentOptions,
    selectedDepartment,
    staffOptions,
    isFetchingStaff,
    handleDepartmentChange,
  };
};
