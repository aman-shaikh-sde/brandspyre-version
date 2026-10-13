// import { MailCheck, SquareChartGanttIcon } from "lucide-react";
// import React, { useState ,useEffect } from "react";
// import { AiFillProject, AiFillPushpin } from "react-icons/ai";
// import { useParams } from "react-router-dom";
// import {
//   FaAddressCard,
//   FaExclamationCircle,
//   FaMailBulk,
//   FaMailchimp,
//   FaProjectDiagram,
// } from "react-icons/fa";
// import PaymentProgressCard from "src/component/graphComponents/ProgressCard";
// import Project from "../Project/Project";
// import Modal from "src/component/Modal";
// import AddSalaryForm from "../Employee/Salary/AddSalary";
// import ClientMom from "./ClientMOM";
// import ClientFeedbacks from "./ClientFeedback";

// function Clients() {
//   const [activeTab, setActiveTab] = useState("clientProfile");
//   const {id } = useParams();
//   console.log("Client Code:", id);
//   const progressItems = [
//     {
//       type: "overdue",
//       value: 200,
//       color: "bg-red-500",
//       icon: <FaExclamationCircle className="text-red-500 mr-2" />,
//       label: "Overdue",
//     },
//   ];
//   const tabs = [
//     { id: "clientProfile", label: "Client Info" },
//     { id: "paymentinfo", label: "All Payment Details" },
//     { id: "mom", label: "Meeting Records" },
//     { id: "feedback", label: " Feedback" },
//     { id: "invoice", label: "Client Invoice" },
//   ];

//   return (
//     <>
//       <div className="text-red-700 text-2xl font-bold mb-5">
//         View Client Page
//       </div>
//       <div className="border-b border-gray-200 dark:border-gray-700">
//         <nav className="flex -mb-px">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === tab.id
//                   ? "border-red-500 text-red-600"
//                   : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//               }`}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </nav>
//       </div>

//       <div className="p-4 flex-grow">
//         {activeTab === "clientProfile" && (
//           <div>
//             <div className="bg-white h-[100%]  py-10  px-10 w-full text-gray-600 rounded-xl mt-10">
//               <div className="flex justify-between">
//                 <div className="flex flex-col justify-between align-middle">
//                   <p className="text-red-700 font-medium text-xl">
//                     <AiFillProject className="inline mr-3" size={25} />
//                     Client Name  {id}
//                   </p>
//                   <div className="mt-3 flex flex-col gap-2 h-[100px] w-[200px] bg-blue-100/45 py-6 rounded-lg items-center">
//                     <p> Residential</p>
//                     <p>Commerical</p>
//                   </div>
//                 </div>
//                 <div className="flex flex-col justify-between align-middle">
//                   <p className="text-red-700 font-medium text-xl">
//                     <FaAddressCard className="inline mr-3" size={25} />
//                     Company Address
//                   </p>
//                   <div className="mt-3 flex flex-col gap-2 h-[100px] w-[200px] bg-blue-100/45 py-6  rounded-lg items-center">
//                     <p> Plot No. 12, Anna Nagar</p>
//                     <p>Tamil Nadu, 600040</p>
//                   </div>
//                 </div>
//                 <div className="flex flex-col justify-between align-middle">
//                   <p className="text-red-700 font-medium text-xl">
//                     <FaMailBulk className="inline mr-3" size={25} />
//                     Balance Due
//                   </p>
//                   <div className="mt-3 flex flex-col gap-2 h-[100px] w-[200px] bg-blue-100/45 py-6  rounded-lg items-center">
//                     <p> 3D Elevation,</p>
//                     <p>Vastu Compliant Design</p>
//                   </div>
//                 </div>
//                 <div className="flex flex-col justify-between align-middle">
//                   <p className="text-red-700 font-medium text-xl">
//                     <FaProjectDiagram className="inline mr-3" size={25} />
//                     No of Projects
//                   </p>
//                   <div className="mt-3 flex flex-col gap-2 h-[100px] w-[200px] bg-blue-100/45 py-6  rounded-lg items-center">
//                     <p> AutoCAD</p>
//                     <p>SketchUp, Revit</p>
//                   </div>
//                 </div>
//               </div>
//               <div>
//                 <div className="flex align-middle mt-8 ml-4">
//                   {/*<p className="text-red-700 font-medium text-xl">
//                     <AiFillPushpin className="inline mr-3" size={25} />
//                     Scope of Work
//                   </p>*/}
//                   {/*<div className="flex rounded-lg items-center justify-evenly w-[900px] gap-8">
//                     <div>
//                       <input type="checkbox" className="w-4 h-4 mr-3" />
//                       <label>Structural Design</label>
//                     </div>
//                     <div>
//                       <input type="checkbox" className="w-4 h-4 mr-3" />
//                       <label>Supervision</label>
//                     </div>
//                     <div>
//                       <input type="checkbox" className="w-4 h-4 mr-3" />
//                       <label>Consultation</label>
//                     </div>
//                   </div>*/}
//                 </div>
//               </div>
//             </div>
//             <div className="mt-10">
//               <Project />
//             </div>
//           </div>
//         )}
//         {activeTab === "paymentinfo" && (
//           <div>
//             <div className="flex justify-evenly w-[100%] mt-15">
//               <div className="flex flex-col gap-5 justify-evenly w-[20%] h-[200px] bg-white rounded-3xl shadow-2xl p-8 dark:bg-gray-800">
//                 <h1 className="font-medium text-xl text-red-700">₹ 3,00,000</h1>
//                 <div className="w-[40px] h-[40px] bg-red-300 dark:bg-red-700/25  rounded-sm flex items-center justify-center">
//                   <SquareChartGanttIcon
//                     className="text-white dark:text-red-300"
//                     size={25}
//                   />
//                 </div>

