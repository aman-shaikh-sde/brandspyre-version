
import { apiClient } from "src/services/apiClient";
import {
  Code,
  Delete,
  Dot,
  LayoutList,
  LogOut,
  ShieldUser,
  SquareKanban,
  SquarePen,
  Trash2Icon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import { useNavigate, useParams } from "react-router";
import userImage from "../../public/images.jpeg";
import {
  FaCriticalRole,
  FaProjectDiagram,
  FaUsers,
  FaUsersCog,
  FaUsersSlash,
} from "react-icons/fa";
import { AiOutlineNumber } from "react-icons/ai";
import Modal from "src/component/Modal";
import CreateTeamMembersForm from "./Team/TeamMembers/CreateTeamMembersForm";
import { notify } from "~/services/notificationService";
import { CgTrashEmpty } from "react-icons/cg";
import EditBranchForm from "./Branch/EditFormData";
import EditTeamMemberForm from "./Team/TeamMembers/EditTeamMemberForm";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import LeedFeedbackManagement from "./Team/LeedFeedbackManagement";

function Team() {
  const { id } = useParams();
  const team_id = decodeURIComponent(id);
  const accesstoken = useAuthStore((state) => state.accessToken);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const getTeamProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/teams/read/profile?team_id=${team_id}`
      );
      setTeamData(response.data.data);
      console.log("Team data:", response.data.data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching team data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
    getTeamProfile();
  }
  }, [hydrated,token]);

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 text-xl">Loading team data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="min-h-screen dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 text-xl">No team data found</div>
      </div>
    );
  }
  const handleDelete = (member) => {
    console.log("memberselecteddis", member);
    setSelectedMember(member);
    setShowDeleteModal(true);
  };
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Branch added successfully!");
    getTeamProfile();
  };

  const handleEditBranch = (member) => {
    console.log("memberselecteddis", member);
    setSelectedMember(member);
    setShowEditModal(true);
  };
  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Branch updated successfully!");

    getTeamProfile();
  };
  const handleDeleteSubmit = async () => {
    const deleteId = selectedMember.id;
    console.log("seeelectdeletedid", deleteId);
    const deleted = {
      userData: {
        team_id: selectedMember.team_id,
        branchcode: selectedMember.branchcode,
        staff_id: selectedMember.staff_id,
      },
    };

    console.log("seelctdattaaa", deleted);
    try {
      setLoading(true);
      const response = await apiClient.delete(
        `/members/delete/${deleteId}`,
        {
          data: deleted,
        }
      );

      if (response?.status === 201) {
        setShowDeleteModal(false);
        notify.success("Team Member deleted successfully!");
        getTeamProfile();
      }
    } catch (error) {
      console.error("Error deleting branch", error);
      notify.error("Failed to delete Team Member");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 ">
        <div className="mb-10">
          <div className="flex justify-between w-full">
            <div className="text-red-600 text-2xl font-bold mb-6">
              Team Overview
            </div>
            <div className="flex gap-5">
              <div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-3 py-2.5"
                >
                  + Add New Member
                </button>
              </div>
              <div>
                <button
                  className="text-gray-500 bg-gray-200 px-3 py-1.5 rounded-lg"
                  onClick={() => navigate(-1)}
                >
                  <LogOut className="inline rotate-180 text-gray-500 mr-3" />
                  Go Back
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
<div className="bg-white dark:bg-gray-800 rounded-xl w-[100%] shadow-lg p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Team Image Placeholder */}
                {/* <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div> */}

                <div className="flex-2">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    <span className="bg-red-100 dark:bg-gray-700 p-2 rounded-full mr-3 md:w-auto text-red-700 dark:text-red-400">
                      {" "}
                      <FaProjectDiagram
                        className="text-red-700 dark:text-red-400 inline"
                        size={22}
                      />
                    </span>
                    {teamData.team_name}
                  </h1>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <AiOutlineNumber className="inline" /> Branch Code
                      </p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {teamData.branchcode}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <ShieldUser className="inline" /> Team Lead
                      </p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {teamData.team_lead}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <FaUsers className="inline" /> Team ID
                      </p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {teamData.team_id}
                      </p>
                    </div>
                  </div>
                </div>

{/*                <div className="bg-red-100 dark:bg-gray-700 p-4 rounded-lg w-full md:w-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <SquareKanban className="inline" size={15} /> Assigned
                      </p>
                      <p className="text-xl font-bold text-red-700 dark:text-red-400">
                        3 Projects
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <LayoutList className="inline" size={15} /> Tasks
                      </p>
                      <p className="text-xl font-bold text-red-700 dark:text-red-400">
                        18 Tasks
                      </p>
                    </div>
                  </div>
                </div>*/}
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        {teamData.members.length > 0 ? (
          // <div>
          //   <div className="text-red-600 text-2xl font-bold mb-10 text-center ">
          //     Team Members
          //   </div>
          //   <div className=" md:w-[1200px] lg:w-[1500px]">
          //     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8 justify-center">
          //       {teamData.members.map((member, index) => (
          //         <div
          //           key={index}
          //           className="rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 bg-white dark:bg-gray-800"
          //         >
          //           <div className="p-8">
          //             <div className="flex flex-col mb-6">
          //               <div className="flex justify-between">
          //                 <button
          //                   onClick={() => handleDelete(member)}
          //                   disabled={member.role === "lead"}
          //                   title={
          //                     member.role === "lead"
          //                       ? "Lead cannot be deleted"
          //                       : "Delete member"
          //                   }
          //                 >
          //                   <Trash2Icon
          //                     className={`text-gray-500 ${member.role !== "lead" ? "hover:text-red-800 cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          //                   />
          //                 </button>
          //                 <button onClick={() => handleEditBranch(member)}>
          //                   <SquarePen className="text-gray-500 hover:text-red-800" />
          //                 </button>
          //               </div>
          //               {/* Member Image Placeholder */}
          //               <div className="w-30 h-30 rounded-full bg-gray-200 ml-15 dark:bg-gray-700 flex items-center justify-center border-4  border-red-700 dark:border-red-800">
          //                 {/* <svg
          //             className="w-12 h-12 text-gray-400 dark:text-gray-500"
          //             fill="none"
          //             stroke="currentColor"
          //             viewBox="0 0 24 24"
          //             xmlns="http://www.w3.org/2000/svg"
          //           >
          //             <path
          //               strokeLinecap="round"
          //               strokeLinejoin="round"
          //               strokeWidth={2}
          //               d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          //             />
          //           </svg> */}
          //                 <img
          //                   src={userImage}
          //                   className="w-30 h-28 rounded-full "
          //                 />
          //               </div>
          //               <div className="text-center mt-4">
          //                 <h3 className="text-xl font-bold text-gray-800 dark:text-white">
          //                   {member.staff_name}
          //                 </h3>
          //                 <p className="text-sm text-red-700 dark:text-red-500 flex justify-center mr-6 mt-3 gap-3">
          //                   <FaCriticalRole />{" "}
          //                   {member.role.charAt(0).toUpperCase() +
          //                     member.role.slice(1)}
          //                 </p>
          //               </div>
          //             </div>

          //             <div className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
          //               <div className="flex justify-between mb-2">
          //                 <span className="text-sm text-gray-600 dark:text-gray-300">
          //                   Department:
          //                 </span>
          //                 <span className="font-medium text-gray-800 dark:text-white ml-3">
          //                   {member.department.charAt(0).toUpperCase() +
          //                     member.department.slice(1)}
          //                 </span>
          //               </div>
          //               <div className="flex justify-between mb-2">
          //                 <span className="text-sm text-gray-600 dark:text-gray-300">
          //                   Designation:
          //                 </span>
          //                 <span className="font-medium text-gray-800 dark:text-white text-wrap ml-3">
          //                   {member.designation !== null
          //                     ? member.designation.charAt(0).toUpperCase() +
          //                       member.designation.slice(1)
          //                     : "No Designation"}
          //                 </span>
          //               </div>
          //               <div className="flex justify-between">
          //                 <span className="text-sm text-gray-600 dark:text-gray-300">
          //                   Status:
          //                 </span>
          //                 <span
          //                   className={`font-medium  px-1 rounded-3xl ${
          //                     member.status === "active"
          //                       ? "text-green-800 bg-green-100 dark:text-green-400"
          //                       : "text-red-600 dark:text-red-400 bg-red-100"
          //                   }`}
          //                 >
          //                   <Dot className="inline" />
          //                   {member.status}
          //                 </span>
          //               </div>
          //             </div>

          //             <div className="mt-4">
          //               <p className="text-sm mb-1 text-gray-600 dark:text-gray-300">
          //                 <span className="font-medium">Email:</span>{" "}
          //                 {member.staff_name_email}
          //               </p>
          //               <p className="text-sm text-gray-600 dark:text-gray-300">
          //                 <span className="font-medium">Joined:</span>{" "}
          //                 {new Date(member.joined_on).toLocaleDateString()}
          //               </p>
          //             </div>
          //           </div>
          //         </div>
          //       ))}
          //     </div>
          //   </div>
          // </div>
          <div>
   
  <div className="text-red-600 text-2xl font-bold mb-10 text-center">
    Team Members
  </div>
  <div className="w-full max-w-6xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
      {teamData.members.map((member, index) => (
        <div
          key={index}
          className="rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 bg-white dark:bg-gray-800 w-full max-w-sm mx-auto"
        >
          <div className="p-6">
            <div className="flex flex-col items-center mb-4">
              <div className="flex justify-between w-full mb-4">
                <button
                  onClick={() => handleDelete(member)}
                  disabled={member.role === "lead"}
                  title={
                    member.role === "lead"
                      ? "Lead cannot be deleted"
                      : "Delete member"
                  }
                >
                  <Trash2Icon
                    className={`text-gray-500 ${
                      member.role !== "lead"
                        ? "hover:text-red-800 cursor-pointer"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  />
                </button>
                <button onClick={() => handleEditBranch(member)}>
                  <SquarePen className="text-gray-500 hover:text-red-800" />
                </button>
              </div>
              
              {/* Member Image */}
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-red-700 dark:border-red-800 mb-3">
                <img
                  src={userImage}
                  className="w-full h-full rounded-full object-cover"
                  alt="Member"
                />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  {member.staff_name}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-500 flex items-center justify-center gap-1 mt-1">
                  <FaCriticalRole />
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </p>
              </div>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300">Department:</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {member.department.charAt(0).toUpperCase() +
                    member.department.slice(1)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300">Designation:</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {member.designation !== null
                    ? member.designation.charAt(0).toUpperCase() +
                      member.designation.slice(1)
                    : "No Designation"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Status:</span>
                <span
                  className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                    member.status === "active"
                      ? "text-green-800 bg-green-100 dark:text-green-400 dark:bg-green-900/50"
                      : "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50"
                  }`}
                >
                  <Dot className="inline" />
                  {member.status}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p className="truncate">
                <span className="font-medium">Email:</span> {member.staff_name_email}
              </p>
              <p>
                <span className="font-medium">Joined:</span>{" "}
                {new Date(member.joined_on).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
         <LeedFeedbackManagement leed={teamData}/>
</div>

        ) : (
          <div className="flex gap-5 justify-center mt-40">
            <span className="text-gray-500">
              <FaUsersSlash size={35} />
            </span>{" "}
            <h1 className="text-lg text-gray-500">
              No team members assigned for this team
            </h1>
          </div>
        )}
      </div>
      <Modal
        isVisible={showCreateModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowCreateModal(false)}
        title="Add New Member"
      >
        <CreateTeamMembersForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
          team={teamData}
        />
      </Modal>

      <Modal
        isVisible={showEditModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowEditModal(false)}
        title="Edit Team Member"
      >
        <EditTeamMemberForm
          member={selectedMember}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      <Modal
        isVisible={showDeleteModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowDeleteModal(false)}
        title="Delete Team Member"
      >
   
        <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Are you sure you want to delete this member? This action cannot be
              undone.
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
              onClick={handleDeleteSubmit}
              disabled={loading}
            >
              {loading ? <ButtonLoader /> : "Delete Team"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Team;
