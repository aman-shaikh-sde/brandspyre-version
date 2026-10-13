import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { LogOut } from "lucide-react";
import { useAuthStore } from "src/stores/authStore";
import { apiClient } from "src/services/apiClient";
interface SalaryDetails {
  basic: number;
  hra: number;
  da: number;
  specialAllowance: number;
  medicalAllowance: number;
  conveyanceAllowance: number;
  otherAllowances: number;
  totalEarnings: number;
  pf: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  inWords: string;
}

interface EmployeeData {
  name: string;
  employeeId: string;
  designation: string;
  department: string;
  bankAccount: string;
  panNumber: string;
  payPeriod: string;
  paymentDate: string;
}

const Payslip = () => {
  const payslipRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const accesstoken = useAuthStore((state) => state.accessToken);
  const authStaffId = useAuthStore((state) => state.staff_id);

  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [salaryDetails, setSalaryDetails] = useState<SalaryDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [hydrated, setHydrated] = useState(false);

  // wait for Zustand persist to hydrate
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

  const token = accesstoken;

  // Convert numbers to words
  const numberToWords = (num: number): string => {
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
      if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
      if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
      return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
    };

    return inWords(num) + " Only";
  };

  useEffect(() => {
    if (hydrated && token) {
      const targetId = id || authStaffId;
      if (!targetId) {
        navigate("/employee/salary_slip", { replace: true });
        setLoading(false);
        return;
      }

      const fetchSalary = async () => {
        try {
          const res = await apiClient.get(`/users/salary/read?id=${encodeURIComponent(targetId)}`);
          const data = res.data;

          if (data?.data?.length > 0) {
            const salary = data.data[0];

            // map salary details
            setSalaryDetails({
              basic: Number(salary.basicsalary) || 0,
              hra: Number(salary.hra) || 0,
              da: Number(salary.lpa) || 0, // check if your API really stores DA here
              specialAllowance: Number(salary.special_allowance) || 0,
              medicalAllowance: Number(salary.medical_allowance) || 0,
              conveyanceAllowance: Number(salary.conveyance_allowance) || 0,
              otherAllowances: Number(salary.other_allowance) || 0,
              totalEarnings: Number(salary.gross_salary) || 0,
              pf: Number(salary.pf) || 0,
              professionalTax: Number(salary.esi) || 0, // your API calls it esi
              tds: Number(salary.tds) || 0,
              otherDeductions: Number(salary.deductions) || 0,
              totalDeductions:
                (Number(salary.deductions) || 0) +
                (Number(salary.pf) || 0) +
                (Number(salary.esi) || 0) +
                (Number(salary.tds) || 0),
              netPay: Number(salary.net_salary) || 0,
              inWords: numberToWords(Number(salary.net_salary) || 0),
            });

            // map employee details
            setEmployeeData({
              name: salary.name || salary.staff_id,
              employeeId: salary.staff_id,
              designation: salary.designation || "N/A",
              department: salary.branchcode || "N/A",
              bankAccount: salary.accountnumber || "N/A",
              panNumber: salary.pan || "N/A",
              payPeriod: salary.processondate,
              paymentDate: salary.processtilldate,
            });
          }
        } catch (error) {
          console.error("Error fetching salary data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSalary();
    }
  }, [hydrated, id, token]);

  const handleGoBack = () => navigate(-1);

  if (loading) return <p className="text-center mt-10">Loading payslip...</p>;
  if (!employeeData || !salaryDetails) return <p className="text-center mt-10">No payslip data found.</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6 no-print">
        <button className="text-gray-500 bg-gray-200 px-3 py-2 rounded-lg" onClick={handleGoBack}>
          <LogOut className="inline rotate-180 text-gray-500 mr-3" />
          Go Back
        </button>
        <h1 className="text-2xl font-bold text-gray-600">Salary Slip</h1>
      </div>

      <div ref={payslipRef} className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto border border-gray-200">
        {/* Company Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-red-700">BRANDSPYRE Technologies</h2>
          <p className="text-gray-600">No: 10/387-d6 Meenakshi Nagar 1st Street,

          </p>
          <p className="text-gray-600">Near King's Palace Old Check Post,
            Pannaiyarkulam,</p>
          <p className="text-gray-600">Ramanathapuram
            Mobile: 9786815307, Tamil Nadu - 623503</p>
          <p className="text-gray-600">GSTIN: 33AADCA5362R1Z2</p>
        </div>

        {/* Payslip Title */}
        <div className="border-b-2 border-gray-300 pb-4 mb-6">
          <h3 className="text-2xl font-semibold text-center text-gray-800">SALARY SLIP</h3>
          <p className="text-center text-gray-600">{employeeData.payPeriod}</p>
        </div>

        {/* Employee Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Employee Details</h4>
            <p><span className="font-medium">Name:</span> {employeeData.name}</p>
            <p><span className="font-medium">Employee ID:</span> {employeeData.employeeId}</p>
            <p><span className="font-medium">Designation:</span> {employeeData.designation}</p>
            <p><span className="font-medium">Department:</span> {employeeData.department}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Payment Details</h4>
            <p><span className="font-medium">Bank Account:</span> {employeeData.bankAccount}</p>
            <p><span className="font-medium">PAN Number:</span> {employeeData.panNumber}</p>
            <p><span className="font-medium">Pay Period:</span> {employeeData.payPeriod}</p>
            <p><span className="font-medium">Payment Date:</span> {employeeData.paymentDate}</p>
          </div>
        </div>

        {/* Salary Details */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Salary Details</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b border-r border-gray-300 text-left">Earnings</th>
                  <th className="py-2 px-4 border-b border-gray-300 text-right">Amount (₹)</th>
                  <th className="py-2 px-4 border-b border-l border-r border-gray-300 text-left">Deductions</th>
                  <th className="py-2 px-4 border-b border-gray-300 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 border-b border-r border-gray-300">Basic Salary</td>
                  <td className="py-2 px-4 border-b border-gray-300 text-right">{salaryDetails.basic.toLocaleString()}</td>
                  <td className="py-2 px-4 border-b border-l border-r border-gray-300">Provident Fund</td>
                  <td className="py-2 px-4 border-b border-gray-300 text-right">{salaryDetails.pf.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-r border-gray-300">HRA</td>
                  <td className="py-2 px-4 border-b border-gray-300 text-right">{salaryDetails.hra.toLocaleString()}</td>
                  <td className="py-2 px-4 border-b border-l border-r border-gray-300">ESI</td>
                  <td className="py-2 px-4 border-b border-gray-300 text-right">{salaryDetails.professionalTax.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-r border-gray-300">DA</td>
                  <td className="py-2 px-4 border-b border-gray-300 text-right">{salaryDetails.da.toLocaleString()}</td>
                  <td className="py-2 px-4 border-b border-l border-r border-gray-300">TDS</td>
                  <td className="py-2 px-4 border-b border-gray-300 text-right">{salaryDetails.tds.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-r border-gray-300">Special Allowance</td>
                  <td className="py-2 px-4 border-b border-gray-300 text-right">{salaryDetails.specialAllowance.toLocaleString()}</td>
                  <td className="py-2 px-4 border-b border-l border-r border-gray-300">Other Deductions</td>
                  <td className="py-2 px-4 border-b border-gray-300 text-right">{salaryDetails.otherDeductions.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Pay */}
        <div className="flex justify-between items-center mb-8 p-4 bg-gray-100 rounded">
          <div>
            <p className="font-semibold">Net Pay (In Words):</p>
            <p className="italic">{salaryDetails.inWords}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Net Payable Amount:</p>
            <p className="text-2xl font-bold">₹ {salaryDetails.netPay.toLocaleString()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-gray-300">
          <div className="text-center">
            <p className="font-medium">Employee Signature</p>
            <div className="h-16"></div>
          </div>
          <div className="text-center">
            <p className="font-medium">ForBrandsypre Groups</p>
            <div className="h-16"></div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          <p>This is a system generated payslip and does not require signature</p>
          <p className="mt-1">For any queries, please contact HR Department</p>
        </div>
      </div>
    </div>
  );
};

export default Payslip;
