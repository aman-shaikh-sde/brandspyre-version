// import {
//   AlertCircle,
//   ArrowRightToLine,
//   Banknote,
//   BanknoteArrowUp,
//   BookCheck,
//   ChartBar,
//   ChartBarIncreasing,
//   Clock,
//   ClockFading,
//   ContactRound,
//   HandCoins,
//   Plus,
//   UserRoundCheck,
//   Users,
//   UserX,
//   UserX2,
// } from "lucide-react";
// import { Bell, Check, X } from "lucide-react";
// import { useMediaQuery } from "./hooks/use-click-outside";
// import { Link } from "react-router";
// import DynamicDoughnutChart from "src/component/graphComponents/DynamicDoughnutChart";
// import KPIBarChart from "src/component/graphComponents/KpiChart";
// import NotificationPanel from "src/component/Notification";
// import { FaAward, FaFileInvoice, FaHandsHelping, FaProjectDiagram, FaUser, FaUserPlus, FaUsers, FaUserSlash, FaUserTie, FaUserTimes } from "react-icons/fa";
// import { useState,useEffect } from "react";

// import { useAuthStore } from "src/stores/authStore";

// import {
//   FaCheckCircle,
//   FaClock,
//   FaExclamationCircle,
//   FaMoneyBillWave,
// } from "react-icons/fa";
// import { AiFillMoneyCollect } from "react-icons/ai";
// import DynamicLineGraph from "src/component/graphComponents/DynamicLineGraph";
// import DynamicPieChart from "src/component/graphComponents/DynamicPieChart";
// import PaymentProgressCard from "src/component/graphComponents/ProgressCard";
// import HrGraphs from "./HommeGraphsPages/HrGraphs";
// import SampleDashboard from "./Employee/SampleDashboard";
// import AccountantDashboard from "./HommeGraphsPages/AccountantDashboard";
// // import EmpDashboard from "./HommeGraphsPages/EmployeeDashboard";
// const Dashboard = () => {
//   const theme = "light";
//   const dougntChartData = [
//     {
//       title: "Present & Absenties",
//       labels: ["Presenties", "Causal Leave", "Sick Leave", "pending req"],
//       values: [65, 5, 10, 20],
//       colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
//     },
//   ];
//   const kpiData = [
//     {
//       name: "Sales Team",
//       Q1: 78,
//       Q2: 85,
//     },
//     {
//       name: "Design Team",
//       Q1: 45,
//       Q2: 88,
//     },
//     {
//       name: "HR Team",
//       Q1: 90,
//       Q2: 84,
//     },
//   ];

//   //notification
//   const [notifications, setNotifications] = useState([
//     {
//       id: 1,
//       date: "15 Jun",
//       status: "🟢",
//       message: "Payroll processed for June (₹8.42L)",
//       isNew: true,
//       read: false,
//     },
//     {
//       id: 2,
//       date: "15 Jun",
//       status: "📄",
//       message: "Payroll processed for June (₹8.42L)",
//       isNew: false,
//       read: true,
//     },
//     {
//       id: 3,
//       date: "15 Jun",
//       status: "🟠",
//       message: "Payroll processed for June (₹8.42L)",
//       isNew: true,
//       read: false,
//     },
//     // ... other notifications
//   ]);

//   const handleDismiss = (id) => {
//     console.log("Notification dismissed:", id);
//   };

//   const handleMarkAsRead = (id) => {
//     console.log("Notification marked as read:", id);
//   };

//   const handleMarkAllAsRead = () => {
//     console.log("All notifications marked as read");
//   };

//   const lineGraphData = {
//     title: "Monthly Sales Data",
//     labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
//     datasets: [
//       { label: "Total Revenue", data: [65, 59, 80, 81, 56, 55] },
//       { label: "Un_Paid", data: [28, 48, 40, 19, 86, 27] },
//       { label: "Payment Pending", data: [45, 25, 60, 91, 76, 35] },
//       { label: "OverDue", data: [35, 55, 30, 71, 66, 45] },
//     ],
//   };

//   // const [hydrated, setHydrated] = useState(false);


//   const pieChartData = [
//     {
//       title: "Project Status",
//       labels: ["Completed", "Pending", "In Progress", "OverDue"],
//       values: [35, 25, 20, 20],
//       colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
//     },
//   ];
//   const accountDougntChartData = [
//     {
//       title: "Income & Expense",
//       labels: ["Income", "Expense"],
//       values: [65, 35],
//       colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
//     },
//   ];
//   const progressItems = [
//     {
//       type: "paid",
//       value: 350,
//       color: "bg-green-500",
//       icon: <FaCheckCircle className="text-green-500 mr-2" />,
//       label: "Paid",
//     },
//     {
//       type: "pending",
//       value: 450,
//       color: "bg-yellow-500",
//       icon: <FaClock className="text-yellow-500 mr-2" />,
//       label: "Pending",
//     },
//     {
//       type: "overdue",
//       value: 200,
//       color: "bg-red-500",
//       icon: <FaExclamationCircle className="text-red-500 mr-2" />,
//       label: "Overdue",
//     },
//   ];

