import { apiClient } from "src/services/apiClient";
import {
  CalendarCheck,
  ClipboardList,
  Flag,
  Hash,
  ListChecks,
  Milestone,
  Network,
  Tag,
  Target,
  User,
  User2Icon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useClientStore from "src/stores/ClientStore";
import useProjectStore from "src/stores/ProjectStore";
import useBranchStore from "src/stores/useBranchStore";
import useEmployeeStore from "src/stores/useEmployeeStore";
import { BASE_URL } from "~/constants/api";

const EditPaymentForm = ({ taskData, onSuccess, onCancel }) => {
  console.log("taskkidin tssk", taskData?.task_id);
  console.log("taskkidin tssk details", taskData);
  const branchCodeOption = useBranchStore((state) => state.branchCodeOptions);
  const [loading, setLoading] = useState(false);
  const taskId = taskData.task_id;
  const [fetching, setFetching] = useState(true);
  
  const staff_ids = useAuthStore((state) => state.staff_id);
  const [department, setDepartment] = useState<string | null>(null);
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string; label: string }[]>([]);


  const clientcodeOptions = useClientStore((state) => state.clientscodeOptions);
  const [error, setError] = useState(null);
  const allProjectcodeOptions = useProjectStore(
    (state) => state.allProjectcodeOptions
  );
  const employeeOption = useEmployeeStore(
    (state) => state.branchEmployeeOptions
  );
  const milestonecodeOption = useProjectStore(
    (state) => state.allMilestonecodeOptions
  );
  const token = useAuthStore((state) => state.accessToken);

  const [formData, setFormData] = useState({
    branchcode: "",
    client_code: "",
    project_code: "",
    milestone_code: "",
    task_title: "",
    task_priority: "",
    start_date: "",
    end_date: "",
    handler_by: "",
    notes: "",
    collaborate: [],
    status: "draft",
  });





// useEffect(() => {
//   const requestAmount = parseFloat(formData.milestone_amount) || 0;
//   const paidAmount = parseFloat(formData.paid_amount) || 0;
//   const cgstPercent = parseFloat(formData.cgst_percentage) || 0;
//   const sgstPercent = parseFloat(formData.sgst_percentage) || 0;
//   const discount = parseFloat(formData.discount) || 0;
//   const roundOff = parseFloat(formData.round_off) || 0;

//   // Calculate CGST & SGST amounts
//   const cgstAmount = (requestAmount * cgstPercent) / 100;
//   const sgstAmount = (requestAmount * sgstPercent) / 100;

//   // Total before discount
//   const totalBeforeDiscount = requestAmount + cgstAmount + sgstAmount;

//   // Apply discount & round off
//   const finalAmount = totalBeforeDiscount - discount + roundOff;

//   setFormData((prev) => ({
//     ...prev,
//     cgst_amount: cgstAmount.toFixed(2),
//     sgst_amount: sgstAmount.toFixed(2),
//     total_amount: totalBeforeDiscount.toFixed(2),
//     final_amount: finalAmount.toFixed(2),
//     balance_amount: (finalAmount - paidAmount).toFixed(2),
//   }));
// }, [
//   formData.milestone_amount,
//   formData.paid_amount,
//   formData.cgst_percentage,
//   formData.sgst_percentage,
//   formData.discount,
//   formData.round_off,
// ]);



useEffect(() => {
  if (formData.milestone_amount === "" || formData.milestone_amount === undefined) {
    setFormData((prev) => ({
      ...prev,
      sgst_amount: "0.00",
      cgst_amount: "0.00",
      total_amount: "0.00",
      balance_amount: "0.00",
    }));
    return;
  }

  const milestoneAmount = parseFloat(formData.milestone_amount) || 0;
  const paidAmount = parseFloat(formData.paid_amount) || 0;
  const sgst = parseFloat(formData.sgst_percentage) || 0;
  const cgst = parseFloat(formData.cgst_percentage) || 0;
  const discount = parseFloat(formData.discount) || 0;
  const roundOff = parseFloat(formData.round_off) || 0;
  const taxType = formData.tax_type || "exclusive";

  let sgstAmount = 0;
  let cgstAmount = 0;
  let grossAmount = 0;

  if (taxType === "inclusive") {
    const totalTaxPercent = sgst + cgst;
    if (totalTaxPercent > 0) {
      const baseAmount = milestoneAmount / (1 + totalTaxPercent / 100);
      sgstAmount = (baseAmount * sgst) / 100;
      cgstAmount = (baseAmount * cgst) / 100;
      grossAmount = milestoneAmount;
    } else {
      grossAmount = milestoneAmount;
    }
  } else {
    sgstAmount = (milestoneAmount * sgst) / 100;
    cgstAmount = (milestoneAmount * cgst) / 100;
    grossAmount = milestoneAmount + sgstAmount + cgstAmount;
  }

  const discounted = grossAmount - discount;
  const finalAmount = discounted + roundOff;
  const balance = finalAmount - paidAmount;

  setFormData((prev) => ({
    ...prev,
    sgst_amount: sgstAmount.toFixed(2),
    cgst_amount: cgstAmount.toFixed(2),
    total_amount: finalAmount.toFixed(2),
    balance_amount: balance.toFixed(2),
  }));
}, [
  formData.milestone_amount,
  formData.sgst_percentage,
  formData.cgst_percentage,
  formData.paid_amount,
  formData.discount,
  formData.round_off,
  formData.tax_type,
]);




  useEffect(() => {
    if (taskData) {
      // Format dates for the input fields (YYYY-MM-DD)
      const formattedStartDate = taskData.start_date
        ? taskData.start_date.split("T")[0]
        : "";
const formattedDueDate = taskData.due_date
      ? new Date(taskData.due_date).toISOString().split("T")[0]
      : "";

    setFormData({
      branchcode: taskData.branchcode || "",
      client_code: taskData.client_code || "",
      project_code: taskData.project_code || "",
      milestone_code: taskData.milestone_code || "",
      request_id : taskData.request_id,
      // permission is boolean -> if you need it as string, convert
      task_title: taskData.permission ? "Yes" : "No", 
      task_priority: taskData.task_priority || "", // <-- not in your API, keep empty
      start_date: "", // <-- not in API response, leave blank
      end_date: "",   // <-- not in API response, leave blank
      due_date: formattedDueDate,
      paid_amount: taskData.paid_amount,
      milestone_amount: taskData.milestone_amount || "",
      balance_amount: taskData.balance_amount || "",
      handler_by: taskData.handler_by || "", // <-- not in API response, leave blank
      notes: taskData.notes || "",
      collaborate: taskData.collaborate || [], // <-- not in API response, keep []
      status: taskData.status || "draft",
      invoice_id : taskData.invoice_id,
        cgst_percentage : taskData.cgst_percentage,
        cgst_amount : taskData.cgst_amount,
        sgst_percentage : taskData.sgst_percentage,
        sgst_amount : taskData.sgst_amount,
        discount : taskData.discount,
        round_off : taskData.roundoff,
        total_amount : taskData.total_amount,
        final_amount : taskData.final_amount,
        invoice_no : taskData.invoice_no,
    });
    }
  }, [taskData]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //   const validateForm = () => {
  //     if (!formData.branchcode) {
  //       setError("Branch code is required");
  //       return false;
  //     }
  //     if (!formData.project_code) {
  //       setError("Project code is required");
  //       return false;
  //     }
  //     if (!formData.milestone_code) {
  //       setError("Milestone code is required");
  //       return false;
  //     }
  //     if (!formData.task_title) {
  //       setError("Task title is required");
  //       return false;
  //     }
  //     if (!formData.start_date || !formData.end_date) {
  //       setError("Both start and end dates are required");
  //       return false;
  //     }
  //     if (new Date(formData.start_date) > new Date(formData.end_date)) {
  //       setError("End date must be after start date");
  //       return false;
  //     }
  //     if (!formData.handler_by) {
  //       setError("Handler is required");
  //       return false;
  //     }

  //     return true;
  //   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // if (!validateForm()) {
    //   setLoading(false);
    //   return;
    // }

    // const taskData = {
    //   data: {
    //     branchcode: formData.branchcode,
    //     client_code: formData.client_code,
    //     project_code: formData.project_code,
    //     milestone_code: formData.milestone_code,
    //     task_title: formData.task_title,
    //     task_priority: formData.task_priority,
    //     start_date: formData.start_date,
    //     end_date: formData.end_date,
    //     handler_by: formData.handler_by,
    //     notes: formData.notes,
    //     status: formData.status,
    //   },
    // };


    const taskData = {
  data: {
    branchcode: formData.branchcode,
    client_code: formData.client_code,
    project_code: formData.project_code,
    milestone_code: formData.milestone_code,
    request_id: formData.task_title, // map back
    due_date: formData.due_date,
    milestone_amount: formData.milestone_amount,
    balance_amount: formData.balance_amount,
    paid_amount : formData.paid_amount,
    notes: formData.notes,
    status: formData.status,
    invoice_id: formData.invoice_id,
  cgst_percentage: formData.cgst_percentage,
  cgst_amount: formData.cgst_amount,
  sgst_percentage: formData.sgst_percentage,
  sgst_amount: formData.sgst_amount,
  discount: formData.discount,
  round_off : formData.round_off,
  total_amount: formData.total_amount,
  final_amount: formData.final_amount,
  invoice_no: formData.invoice_no,
  },
};

const payload = {
  invoice_id: formData.invoice_id,
  request_id: formData.request_id,  // ✅ correct
  branchcode: formData.branchcode,
  client_code: formData.client_code,
  project_code: formData.project_code,
  milestone_code: formData.milestone_code,
  milestone_amount : formData.milestone_amount,
  invoice_no: formData.invoice_no,
  invoice_date: formData.invoice_date,
  due_date: formData.due_date,
  cgst_percentage: formData.cgst_percentage,
  sgst_percentage: formData.sgst_percentage,
  cgst_amount: formData.cgst_amount,
  sgst_amount: formData.sgst_amount,
  discount: formData.discount,
  round_off: formData.round_off,
  total_amount: formData.total_amount,
  paid_amount: formData.paid_amount,
  notes: formData.notes,
  status: formData.status,
};
    try {
      console.log("taskdataaaa", taskData, taskId);
      // const response = await apiClient.put(
      //   `/updatepay`,
      //   taskData,
      //   {
      //
      //   }
      // );
       const response = await apiClient.put(`/updatepay`, payload);

      if (response.status === 200) {
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update payment");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(err.response?.data?.message || "Error updating task");
    } finally {
      setLoading(false);
    }
  };


   useEffect(() => {
    if (!formData.branchcode) {
      setEmployeeOptions([]);
      return;
    }







    async function fetchEmployees() {
      try {
        const res = await fetch(
          `/getStaffbranch?branchcode=${encodeURIComponent(formData.branchcode)}`
        );
        const data = await res.json();

        if (data?.status && Array.isArray(data.data)) {
          const options = data.data.map((emp: Employee) => ({
            value: emp.staff_id,
            label: `${emp.firstname} ${emp.lastname} (${emp.designation})`,
          }));
          setEmployeeOptions(options);
        } else {
          setEmployeeOptions([]);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
        setEmployeeOptions([]);
      }
    }

    fetchEmployees();
  }, [formData.branchcode]); // 🔑 re-fetch whenever branch changes





return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <Flag className="inline mr-2" /> Payment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Branch Code
            </p>
            <select
              name="branchcode"
              value={formData.branchcode}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Branch</option>
              {branchCodeOption?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Network className="inline mr-1" size={14} /> Related Project
            </p>
            <select
              name="project_code"
              value={formData.project_code}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Project</option>
              {allProjectcodeOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Milestone className="inline mr-1" size={14} /> Select Milestone
            </p>
            <select
              name="milestone_code"
              value={formData.milestone_code}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Milestone</option>
              {milestonecodeOption?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Request Id
            </p>
            <input
              name="task_title"
              value={formData.request_id}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter request_id"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User2Icon className="inline mr-1" size={14} /> Select Client
            </p>
            <select
              name="client_code"
              value={formData.client_code}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Client</option>
              {clientcodeOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>


          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Due Date
            </p>
            <input
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            />
          </div>
        </div>



                
{/* Request & Paid Amounts */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> Request Amount
    </p>
    <input
      name="milestone_amount"
      value={formData.milestone_amount}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Enter Amount"
      required
    />
  </div>

  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> Paid Amount
    </p>
    <input
      name="paid_amount"
      value={formData.paid_amount}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Enter Amount"
      required
    />
  </div>
</div>

{/*here*/}

             <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Tax Type
            </p>
            <select
              name="tax_type"
              value={formData.tax_type}
              onChange={handleChange}
              className="w-full bg-transparent text-sm mt-1 focus:outline-none"
            >
              <option value="exclusive">Exclusive (Tax added on top)</option>
              <option value="inclusive">Inclusive (Tax included in amount)</option>
            </select>
          </div>



{/* Taxes & Amounts Section */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> CGST Percentage
    </p>
    <input
      name="cgst_percentage"
      value={formData.cgst_percentage}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Enter CGST %"
      required
    />
  </div>

  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> CGST Amount
    </p>
    <input
      name="cgst_amount"
      value={formData.cgst_amount}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Enter CGST Amount"
      required
    />
  </div>

  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> SGST %
    </p>
    <input
      name="sgst_percentage"
      value={formData.sgst_percentage}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Enter SGST %"
      required
    />
  </div>

  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> SGST Amount
    </p>
    <input
      name="sgst_amount"
      value={formData.sgst_amount}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Enter SGST Amount"
      required
    />
  </div>

  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> Discount
    </p>
    <input
      name="discount"
      value={formData.discount}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Enter Discount"
      required
    />
  </div>

    <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> Round Off
    </p>
    <input
      name="round_off"
      value={formData.round_off}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Enter Roundoff"
      required
    />
  </div>





  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> Total Amount
    </p>
    <input
      name="total_amount"
      value={formData.total_amount}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Total"
      required
    />
  </div>

  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> Final Amount
    </p>
    <input
      name="final_amount"
      value={formData.final_amount}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Final Amount"
      required
    />
  </div>


  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      <ClipboardList className="inline mr-1" size={14} /> Invoice No
    </p>
    <input
      name="invoice_no"
      value={formData.invoice_no}
      onChange={handleChange}
      type="number"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      placeholder="Invoice No"
      required
    />
  </div>
</div>



{/*here*/}


                                  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Balance Amount
            </p>
            <input
              name="balance_amount"
              value={formData.balance_amount}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter Amount"
              required
            />
          </div>



        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Tag className="inline mr-1" size={14} /> Status
          </p>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option value="paid">paid</option>
            <option value="request">request</option>
            <option value="partially_paid">Partially paid</option>
            <option value="raised">Raised</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {formData.collaborate.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
            Collaborators (Read Only)
          </h3>
          {formData.collaborate.map((collaborate, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <User className="inline mr-1" size={14} /> Staff Member
                </p>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                  {employeeOption?.find(
                    (opt) => opt.value === collaborate.staff_id
                  )?.label || collaborate.staff_id}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Tag className="inline mr-1" size={14} /> Collaboration Status
                </p>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 capitalize">
                  {collaborate.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <ListChecks className="inline mr-2" /> Notes
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <Target className="inline mr-1" size={14} /> Task Notes
          </p>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
            placeholder="Enter the Task Notes"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm disabled:opacity-70"
        >
          {loading ? <ButtonLoader /> : "Update Payment"}
        </button>
      </div>
    </div>
  );
};

export default EditPaymentForm;
