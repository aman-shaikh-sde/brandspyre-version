import { useEffect, useState, useCallback, useMemo } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  HeartPulse,
  Lock,
  Briefcase,
  CreditCard,
  File,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import Select from "react-select";
import { isPlatformAdminRole } from "src/utils/roleUtils";

interface Option {
  value: string;
  label: string;
}

interface EmployeeFormProps {
  onSuccess: (newStaffId?: string) => void;
  onCancel: () => void;
}

const DEFAULT_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const INITIAL_FORM_DATA = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  bloodGroup: "",
  customType: "",
  mobileNo: "",
  residenceContactNo: "",
  email: "",
  presentAddress: "",
  permanentAddress: "",
  photograph: null as File | null,
  branchcode: "",
  role: "",
  password: "",
  department: "",
  designation: "",
  dateofjoining: "",
  reporting_to: "",
  pannumber: "",
  aadharnumber: "",
};

export default function EmployeeForm({ onSuccess, onCancel }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Options state
  const [branchOptions, setBranchOptions] = useState<Option[]>([]);
  const [roleOptions, setRoleOptions] = useState<Option[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Option[]>([]);
  const [departmentDesignations, setDepartmentDesignations] = useState<Record<string, Option[]>>({});
  const [designationOptions, setDesignationOptions] = useState<Option[]>([]);
  const [staffOptions, setStaffOptions] = useState<Option[]>([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);
  const [bloodTypes, setBloodTypes] = useState<string[]>(DEFAULT_BLOOD_TYPES);

  const userRole = useAuthStore((state) => state.role);
  const userBranchcode = useAuthStore((state) => state.branchcode);

  const isPlatformAdmin = useMemo(() => {
    return isPlatformAdminRole(userRole);
  }, [userRole]);

  // Select dropdown styling with fixed portal positioning to prevent modal clipping
  const selectCustomStyles = useMemo(() => ({
    menuPortal: (base: any) => ({ ...base, zIndex: 999999 }),
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: state.isFocused ? "#b91c1c" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 1px #b91c1c" : "none",
      "&:hover": {
        borderColor: "#b91c1c"
      },
      minHeight: "38px",
      fontSize: "0.875rem"
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? "#b91c1c" : state.isFocused ? "#fee2e2" : "transparent",
      color: state.isSelected ? "#ffffff" : "#1e293b",
      fontSize: "0.875rem",
      cursor: "pointer"
    })
  }), []);

  // 1. Initial Data Fetching: Branches, Blood Types, and initial Role Options
  useEffect(() => {
    let isMounted = true;

    async function initializeFormOptions() {
      setIsDataLoading(true);
      try {
        // Fetch Branches
        const branchRes = await apiClient.get("/branch/dropdown").catch(() => null);
        let branches: Option[] = [];

        if (branchRes?.data?.result && Array.isArray(branchRes.data.result)) {
          branches = branchRes.data.result
            .filter((b: any) => b.branchcode)
            .map((b: any) => ({
              value: b.branchcode,
              label: b.name ? `${b.name} (${b.branchcode})` : b.branchcode,
            }));
        }

        // Fallback to store branches if dropdown response is empty
        if (branches.length === 0) {
          const storeBranches = useBranchStore.getState().branchCodeOptions;
          if (storeBranches?.length > 0) {
            branches = storeBranches
              .filter((b: any) => b.value)
              .map((b: any) => ({ value: b.value, label: b.label || b.value }));
          }
        }

        if (branches.length === 0 && userBranchcode) {
          branches = [{ value: userBranchcode, label: userBranchcode }];
        }

        if (isMounted) {
          setBranchOptions(branches);

          // Auto-select branch if only 1 option or user has default and not already chosen
          const defaultBranch = userBranchcode || (branches.length === 1 ? branches[0].value : "");
          if (defaultBranch) {
            setFormData((prev) => (prev.branchcode ? prev : { ...prev, branchcode: defaultBranch }));
          }
        }

        // Fetch Blood Types
        const bloodRes = await apiClient.get("/getbloods").catch(() => null);
        if (bloodRes?.data?.blood_types && Array.isArray(bloodRes.data.blood_types)) {
          if (isMounted) setBloodTypes(bloodRes.data.blood_types);
        }

        // Fetch General Tenant Roles from Settings
        const roleRes = await apiClient.get("/setting/read").catch(() => null);
        if (roleRes?.data && Array.isArray(roleRes.data)) {
          const uniqueRoles = Array.from(
            new Set(
              roleRes.data
                .map((r: any) => r.role)
                .filter(Boolean)
                .map((r: string) => r.trim())
            )
          ).map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }));

          const sanitizedRoles = isPlatformAdmin
            ? uniqueRoles
            : uniqueRoles.filter((r) => !isPlatformAdminRole(r.value));

          if (isMounted && sanitizedRoles.length > 0) {
            setRoleOptions(sanitizedRoles);
          }
        }
      } catch (err) {
        console.error("[EmployeeForm] Error initializing options:", err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    initializeFormOptions();

    return () => {
      isMounted = false;
    };
  }, [userBranchcode, isPlatformAdmin]);

  // 2. Fetch Departments & Designations when Branchcode changes
  useEffect(() => {
    let isMounted = true;
    const bCode = formData.branchcode;

    async function fetchDepartmentsAndDesignations() {
      if (!bCode) {
        setDepartmentOptions([]);
        setDepartmentDesignations({});
        return;
      }

      try {
        const [deptRes, desigRes] = await Promise.all([
          apiClient.get(`/getDepartments?branch_code=${encodeURIComponent(bCode)}`).catch(() => null),
          apiClient.get(`/getDesignations?branch_code=${encodeURIComponent(bCode)}`).catch(() => null),
        ]);

        if (!isMounted) return;

        // Process Departments
        if (deptRes?.data?.data && Array.isArray(deptRes.data.data)) {
          const opts = deptRes.data.data
            .map((d: any) => d.name)
            .filter(Boolean)
            .map((name: string) => ({ value: name, label: name }));
          setDepartmentOptions(opts);
        } else {
          setDepartmentOptions([]);
        }

        // Process Designations
        if (desigRes?.data?.data && Array.isArray(desigRes.data.data)) {
          const map: Record<string, Option[]> = {};
          desigRes.data.data.forEach((item: any) => {
            const dept = item.department;
            if (!map[dept]) map[dept] = [];
            if (item.designation) {
              map[dept].push({ value: item.designation, label: item.designation });
            }
          });
          setDepartmentDesignations(map);
        } else {
          setDepartmentDesignations({});
        }

        // Fetch branch-specific roles if available
        const branchRolesRes = await apiClient.get(`/branch/dropdown?branchcode=${encodeURIComponent(bCode)}`).catch(() => null);
        if (branchRolesRes?.data?.result && Array.isArray(branchRolesRes.data.result)) {
          const rolesFromBranch = Array.from(
            new Set(
              branchRolesRes.data.result
                .map((item: any) => item.role)
                .filter(Boolean)
                .map((r: string) => r.trim())
            )
          ).map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }));

          const sanitized = isPlatformAdmin
            ? rolesFromBranch
            : rolesFromBranch.filter((r) => !isPlatformAdminRole(r.value));

          if (sanitized.length > 0) {
            setRoleOptions(sanitized);
          }
        }
      } catch (err) {
        console.error("[EmployeeForm] Error loading branch departments/roles:", err);
      }
    }

    fetchDepartmentsAndDesignations();

    return () => {
      isMounted = false;
    };
  }, [formData.branchcode, isPlatformAdmin]);

  // 3. Update Designation list & fetch Staff for Reporting To when Department changes
  useEffect(() => {
    let isMounted = true;
    const dept = formData.department;
    const bCode = formData.branchcode;

    if (dept && departmentDesignations[dept]) {
      setDesignationOptions(departmentDesignations[dept]);
    } else {
      setDesignationOptions([]);
    }

    async function fetchStaff() {
      if (!dept) {
        setStaffOptions([]);
        return;
      }

      setIsFetchingStaff(true);
      try {
        let url = `/getStaff?department=${encodeURIComponent(dept)}`;
        if (bCode) url += `&branch_code=${encodeURIComponent(bCode)}`;

        const res = await apiClient.get(url).catch(() => null);
        if (!isMounted) return;

        if (res?.data?.data && Array.isArray(res.data.data)) {
          const staff = res.data.data.map((s: any) => ({
            value: s.staff_id,
            label: `${s.firstname || ""} ${s.lastname || ""} (${s.staff_id})`.trim(),
          }));
          setStaffOptions(staff);
        } else {
          setStaffOptions([]);
        }
      } catch (err) {
        console.error("[EmployeeForm] Error fetching staff:", err);
        if (isMounted) setStaffOptions([]);
      } finally {
        if (isMounted) setIsFetchingStaff(false);
      }
    }

    fetchStaff();

    return () => {
      isMounted = false;
    };
  }, [formData.department, formData.branchcode, departmentDesignations]);

  // Standard input/select/textarea change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const files = (e.target as HTMLInputElement).files;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" && files ? files[0] : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Branch change handler
  const handleBranchChange = (selected: Option | null) => {
    setFormData((prev) => ({
      ...prev,
      branchcode: selected ? selected.value : "",
      role: "",
      department: "",
      designation: "",
      reporting_to: "",
    }));

    if (errors.branchcode) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.branchcode;
        return next;
      });
    }
  };

  // Role change handler
  const handleRoleChange = (selected: Option | null) => {
    setFormData((prev) => ({
      ...prev,
      role: selected ? selected.value : "",
    }));

    if (errors.role) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.role;
        return next;
      });
    }
  };

  // Department change handler
  const handleDepartmentChange = (selected: Option | null) => {
    const newDept = selected ? selected.value : "";
    setFormData((prev) => ({
      ...prev,
      department: newDept,
      designation: "",
      reporting_to: "",
    }));

    if (errors.department) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.department;
        return next;
      });
    }
  };

  // Designation change handler
  const handleDesignationChange = (selected: Option | null) => {
    setFormData((prev) => ({
      ...prev,
      designation: selected ? selected.value : "",
    }));

    if (errors.designation) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.designation;
        return next;
      });
    }
  };

  // Reporting To change handler
  const handleReportingToChange = (selected: Option | null) => {
    setFormData((prev) => ({
      ...prev,
      reporting_to: selected ? selected.value : "",
    }));
  };

  // Field validation on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let errMsg = "";

    if (name === "email" && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errMsg = "Invalid email address format";
      }
    }

    if ((name === "mobileNo" || name === "residenceContactNo") && value) {
      const clean = value.replace(/[^0-9]/g, "");
      if (clean.length !== 10) {
        errMsg = "Phone number must be 10 digits";
      }
    }

    if (name === "aadharnumber" && value) {
      const clean = value.replace(/[^0-9]/g, "");
      if (clean.length !== 12) {
        errMsg = "Aadhaar number must be 12 digits";
      }
    }

    if (errMsg) {
      setErrors((prev) => ({ ...prev, [name]: errMsg }));
    }
  };

  // Full form validation before submit
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.maritalStatus) newErrors.maritalStatus = "Marital status is required";

    const blood = formData.bloodGroup === "other" ? formData.customType : formData.bloodGroup;
    if (!blood) newErrors.bloodGroup = "Blood group is required";

    if (!formData.mobileNo.trim()) newErrors.mobileNo = "Mobile number is required";
    else if (formData.mobileNo.replace(/[^0-9]/g, "").length !== 10) {
      newErrors.mobileNo = "Mobile number must be 10 digits";
    }

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (!formData.dateofjoining) newErrors.dateofjoining = "Date of joining is required";
    if (!formData.branchcode) newErrors.branchcode = "Branch is required";
    if (!formData.role) newErrors.role = "User role is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.designation) newErrors.designation = "Designation is required";
    if (!formData.pannumber.trim()) newErrors.pannumber = "PAN number is required";
    if (!formData.aadharnumber.trim()) newErrors.aadharnumber = "Aadhaar number is required";
    else if (formData.aadharnumber.replace(/[^0-9]/g, "").length !== 12) {
      newErrors.aadharnumber = "Aadhaar number must be 12 digits";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      notify.error(`Please complete required field: ${newErrors[firstKey]}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const blood = formData.bloodGroup === "other" ? formData.customType : formData.bloodGroup;

      const employeeData = {
        branchcode: formData.branchcode,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        marital: formData.maritalStatus,
        bloodgroup: blood,
        phonenumber: formData.mobileNo.replace(/[^0-9]/g, ""),
        alternumber: formData.residenceContactNo ? formData.residenceContactNo.replace(/[^0-9]/g, "") : "",
        email: formData.email.trim().toLowerCase(),
        presentaddress: formData.presentAddress.trim(),
        permanentaddress: formData.permanentAddress.trim() || formData.presentAddress.trim(),
        role: formData.role.trim().toLowerCase(),
        password: formData.password,
        department: formData.department,
        designation: formData.designation,
        dateofjoining: formData.dateofjoining,
        reporting_to: formData.reporting_to || "",
        pannumber: formData.pannumber.trim().toUpperCase(),
        aadharnumber: formData.aadharnumber.replace(/[^0-9]/g, ""),
      };

      const response = await apiClient.post("/users/create", {
        profile: [employeeData],
      });

      if (response?.status === 201 || response?.status === 200) {
        const createdUsers = response.data?.data?.createdUsers || response.data?.createdUsers || [];
        const newStaffId = createdUsers[0]?.staff_id;

        onSuccess(newStaffId);
      } else {
        throw new Error(response.data?.message || "Failed to create employee");
      }
    } catch (err: any) {
      console.error("[EmployeeForm] Create error:", err);
      const backendError =
        err.response?.data?.failedUsers?.[0]?.error ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "An error occurred while creating employee";

      setError(backendError);
      notify.error(backendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-xl text-slate-900 dark:text-slate-100">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Personal Information Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User size={16} className="text-red-600" />
          <span>Personal Information</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              First Name <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. Rahul"
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              required
            />
            {errors.firstName && <p className="text-red-600 text-[11px] mt-1">{errors.firstName}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Last Name <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Sharma"
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              required
            />
            {errors.lastName && <p className="text-red-600 text-[11px] mt-1">{errors.lastName}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Date of Birth <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              required
            />
            {errors.dob && <p className="text-red-600 text-[11px] mt-1">{errors.dob}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Gender <span className="text-red-600 font-bold">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <p className="text-red-600 text-[11px] mt-1">{errors.gender}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Marital Status <span className="text-red-600 font-bold">*</span>
            </label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              required
            >
              <option value="">Select Marital Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
            {errors.maritalStatus && <p className="text-red-600 text-[11px] mt-1">{errors.maritalStatus}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Blood Group <span className="text-red-600 font-bold">*</span>
            </label>
            <div className="space-y-2">
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                required
              >
                <option value="">Select Blood Group</option>
                {bloodTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="other">Add Other</option>
              </select>

              {formData.bloodGroup === "other" && (
                <input
                  type="text"
                  name="customType"
                  value={formData.customType}
                  onChange={handleChange}
                  placeholder="Enter Blood Group"
                  className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  required
                />
              )}
            </div>
            {errors.bloodGroup && <p className="text-red-600 text-[11px] mt-1">{errors.bloodGroup}</p>}
          </div>
        </div>
      </div>

      {/* Contact & Credentials Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Phone size={16} className="text-red-600" />
          <span>Contact & Access Credentials</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Mobile Number (10 Digits) <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="tel"
              name="mobileNo"
              value={formData.mobileNo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 9876543210"
              maxLength={10}
              className={`w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border ${
                errors.mobileNo ? "border-red-500" : "border-slate-200 dark:border-slate-700"
              } focus:ring-2 focus:ring-red-500 focus:outline-hidden`}
              required
            />
            {errors.mobileNo && <p className="text-red-600 text-[11px] mt-1">{errors.mobileNo}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Alternate / Residence Contact
            </label>
            <input
              type="tel"
              name="residenceContactNo"
              value={formData.residenceContactNo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 0442345678"
              maxLength={12}
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
            {errors.residenceContactNo && <p className="text-red-600 text-[11px] mt-1">{errors.residenceContactNo}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Email Address <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. rahul@company.com"
              className={`w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border ${
                errors.email ? "border-red-500" : "border-slate-200 dark:border-slate-700"
              } focus:ring-2 focus:ring-red-500 focus:outline-hidden`}
              required
            />
            {errors.email && <p className="text-red-600 text-[11px] mt-1">{errors.email}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Initial Password <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className={`w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border ${
                errors.password ? "border-red-500" : "border-slate-200 dark:border-slate-700"
              } focus:ring-2 focus:ring-red-500 focus:outline-hidden`}
              required
            />
            {errors.password && <p className="text-red-600 text-[11px] mt-1">{errors.password}</p>}
          </div>
        </div>
      </div>

      {/* Employment & Organizational Parameters */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Briefcase size={16} className="text-red-600" />
          <span>Employment & Job Parameters</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Branch Code */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Branch Code <span className="text-red-600 font-bold">*</span>
            </label>
            <Select
              options={branchOptions}
              name="branchcode"
              onChange={handleBranchChange}
              value={branchOptions.find((opt) => opt.value === formData.branchcode) || null}
              placeholder="Select or search branch"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              menuPosition="fixed"
              styles={selectCustomStyles}
              isDisabled={isDataLoading}
              isSearchable={true}
              isClearable={false}
            />
            {errors.branchcode && <p className="text-red-600 text-[11px] mt-1">{errors.branchcode}</p>}
          </div>

          {/* User Role */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              User Role <span className="text-red-600 font-bold">*</span>
            </label>
            <Select
              options={roleOptions}
              name="role"
              onChange={handleRoleChange}
              value={roleOptions.find((opt) => opt.value.toLowerCase() === formData.role.toLowerCase()) || null}
              placeholder="Select or search role"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              menuPosition="fixed"
              styles={selectCustomStyles}
              isDisabled={!formData.branchcode && branchOptions.length > 0}
              isSearchable={true}
              isClearable={false}
            />
            {errors.role && <p className="text-red-600 text-[11px] mt-1">{errors.role}</p>}
          </div>

          {/* Department */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Department <span className="text-red-600 font-bold">*</span>
            </label>
            <Select
              options={departmentOptions}
              name="department"
              onChange={handleDepartmentChange}
              value={departmentOptions.find((opt) => opt.value === formData.department) || null}
              placeholder="Select or search department"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              menuPosition="fixed"
              styles={selectCustomStyles}
              isDisabled={!formData.branchcode}
              isSearchable={true}
              isClearable={false}
            />
            {errors.department && <p className="text-red-600 text-[11px] mt-1">{errors.department}</p>}
          </div>

          {/* Designation */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Designation <span className="text-red-600 font-bold">*</span>
            </label>
            <Select
              options={designationOptions}
              name="designation"
              onChange={handleDesignationChange}
              value={designationOptions.find((opt) => opt.value === formData.designation) || null}
              placeholder={formData.department ? "Select designation" : "Select department first"}
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              menuPosition="fixed"
              styles={selectCustomStyles}
              isDisabled={!formData.department}
              isSearchable={true}
              isClearable={false}
            />
            {errors.designation && <p className="text-red-600 text-[11px] mt-1">{errors.designation}</p>}
          </div>

          {/* Date of Joining */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Date of Joining <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="date"
              name="dateofjoining"
              value={formData.dateofjoining}
              onChange={handleChange}
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              required
            />
            {errors.dateofjoining && <p className="text-red-600 text-[11px] mt-1">{errors.dateofjoining}</p>}
          </div>

          {/* Reporting To */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Reporting To (Manager / Lead)
            </label>
            <Select
              options={staffOptions}
              name="reporting_to"
              onChange={handleReportingToChange}
              value={staffOptions.find((opt) => opt.value === formData.reporting_to) || null}
              placeholder={isFetchingStaff ? "Loading staff..." : "Select reporting manager"}
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              menuPosition="fixed"
              styles={selectCustomStyles}
              isDisabled={!formData.department || staffOptions.length === 0}
              isSearchable={true}
              isClearable={true}
            />
            {formData.department && staffOptions.length === 0 && !isFetchingStaff && (
              <p className="text-[11px] text-slate-400 mt-1">No other staff currently assigned to this department.</p>
            )}
          </div>
        </div>
      </div>

      {/* Address & Statutory Identification */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CreditCard size={16} className="text-red-600" />
          <span>Identification & Address</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              PAN Number <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="pannumber"
              value={formData.pannumber}
              onChange={handleChange}
              placeholder="e.g. ABCDE1234F"
              maxLength={10}
              className="w-full uppercase bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              required
            />
            {errors.pannumber && <p className="text-red-600 text-[11px] mt-1">{errors.pannumber}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Aadhaar Number (12 Digits) <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="aadharnumber"
              value={formData.aadharnumber}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 123456789012"
              maxLength={12}
              className={`w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border ${
                errors.aadharnumber ? "border-red-500" : "border-slate-200 dark:border-slate-700"
              } focus:ring-2 focus:ring-red-500 focus:outline-hidden`}
              required
            />
            {errors.aadharnumber && <p className="text-red-600 text-[11px] mt-1">{errors.aadharnumber}</p>}
          </div>

          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Present Address
            </label>
            <textarea
              name="presentAddress"
              value={formData.presentAddress}
              onChange={handleChange}
              rows={2}
              placeholder="Street, City, State, PIN"
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Permanent Address
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData((prev) => ({ ...prev, permanentAddress: prev.presentAddress }));
                    }
                  }}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span>Same as Present Address</span>
              </label>
            </div>
            <textarea
              name="permanentAddress"
              value={formData.permanentAddress}
              onChange={handleChange}
              rows={2}
              placeholder="Street, City, State, PIN"
              className="w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <>
              <ButtonLoader />
              <span>Creating Employee...</span>
            </>
          ) : (
            <span>Create Employee</span>
          )}
        </button>
      </div>
    </form>
  );
}
