import { useEffect, useState } from "react";
import EmployeeSalary from "../Employee/Salary/Salary";
import Documents from "../Employee/Documents/Documts";
import {
  CalendarCheck,
  CalendarCheck2,
  CalendarClock,
  Clock1,
  Dot,
  MessageSquareText,
  Users,
} from "lucide-react";
import PaymentProgressCard from "src/component/graphComponents/ProgressCard";
import { FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";
import userProfiles from "../../../public/user.avif";
import UserRoles from "../settings/UserRoles";
import MilestoneAccount from "./Milestone/MilestoneAccount";
import Task from "./Task/Task";
import ProjectFiles from "./ProjectFiles";
import ProjectTimesheet from "./ProjectDocuments/ProjectTimesheet";
import { useParams } from "react-router";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import { apiClient } from "src/services/apiClient";
import Modal from "src/component/Modal";
import ProjectMeetingForm from "./Meeting/ProjectMeetingForm";
import { notify } from "~/services/notificationService";
import ClientDocuments from "./ProjectDocuments/ClientDocuments";
import AddPaymentForm from "./Task/AddPaymentForm";

const ProjectAccountOverview = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const handleCloseModal = () => {
    if (isFormDirty) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to close? Any modifications will be lost.")) {
        return;
      }
    }
    setShowMeetingModal(false);
    setIsFormDirty(false);
  };

  const { id } = useParams();
  const accesstoken = useAuthStore((state) => state.accessToken);
  const [paymentRequests, setPaymentRequests] = useState([]);