//                 <p className="dark:text-gray-400">Total Project Amount</p>
//               </div>
//               <div className="flex flex-col gap-5 justify-evenly w-[20%] h-[200px] bg-white rounded-3xl shadow-2xl p-8 dark:bg-gray-800">
//                 <h1 className="font-medium text-xl text-red-700">₹ 3,00,000</h1>
//                 <div className="w-[40px] h-[40px] bg-red-300 dark:bg-red-700/25  rounded-sm flex items-center justify-center">
//                   <SquareChartGanttIcon
//                     className="text-white dark:text-red-300"
//                     size={25}
//                   />
//                 </div>

//                 <p className="dark:text-gray-400">Total Paid Amount</p>
//               </div>
//               <div className="flex flex-col gap-5 justify-evenly w-[20%] h-[200px] bg-white rounded-3xl shadow-2xl p-8 dark:bg-gray-800">
//                 <h1 className="font-medium text-xl text-red-700">₹ 3,00,000</h1>
//                 <div className="w-[40px] h-[40px] bg-red-300 dark:bg-red-700/25  rounded-sm flex items-center justify-center">
//                   <SquareChartGanttIcon
//                     className="text-white dark:text-red-300"
//                     size={25}
//                   />
//                 </div>

//                 <p className="dark:text-gray-400">Total Balance Amount</p>
//               </div>
//               {/*<div className="flex flex-col gap-5 justify-evenly w-[20%] h-[200px] bg-white rounded-3xl shadow-2xl p-8 dark:bg-gray-800">
//                 <h1 className="font-medium text-xl text-red-700">₹ 3,00,000</h1>
//                 <div className="w-[40px] h-[40px] bg-red-300 dark:bg-red-700/25  rounded-sm flex items-center justify-center">
//                   <SquareChartGanttIcon
//                     className="text-white dark:text-red-300"
//                     size={25}
//                   />
//                 </div>

//                 <p className="dark:text-gray-400">Total Project Amount</p>
//               </div>*/}
//             </div>
//             <div className="flex flex-col items-center gap-8 mt-20">
//               <div className="flex flex-col  bg-red-200 dark:bg-red-700/25  text-red-800 w-[70%] h-[200px] rounded-lg border-2 border-red-700 shadow-xl">
//                 <div className="flex justify-between p-5">
//                   <h1 className="text-xl font-bold text-gray-600 dark:text-gray-400">
//                     Pyament History
//                   </h1>

//                   <div className="flex gap-5">
//                     <p className="font-extrabold text-sm">40%</p>
//                     <div className="w-[280px] rounded-full h-2.5 dark:bg-dark-600 bg-gray-200">
//                       <div
//                         className={`bg-red-700 h-2.5 rounded-full transition-all duration-500`}
//                         style={{ width: `40%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="items-center flex justify-end mr-[30px]">
//                   <table className="text-gray-700 dark:text-gray-400">
//                     <thead className="">
//                       <tr>
//                         <th className="px-8 py-1 text-left">Month</th>
//                         <th className="px-8 py-1 text-left">Paid Amount</th>
//                         <th className="px-8 py-1 text-left"> Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       <tr className=" border-b-1 border-gray-500">
//                         <td className="px-8 py-1 text-left">Apr 23</td>
//                         <td className="px-8 py-1 text-left">1,80,000</td>
//                         <td className="px-8 py-1 text-left">Paid</td>
//                       </tr>