//   const token = useAuthStore((state) => state.accessToken);
//   const userRole = useAuthStore((state) => state.role);



//  const [hydrated, setHydrated] = useState(false);

//   // wait for Zustand persist to hydrate
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       if (useAuthStore.persist.hasHydrated()) {
//         setHydrated(true);
//       } else {
//         const unsub = useAuthStore.persist.onHydrate(() => setHydrated(true));
//         return () => unsub();
//       }
//     }
//   }, []);

//   if (!hydrated) {
//     return <div>Loading...</div>; // wait until state is restored
//   }

//   console.log("AccessToken:", token);
//   console.log("Role:", userRole);

//   return (
//     <>
      
//       {/*<SampleDashboard/>*/}
//       {/*<EmpDashboard/>*/}
//       {/*<HrGraphs/>*/}
//       {/*<AccountantDashboard/>*/}
// {/*
//     {token}

//     {userRole}*/}

//       {userRole === "superadmin" && (
//         <>
//           <SampleDashboard />
//           <HrGraphs />
//           <AccountantDashboard />
//         </>
//       )}

//       {userRole === "admin" && (
//         <>
//           <HrGraphs />
//           <AccountantDashboard />
//         </>
//       )}

//       {userRole !== "superadmin" && userRole !== "admin" && (
//         <SampleDashboard />
//       )}
//     </>
//   );
// };
// export default Dashboard;





// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuthStore } from "src/stores/authStore";
// import SampleDashboard from "./Employee/SampleDashboard";
// import HrGraphs from "./HommeGraphsPages/HrGraphs";
// import AccountantDashboard from "./HommeGraphsPages/AccountantDashboard";
// import { BASE_URL } from "~/constants/api";
// // import { useAuthStore } from "src/stores/authStore";

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const token = useAuthStore((state) => state.accessToken);
//   const userRole = useAuthStore((state) => state.role);
//   const [hydrated, setHydrated] = useState(false);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       if (useAuthStore.persist.hasHydrated()) {
//         setHydrated(true);
//       } else {
//         const unsub = useAuthStore.persist.onHydrate(() =>
//           setHydrated(true)
//         );
//         return () => unsub();
//       }
//     }
//   }, []);

//   // ✅ Validate token by calling backend
//   useEffect(() => {
//     const validateToken = async () => {
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       try {
//         const res = await fetch(`${BASE_URL}/branch/read?page=1&limit=1`, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });

//         if (res.status === 401) {
//           console.log("Invalid/expired token");
//           navigate("/login");
//         }
//       } catch (err) {
//         console.error("Error validating token:", err);
//         navigate("/login");
//       }
//     };

//     if (hydrated) {
//       validateToken();
//     }
//   }, [hydrated, token, navigate]);

//   if (!hydrated) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <>
//       {userRole === "superadmin" && (
//         <>
//           <SampleDashboard />
//           <HrGraphs />
//           <AccountantDashboard />
//         </>
//       )}

//       {userRole === "admin" && (
//         <>
//           <HrGraphs />
//           <AccountantDashboard />
//         </>
//       )}

//       {userRole !== "superadmin" && userRole !== "admin" && (
//         <SampleDashboard />
//       )}
//     </>
//   );
// };

// export default Dashboard;


import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "src/stores/authStore";
import { isPlatformAdminRole } from "src/utils/dashboardPaths";
import { DashboardQuickActions } from "~/components/dashboard/DashboardQuickActions";
import SampleDashboard from "./Employee/SampleDashboard";
import HrGraphs from "./HommeGraphsPages/HrGraphs";
import AccountantDashboard from "./HommeGraphsPages/AccountantDashboard";
import { BASE_URL } from "~/constants/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const hydrated = useAuthStore((state) => state.hydrated);
  const authStatus = useAuthStore((state) => state.authStatus);

  // Token validation and platform admin redirect only after session restoration
  useEffect(() => {
    if (!hydrated || authStatus === "loading") return;

    if (authStatus === "unauthenticated" || (!token && authStatus !== "loading")) {
      navigate("/login");
      return;
    }

    if (isPlatformAdminRole(userRole)) {
      navigate("/admin/dashboard");
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`${BASE_URL}/branch/read?page=1&limit=1`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 401) {
          console.warn("Invalid/expired token → logging out");
          navigate("/login");
        }
      } catch (err) {
        console.error("Error validating token:", err);
        navigate("/login");
      }
    };

    validateToken();
  }, [hydrated, authStatus, token, userRole, navigate]);

  // Show loading screen until session restoration finishes
  if (!hydrated || authStatus === "loading") {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-red-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardQuickActions />

      {userRole === "superadmin" && (
        <>
          <SampleDashboard />
          <HrGraphs />
          <AccountantDashboard />
        </>
      )}

      {userRole === "admin" && (
        <>
          <HrGraphs />
          <AccountantDashboard />
        </>
      )}

      {userRole !== "superadmin" && userRole !== "admin" && <SampleDashboard />}
    </div>
  );
};

export default Dashboard;