const [loadingPayments, setLoadingPayments] = useState(false);
       const [hydrated, setHydrated] = useState(false);



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

  useEffect(() => {

if (hydrated && token) {

    const fetchProjectData = async () => {
      try {
        const response = await apiClient.get(
          `/project/overview/profile/read?project_code=${encodeURIComponent(id)}`
        );
        console.log("responseprojecttvieww", response);
        setProjectData(response?.data?.data || []);
      } catch (error) {
        console.error("Error fetching project data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
 } }, [hydrated,token,id]);



useEffect(() => {

  if (hydrated && token) {
    const fetchPaymentRequests = async () => {
      try {
        const response = await apiClient.get(
          `/project/req/read?project_code=${encodeURIComponent(id)}`
        );
        console.log("responseprojecttvieww", response);
        setPaymentRequests(response?.data?.data || []);
      } catch (error) {
        console.error("Error fetching project data:", error);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPaymentRequests();
  }
}, [hydrated,token,id]);





  // Tab configuration
  const tabs = [
    { id: "overview", label: "OverView" },
    { id: "milestone", label: "Milestones" },
    { id: "task", label: "Tasks" },
    // { id: "files", label: "Files" },
    // { id: "timesheet", label: "TimeSheet" },
  ];

  // Default project data if API data is not available
  // const defaultProject = {
  //   status: "inprocess",
  //   progress: 70,
  //   title: "Default Project",
  //   client_code: "#12345",
  //   start_date: "2025-01-01",
  //   end_date: "2025-06-30",
  //   description: "Design a sustainable, climate-responsive residential building that maximizes natural light, ventilation, and energy efficiency.",
  //   handler_by: "Default Team Lead",
  //   budget: "35000.00",
  //   overallcost: "35000.00",
  //   balance: "0.00",
  //   priority: "minor",
  //   type: "commercial",
  //   loc: "Unknown Location"
  // };

  const Project = projectData;
  const Payments = paymentRequests;

  const milestoneList = Project?.milestone || [];
  const milestoneCount = milestoneList.length > 0 ? milestoneList.length : (Project?.milestone_count || 0);

  const activeMilestoneCost = milestoneList.length > 0
    ? milestoneList.reduce((sum: number, m: any) => sum + (parseFloat(m.base_amount) || 0), 0)
    : (parseFloat(Project?.overallcost) || 0);

  const paidMilestones = milestoneList
    .filter((m: any) =>
      m.paystatus === "paid" ||
      m.status === "verified" ||
      m.status === "completed" ||
      ((m.miles_title && m.miles_title.toLowerCase().includes("advance")) && m.status !== "rejected")
    )
    .reduce((sum: number, m: any) => sum + (parseFloat(m.base_amount) || 0), 0);

  const paidRequests = (paymentRequests || [])
    .filter((req: any) => req.status === "paid" || req.status === "completed")
    .reduce((sum: number, req: any) => sum + (parseFloat(req.milestone_amount) || 0), 0);

  const totalPaid = Math.max(paidMilestones, paidRequests);
  const projectBudget = parseFloat(Project?.budget || "0");
  const balance = Math.max(0, projectBudget - activeMilestoneCost);

  const paymentProgress = projectBudget > 0
    ? Math.min(100, Math.round((totalPaid / projectBudget) * 100))
    : 0;



  const progressItems = [
    {
      type: "Completed Tasks",
      value: 650,
      color: "bg-green-600",
      icon: <FaCheckCircle className="text-green-600 mr-2" />,
      label: "Completed Task",
    },
    {
      type: "Inprogress Task",
      value: 150,
      color: "bg-yellow-600",
      icon: <FaClock className="text-yellow-600 mr-2" />,
      label: "Inprogress Task",
    },
    {
      type: "overdue Task",
      value: 200,
      color: "bg-red-600",
      icon: <FaExclamationCircle className="text-red-600 mr-2" />,
      label: "Overdue Task",
    },
    {
      type: "todo Task",
      value: 200,
      color: "bg-blue-600",
      icon: <FaExclamationCircle className="text-blue-600 mr-2" />,
      label: "ToDo Task",
    },
  ];
  const handleMeetingSuccess = () => {
    setShowMeetingModal(false);
    // notify.success("Meeting and Document Created successfully!");
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!Project || Array.isArray(Project) && Project.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500 font-semibold">
        Project not found or failed to load. Please verify your connection or session.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="text-red-700 dark:text-red-700 flex justify-between text-2xl font-bold mb-8 m-6">

        <div>
          {Project.title}
          {"            "}
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-3 mt-2 ${
              Project.status === "completed"
                ? "bg-green-100 text-green-800 dark:bg-green-800/25 dark:text-green-400"
                : Project.status === "rejected"
                  ? "bg-red-100 text-red-800 dark:bg-red-800/25 dark:text-red-400"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/25 dark:text-yellow-400"
            }`}
          >
            <Dot />
            {Project.status}
            {Payments.length}
            {/*Payments*/}
          </div>
        </div>
  
      </div>
<div className="dark:border-gray-700 mb-[60px]">
        <nav className="flex justify-evenly -mb-px">
          {tabs.map((tab, index) => (
            <>
              {index > 0 && (
                <span className="bg-gray-300 dark:bg-red-700 w-[50px] h-[2px] mt-5 items-center"></span>
              )}
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-medium text-sm ${
                  activeTab === tab.id
                    ? "text-gray-200 dark:bg-gray-800 dark:text-red-800 hover:border-gray-300 bg-red-700 w-[120px] h-[40px] rounded-sm"
                    : "border-transparent text-gray-700 hover:text-red-700 dark:bg-gray-600 dark:text-gray-100 hover:border-gray-300 bg-gray-200 w-[120px] h-[40px] rounded-sm"
                }`}
              >
                {tab.label}
              </button>
            </>
          ))}
        </nav>
      </div>
{/*start*/}
      <div className="p-4 flex-grow">
        {activeTab === "overview" && (
          <>
        
            <div className="w-full max-w-full mx-auto p-15 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-4">
               <div>   
              <h2 className="text-2xl font-bold text-gray-600 dark:text-white">
                {Project.title}
              </h2>
                <div className="flex justify-end">
          <button
            onClick={() => setShowMeetingModal(true)}
            className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
          >
            {"Add Advance Payment"} <MessageSquareText className="ml-2" size={15} />
          </button>
        </div>
        </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-100">
                    Client Code:
                  </span>{" "}
                  {Project.client_code}
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-100">
                    Project Code:
                  </span>{" "}
                  {Project.project_code}
                </div>
                <div>
                  <span className="font-medium text-green-700 dark:text-gray-100">
                    <CalendarCheck2 className="inline" size={20} /> Start Date:
                  </span>{" "}
                  {new Date(Project.start_date).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium text-red-700 dark:text-gray-100">
                    <CalendarClock className="inline" size={20} /> End Date:
                  </span>{" "}
                  {new Date(Project.end_date).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-gray-100">
                    Priority:
                  </span>{" "}
                  {Project.priority}
                </div>
                <div>
                  <span className="font-medium text-purple-700 dark:text-gray-100">
                    Type:
                  </span>{" "}
                  {Project.type}
                </div>
                <div>
                  <span className="font-medium text-orange-700 dark:text-gray-100">
                    Location:
                  </span>{" "}
                  {Project.loc}
                </div>
              </div>

              {/* Description */}
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <p>
                  <span className="font-semibold">Project Description:</span>
                  <br />
                  {Project.notes}
                </p>
              </div>

              {/* Budget Information */}
              <div className="grid grid-cols-4 gap-4 text-sm text-gray-700 dark:text-gray-200">
                <div>
                  <span className="font-semibold">Budget:</span> ₹
                  {Project.budget}
                </div>
                <div>
                  <span className="font-semibold">Active Milestone Cost:</span> ₹
                  {activeMilestoneCost}
                </div>
                <div>
                  <span className="font-semibold">Total Paid:</span> ₹
                  {totalPaid}
                </div>
                <div>
                  <span className="font-semibold">Balance:</span> ₹
                  {balance}
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Payment Progress:</span>{" "}
                  {milestoneCount
                    ? `Milestones (${milestoneCount})`
                    : "No milestones yet"}
                </div>
               {/* <div className="flex">
                  <div className="w-[250px] rounded-full h-2.5 dark:bg-dark-600 bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`bg-red-700 h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${Project.progress}%` }}
                    ></div>
                  </div>
                  <div>
                    <span className="text-red-700 ml-3">{70}%</span>
                  </div>
                </div>*/}


                <div className="flex items-center">
  <div className="w-[250px] rounded-full h-2.5 bg-gray-200 dark:bg-gray-700">
    <div
      className="bg-red-700 h-2.5 rounded-full transition-all duration-500"
      style={{ width: `${paymentProgress}%` }}
    ></div>
  </div>
  <div>
    <span className="text-red-700 ml-3">{paymentProgress}%</span>
  </div>
</div>

                <div className="text-blue-400 dark:text-blue-500 italic">
                  {Project.duration_days
                    ? `${Project.duration_days} days duration`
                    : "Duration not specified"}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-700 dark:text-gray-200">
                <div className="mb-5">
                  <span className="font-semibold">Assigned by:</span>{" "}
                  {Project.handler_by}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-200 dark:text-gray-200">
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 sm:mt-0">
                      <span className="font-semibold mr-2">Team Members:</span>
                      <div className="flex -space-x-4">
                        <img
                          className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-800"
                          src={userProfiles}
                          alt="Member 1"
                        />
                        <img
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                          src={userProfiles}
                          alt="Member 2"
                        />
                        <img
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                          src={userProfiles}
                          alt="Member 3"
                        />
                        <span className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-white flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-gray-800">
                          +5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex">
              <PaymentProgressCard
                items={progressItems}
                className="dark:bg-gray-800 w-[600px] mt-10 bg-white p-15"
                title={"Project Status"}
              />
              <div className="w-[45%] max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-6 mt-10">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                  Project Activity
                </h1>
                {Project.milestone && Project.milestone.length > 0 ? (
                  Project.milestone.map((milestone) => (
                    <div
                      key={milestone.milestone_code}
                      className="rounded-lg p-2 dark:bg-gray-700 space-y-2"
                    >
                      <div>
                        <div className="flex">
                          <img
                            className="w-15 h-15 rounded-full border-2 mr-2 -ml-5 border-white dark:border-gray-800"
                            src={userProfiles}
                            alt="Member"
                          />
                          <div className="w-[90%] flex justify-between items-center">
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                              Milestone:{" "}
                              <span className="font-semibold">
                                {milestone.miles_title}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(milestone.created_on).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="ml-10 -mt-4">
                          <div className="text-xs font-bold text-gray-100 text-center flex justify-center rounded bg-red-700 w-[70px] h-[20px]">
                            <p className="mt-0.5">Active</p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Deadline:{" "}
                            <span className="font-semibold text-red-500">
                              {new Date(
                                milestone.end_date
                              ).toLocaleDateString()}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Status:{" "}
                            <span className="font-semibold">
                              {milestone.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg p-2 dark:bg-gray-700 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      No milestones available for this project.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Modal
              isVisible={showMeetingModal}
              className="w-full md:w-[800px]"
              onClose={handleCloseModal}
              title="Add Payment Request"
              closeOnOutsideClick={false}
            >
              <AddPaymentForm
                project={projectData}
                setIsFormDirty={setIsFormDirty}
                onSuccess={handleMeetingSuccess}
                onCancel={handleCloseModal}
              />
            </Modal>
          </>
        )}

        {activeTab === "milestone" && (
          <div>
            <MilestoneAccount projectData={Project} />
          </div>
        )}

        {activeTab === "task" && (
          <div>
            <Task projectData={Project} />
          </div>
        )}

        {/*{activeTab === "files" && (
          <div>
            <ProjectFiles projectData={Project} />
          </div>
        )}

        {activeTab === "timesheet" && (
          <div>
            <ProjectTimesheet projectData={Project} />
          </div>
        )}*/}
{/*end*/}
      </div>
    </div>
  );
};

export default ProjectAccountOverview;