//                       <tr className=" border-b-1 border-gray-500">
//                         <td className="px-8 py-1 text-left">Apr 23</td>
//                         <td className="px-8 py-1 text-left">1,80,000</td>
//                         <td className="px-8 py-1 text-left">Paid</td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//               <div className="flex flex-col  bg-red-100/50 dark:bg-red-700/25 text-red-800 w-[70%] h-[200px] rounded-lg border-none shadow-xl">
//                 <div className="flex justify-between p-5">
//                   <h1 className="text-xl font-bold text-gray-600 dark:text-gray-400">
//                     Pyament History
//                   </h1>

//                   <div className="flex gap-5">
//                     <p className="font-extrabold text-sm">70%</p>
//                     <div className="w-[280px] rounded-full h-2.5 dark:bg-dark-600 bg-gray-200">
//                       <div
//                         className={`bg-red-700 h-2.5 rounded-full transition-all duration-500`}
//                         style={{ width: `70%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="items-center flex justify-end mr-[30px]">
//                   <table className="text-gray-700 dark:text-gray-400">
//                     <thead className="">
//                       <tr>
//                         <th className="px-8 py-1 text-left">Month</th>
//                         <th className="px-8 py-1 text-left">Paid Amount</th>
//                         <th className="px-8 py-1 text-left"> Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       <tr className=" border-b-1 border-gray-500">
//                         <td className="px-8 py-1 text-left">Apr 23</td>
//                         <td className="px-8 py-1 text-left">1,80,000</td>
//                         <td className="px-8 py-1 text-left">Paid</td>
//                       </tr>

//                       <tr className=" border-b-1 border-gray-500">
//                         <td className="px-8 py-1 text-left">Apr 23</td>
//                         <td className="px-8 py-1 text-left">1,80,000</td>
//                         <td className="px-8 py-1 text-left">Paid</td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>{" "}
//           </div>
//         )}
//         {activeTab === "mom" && <ClientMom />}
//         {activeTab === "feedback" && (
//           <div>
//            <ClientFeedbacks/>
//           </div>
//         )}
//       </div>
//     </>
//   );
// }

// export default Clients;




import { MailCheck, SquareChartGanttIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { useState } from "react";
import { Eye } from "lucide-react";
import { AiFillProject, AiFillPushpin } from "react-icons/ai";
import { useParams } from "react-router-dom";
import {
  FaAddressCard,
  FaExclamationCircle,
  FaMailBulk,
  FaProjectDiagram,
} from "react-icons/fa";
import PaymentProgressCard from "src/component/graphComponents/ProgressCard";
import ProjectClient from "../Project/ProjectClient";
import Modal from "src/component/Modal";
import AddSalaryForm from "../Employee/Salary/AddSalary";
import ClientMom from "./ClientMOM";
import ClientFeedbacks from "./ClientFeedback";

// ✅ import authstore hook
import { useAuthStore } from "src/stores/authStore";
import { useLocation } from "react-router-dom";
import { apiClient } from "src/services/apiClient";


function Clients() {
  const [activeTab, setActiveTab] = useState("clientProfile");
  // const { id } = useParams(); // here id = client_code
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const client_code = queryParams.get("client_code");
  const token = useAuthStore((state) => state.accessToken);
   const [invoices, setInvoices] = useState([]);
   const navigate = useNavigate();

  useEffect(() => {
  if (!client_code) return;

  const url = `/client/profile/read?client_code=${encodeURIComponent(client_code)}`;
  console.log("Fetching:", url);

  setLoading(true); // start loading

  apiClient.get(`/client/profile/read?client_code=${encodeURIComponent(client_code)}`)
    .then((res) => {
      console.log("API Response:", res.data);
      setClientData(res.data.data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Fetch error:", err);
      setLoading(false);
    });
}, [client_code, token]);


useEffect(() => {
 

  if (client_code && token) {
    apiClient
      .get(
        `/project/invoice/read?client_code=${encodeURIComponent(client_code)}`
      )
      .then((res) => {
        setInvoices(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching invoices", err);
        setLoading(false);
      });
  }
}, [client_code]);


 const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [projects, setProjects] = useState([]);
    useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiClient.get(
          `/project/overview/read?page=1&limit=10&client_code=${clientData.client_code}`
        );
        const result = response.data;
        setProjects(result);
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    if (clientData?.client_code) {
      fetchProjects();
    }
  }, [clientData]);

useEffect(() => {
  console.log("🔥 PROJECTS STATE:", projects);
}, [projects]);



  // Handle search per column
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value.toLowerCase() }));
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Apply filters
  let filteredData = invoices.filter((item) => {
    return Object.keys(filters).every((key) => {
      if (!filters[key]) return true;
      return item.invoice[key]?.toString().toLowerCase().includes(filters[key]);
    });
  });

  // Apply sorting
  if (sortConfig.key) {
    filteredData = [...filteredData].sort((a, b) => {
      const aVal = a.invoice[sortConfig.key];
      const bVal = b.invoice[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }


  if (loading) return <p className="text-gray-500">Loading client...</p>;
  if (!clientData) return <p className="text-red-500">Client not found</p>;

  const tabs = [
    { id: "clientProfile", label: "Client Info" },
    { id: "paymentinfo", label: "Invoice & Payment Details" },
    { id: "mom", label: "Meeting Records" },
    // { id: "feedback", label: "Feedback" },
    // { id: "invoice", label: "Client Invoice" },
  ];

const totalPaidFromInvoices = filteredData.reduce(
  (sum, item) => sum + Number(item.invoice.paid_amount || 0),
  0
);

const totalRaisedFromInvoices = filteredData.reduce(
  (sum, item) => sum + Number(item.invoice.final_amount || 0),
  0
);

console.log("FILTERED DATA:", filteredData);


  return (
    <>
      <div className="text-red-700 text-2xl font-bold mb-5">
        View Client Page
      </div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 flex-grow">
        {activeTab === "clientProfile" && (
          <div>
            <div className="bg-white h-[150%] py-10 px-10 w-full text-gray-600 rounded-xl mt-10">
              <div className="flex justify-between">
                {/* Client Name */}
                <div className="flex flex-col">
                  <p className="text-red-700 font-medium text-xl">
                    <AiFillProject className="inline mr-3" size={25} />
                    Client Name
                  </p>
                  <div className="mt-3 flex flex-col gap-2 h-[100px] w-[200px] bg-blue-100/45 py-6 rounded-lg items-center">
                    <p>{clientData.client_name}</p>
                    {/*<p>{clientData.comm_type}</p>*/}
                  </div>
                </div>

                {/* Company Address */}
                <div className="flex flex-col">
                  <p className="text-red-700 font-medium text-xl">
                    <FaAddressCard className="inline mr-3" size={25} />
                    Company Address
                  </p>
                  <div className="mt-3 flex flex-col gap-2 h-[100px] w-[200px] bg-blue-100/45 py-6 rounded-lg items-center">
                    <p>{clientData.office_address}</p>
                    {/*<p>{clientData.email}</p>*/}
                  </div>
                </div>

                {/* Balance */}
                <div className="flex flex-col">
                  <p className="text-red-700 font-medium text-xl">
                    <FaMailBulk className="inline mr-3" size={25} />
                    Balance Due
                  </p>
                  <div className="mt-3 flex flex-col gap-2 h-[100px] w-[200px] bg-blue-100/45 py-6 rounded-lg items-center">
                    <p>₹ {clientData.balance}</p>
                    {/*<p>Overall Cost: ₹ {clientData.overallcost}</p>*/}
                  </div>
                </div>

                {/* No of Projects */}
                <div className="flex flex-col">
                  <p className="text-red-700 font-medium text-xl">
                    <FaProjectDiagram className="inline mr-3" size={25} />
                    No of Projects
                  </p>
                  <div className="mt-3 flex flex-col gap-2 h-[100px] w-[200px] bg-blue-100/45 py-6 rounded-lg items-center">
                    <p>{clientData.project_count}</p>
                  </div>
                </div>

                <div className="flex flex-col">
                  <p className="text-red-700 font-medium text-xl">
                    <FaProjectDiagram className="inline mr-3" size={25} />
                    Communication Type
                  </p>
                  <div className="mt-3 flex flex-col gap-2 h-[100px] w-[200px] bg-blue-100/45 py-6 rounded-lg items-center">
                    <p>{clientData.comm_type}</p>
                  </div>
                </div>



              </div>
            </div>

            {/* Pass project data to Project component */}
            <div className="mt-10">
              {/*<Project projects={clientData.project} />*/}

<ProjectClient clientCode={clientData.client_code} />


            </div>
          </div>
        )}

        {activeTab === "paymentinfo" && (
  <div>
    {/* Calculate from API data */}
    <div className="flex justify-evenly w-[100%] mt-15">
      {/* Total Project Amount */}
      <div className="flex flex-col gap-5 justify-evenly w-[20%] h-[200px] bg-white rounded-3xl shadow-2xl p-8 dark:bg-gray-800">
        <h1 className="font-medium text-xl text-red-700">
          ₹ {clientData.project?.reduce((sum, proj) => sum + parseFloat(proj.budget || 0), 0)}
        </h1>
        <p className="dark:text-gray-400">Total Project Amount</p>
      </div>

<div className="flex flex-col gap-5 justify-evenly w-[20%] h-[200px] bg-white rounded-3xl shadow-2xl p-8 dark:bg-gray-800">
  <h1 className="font-medium text-xl text-red-700">
    ₹ {totalRaisedFromInvoices}
  </h1>
  <p className="dark:text-gray-400">Total Invoice Raised (based on Milestones)</p>
</div>

<div className="flex flex-col gap-5 justify-evenly w-[20%] h-[200px] bg-white rounded-3xl shadow-2xl p-8 dark:bg-gray-800">
  <h1 className="font-medium text-xl text-red-700">
    ₹ {totalPaidFromInvoices}
  </h1>
  <p className="dark:text-gray-400">Total Paid Amount (based on Milestones)</p>
</div>
      {/* Balance */}
      <div className="flex flex-col gap-5 justify-evenly w-[20%] h-[200px] bg-white rounded-3xl shadow-2xl p-8 dark:bg-gray-800">
        <h1 className="font-medium text-xl text-red-700">
          ₹ {clientData.balance}
        </h1>
        <p className="dark:text-gray-400">Total Balance Amount (based on Milestones)</p>
      </div>
    </div>

{/* Payments List */}
<div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 mt-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Invoice & Milestones
      </h2>

   <table className="w-full text-sm text-left border-collapse">
      <thead className="text-white bg-red-600">
        <tr>
          {[
            { key: "invoice_no", label: "Invoice No" },
            { key: "project_title", label: "Project" },
            { key: "invoice_date", label: "Invoice Date" },
            { key: "final_amount", label: "Final Amount" },
            { key: "paid_amount", label: "Paid" },
            { key: "balance_amount", label: "Balance" },
          ].map((col) => (
            <th
              key={col.key}
              className="p-2 cursor-pointer"
              onClick={() => handleSort(col.key)}
            >
              {col.label}{" "}
              {sortConfig.key === col.key &&
                (sortConfig.direction === "asc" ? "▲" : "▼")}
              <div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="mt-1 w-full px-1 py-0.5 text-xs text-black rounded"
                  onChange={(e) => handleFilterChange(col.key, e.target.value)}
                />
              </div>
            </th>
          ))}
          <th className="p-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <tr
              key={item.invoice.invoice_id}
              className="border-b dark:border-gray-700"
              onDoubleClick={() =>
                navigate(`/payreq_view/${encodeURIComponent(item.invoice.invoice_id)}`)
              }
            >
              <td className="p-2">{item.invoice.invoice_no}</td>
              <td className="p-2">{item.invoice.project_title}</td>
              <td className="p-2">
                {new Date(item.invoice.invoice_date).toLocaleDateString()}
              </td>
              <td className="p-2">₹ {item.invoice.final_amount}</td>
              <td className="p-2">₹ {item.invoice.paid_amount}</td>
              <td className="p-2">₹ {item.invoice.balance_amount}</td>
              <td className="p-2 text-center">
                <button
              onClick={(e) => {
                    e.stopPropagation(); // prevent double-click navigation firing
                    navigate(`/payreq_view/${encodeURIComponent(item.invoice.invoice_id)}`);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye size={18} />
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={8}
              className="p-4 text-center text-gray-500 dark:text-gray-400"
            >
              No invoices found
            </td>
          </tr>
        )}
      </tbody>
    </table> </div>  </div>
)}

        {activeTab === "mom" && <ClientMom />}
        {/*{activeTab === "feedback" && <ClientFeedbacks />}*/}
      </div>
    </>
  );
}

export default Clients;
