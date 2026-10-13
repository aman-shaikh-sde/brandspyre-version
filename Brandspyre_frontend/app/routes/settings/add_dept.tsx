// import { apiClient } from "src/services/apiClient";
// import { Edit, Key, Plus, Trash2 } from "lucide-react";
// import { useEffect, useState } from "react";
// import toast, { Toaster } from "react-hot-toast";
// import Modal from "src/component/Modal";
// import { BASE_URL } from "~/constants/api";
// import Cam from "../Cam";
// import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
// import { useAuthStore } from "src/stores/authStore";

// export default function AccessRole() {
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [branch, setBranch] = useState([]);
//   const [errors, setErrors] = useState(null);
//   const [role, setRole] = useState([]);
//   const [currentRole, setCurrentRole] = useState(null);
//   const [permissions, setPermissions] = useState(null);
//   const [roleToDelete, setRoleToDelete] = useState(null);
//   const [formData, setFormData] = useState({
//     branchcode: "",
//     role: "",

//   });
//   const [deleteData, setDeleteData] = useState({
//     branchid: "",
//     roleid: "",
//     notes: "",
//     userId: "GK123",
//   });
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const token = useAuthStore((state) => state.accessToken);
//   const getBranch = async () => {
//     try {
//       const url = `/branch/read?status=active`;
//       const response = await apiClient.get(url, {
//
//       });
//       console.log("response", response?.data);
//       setBranch(response?.data || []);
//     } catch (error) {
//       console.log("error in fetch barachlist", error);
//     }
//   };

//   useEffect(() => {
//     getBranch();
//   }, []);
//   const getRole = async () => {
//     try {
//       const response = await apiClient.get(`/setting/read`, {
//
//       });
//       console.log("userole responsee", response?.data);
//       setRole(response?.data);
//     } catch (error) {
//       console.log("error in fetch user role", error);
//     }
//   };
//   useEffect(() => {
//     getRole();
//   }, []);
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };
//   const handleDeleteChange = (e) => {
//     const { name, value } = e.target;

//     setDeleteData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };
//   const handleAddRoleSubmit = async (e) => {
//     setErrors(null);
//     e.preventDefault();

//     try {
//       setLoading(true);
//       console.log("addroledata", formData);
//       const url = `/setting/create`;
//       const response = await apiClient.post(url, formData, {
//
//       });
//       if (response.status == 201) {
//         setShowAddModal(false);
//         notify.success("Add Role Successfully!", {
//           style: {
//             border: "1px solid #2b6cb0",
//             padding: "14px",
//             width: "900px",
//             color: "#2b6cb0",
//           },
//           iconTheme: {
//             primary: "#2b6cb0",
//             secondary: "#FFFAEE",
//           },
//         });
//       }
//       setLoading(false);
//       getRole();
//       setFormData({
//         branchId: "",
//         role: "",
//         userId: "",
//       });
//     } catch (error) {
//       console.log("error in Add role", error?.response?.data?.error);
//       setErrors(error?.response?.data?.error);
//       setShowAddModal(true);
//       notify.error(`${errors} Error in add role`, {
//         style: {
//           border: "1px solid  rgb(185 28 28)",
//           padding: "14px",
//           width: "900px",
//           color: " rgb(185 28 28)",
//         },
//         iconTheme: {
//           primary: " rgb(185 28 28)",
//           secondary: "#FFFAEE",
//         },
//       });
//       setErrors(null);
//       setLoading(false);
//     }
//   };

//   const handleRoleSelect = (roleItem) => {
//     setCurrentRole(roleItem);
//     const {
//       id,
//       branch_id,
//       role,
//       create_datetime,
//       last_update_datetime,
//       ...perms
//     } = roleItem;
//     console.log("errorrsetdeletee", id, branch_id);
//     setPermissions(perms);
//   };

//   const handlePermissionChange = (category, field, value) => {
//     setPermissions((prev) => ({
//       ...prev,
//       [category]: {
//         ...prev[category],
//         [field]: value,
//       },
//     }));
//   };

//   const handleUpdatePermissions = async () => {
//     if (!currentRole) {
//       notify.error("Please select a role and enter User ID");
//       return;
//     }

//     try {
//       setLoading(true);
//       const url = `/setting/edit/${currentRole.id}`;
//       const payload = {
//         branchcode: currentRole.branchcode.toString(),
//         // roleid: currentRole.id.toString(),
//         data: permissions,
//         // userId: formData.userId,
//       };

//       console.log("Sending payload:", payload);

//       const response = await apiClient.put(url, payload,{
//         headers:{Authorization:`Bearer ${token}`}
//       });

//       if (response.status === 200) {
//         notify.success("Access permission updated Successfully!", {
//           style: {
//             border: "1px solid #2b6cb0",
//             padding: "14px",
//             width: "900px",
//             color: "#2b6cb0",
//           },
//           iconTheme: {
//             primary: "#2b6cb0",
//             secondary: "#FFFAEE",
//           },
//         });
//         getRole(); // Refresh the role list
//       }
//     } catch (error) {
//       console.log("Error updating permissions:", error);
//       notify.error(error?.response?.data?.error || "Error in add role", {
//         style: {
//           border: "1px solid  rgb(185 28 28)",
//           padding: "14px",
//           width: "900px",
//           color: " rgb(185 28 28)",
//         },
//         iconTheme: {
//           primary: " rgb(185 28 28)",
//           secondary: "#FFFAEE",
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderPermissionCheckboxes = (category) => {
//     if (!permissions || !permissions[category]) return null;
//     return (
//       <div className="flex flex-col gap-4 pl-9">
//         {Object.entries(permissions[category]).map(([key, value]) => (
//           <label key={key} className="flex items-center gap-3 cursor-pointer">
//             <input
//               type="checkbox"
//               checked={value}
//               onChange={(e) =>
//                 handlePermissionChange(category, key, e.target.checked)
//               }
//               className="h-4 w-4 rounded border-gray-300 dark:border-gray-600
//                 bg-white dark:bg-gray-700
//                 checked:bg-red-700 dark:checked:bg-red-600
//                 focus:ring-red-700 dark:focus:ring-red-600
//                 text-red-700 dark:text-red-600
//                 transition-colors"
//             />
//             <span className="text-sm text-gray-600 dark:text-gray-300">
//               {key === "all"
//                 ? `All ${category}`
//                 : `${key.charAt(0).toUpperCase() + key.slice(1)} ${category}`}
//             </span>
//           </label>
//         ))}
//       </div>
//     );
//   };

//   const renderPermissionSection = (category, label) => {
//     return (
//       <>
//         <div className="flex gap-3 items-center">
//           <Key className="text-gray-600 dark:text-gray-400" size={20} />
//           <p className="text-gray-600 dark:text-gray-300">{label}:</p>
//         </div>
//         {renderPermissionCheckboxes(category)}
//       </>
//     );
//   };
//   const handleDeleteClick = (roleItem) => {
//     console.log("deleterolited", roleItem);
//     setRoleToDelete(roleItem);
//     setShowDeleteModal(true);
//   };

//   const handleDeleteRole = async () => {
//     if (!roleToDelete) return;
//     const payload = {
//       branchcode: roleToDelete.branchcode.toString(),
//       notes: deleteData.notes,

//     };
//     console.log("deletepayload", payload);
//     try {
//       setLoading(true);

//       const url = `/setting/delete/${roleToDelete.id}`;
//       console.log("deleteurlll", url);
//       const response = await apiClient.delete(url, {
//         data: payload,
//
//       });

//       if (response.status === 200) {
//         notify.success("User Role Deleted Successfully!", {
//           style: {
//             border: "1px solid #2b6cb0",
//             padding: "14px",
//             width: "900px",
//             color: "#2b6cb0",
//           },
//           iconTheme: {
//             primary: "#2b6cb0",
//             secondary: "#FFFAEE",
//           },
//         });
//         getRole();
//         setRoleToDelete(null);
//         setDeleteData([]);
//         if (currentRole?.id === roleToDelete.id) {
//           setCurrentRole(null); // Clear current role if it was deleted
//           setPermissions(null);
//         }
//       }
//     } catch (error) {
//       console.log("Error deleting role:", error);
//       notify.error(error?.response?.data?.error || `Error in deleting role`, {
//         style: {
//           border: "1px solid  rgb(185 28 28)",
//           padding: "14px",
//           width: "900px",
//           color: " rgb(185 28 28)",
//         },
//         iconTheme: {
//           primary: " rgb(185 28 28)",
//           secondary: "#FFFAEE",
//         },
//       });
//     } finally {
//       setLoading(false);
//       setShowDeleteModal(false);
//       setRoleToDelete(null);
//     }
//   };
//   const renderDeleteModal = () => (
//     <Modal
//       isVisible={showDeleteModal}
//       onClose={() => setShowDeleteModal(false)}
//       title="Confirm Delete"
//     >
//       <div className="p-4">
//         <p className="text-gray-700 dark:text-gray-300">
//           Are you sure you want to delete the role "{roleToDelete?.role}"?
//         </p>

//         <div className="flex flex-col py-2 text-left mt-4">
//           <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
//             Notes (required for deletion)
//           </label>
//           <input
//             name="notes"
//             value={deleteData.notes}
//             onChange={handleDeleteChange}
//             className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-3 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//             type="text"
//             placeholder="Enter Your Notes Here"
//             required
//           />
//         </div>
//         <div className="flex justify-end gap-3 mt-6">
//           <button
//             type="button"
//             onClick={() => setShowDeleteModal(false)}
//             className="px-4 py-2 bg-[var(--color-secondary)] hover:[var(--color-hover-secondary)] hover-effect text-gray-800 dark:text-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
//             disabled={loading}
//           >
//             Cancel
//           </button>
//           <button
//             type="button"
//             onClick={handleDeleteRole}
//             className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white rounded hover:bg-gradient-to-b hover-effect transition"
//             disabled={loading}
//           >
//             {loading ? <ButtonLoader /> : "Delete Role"}
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );

//   // const handleRoleDelte = async (rol) => {
//   //   setShowDeleteModal(true);
//   //   console.log("roledeleeee>>>", rol?.branch_id, rol.id);
//   //   const payload = {
//   //     branchid: rol?.branch_id,
//   //     roleid: rol?.id,
//   //     userId: "GK123",
//   //   };

//   //   setDeleteData({
//   //     branchid: rol?.branch_id,
//   //     notes: "",
//   //     roleid: rol?.id,
//   //     userId: "GK123",
//   //   });
//   //   console.log("roleedlee", rol);
//   // };

//   // const handleDeteleSubmit = async () => {
//   //   try {
//   //     console.log("deletingddd");
//   //     const url = `/setting/delete/${deleteData.roleid}`;
//   //     const response = await apiClient.delete(url, deleteData);
//   //     console.log("deletededrole", url, response);
//   //   } catch (error) {
//   //     console.log("error in delete Role", error);
//   //   }
//   // };
//   return (
//     <div className="p-4">
//       <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
//         <Toaster position="top-center" reverseOrder={false} />
//         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full lg:w-[50%]">
//           <div className="flex justify-between items-center">
//             <h1 className="text-lg font-bold text-gray-600 dark:text-gray-300">
//               Role
//             </h1>
//             <button
//               className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600 flex items-center gap-1"
//               onClick={() => setShowAddModal(true)}
//             >
//               <Plus className="inline" size={20} />
//               <span>Add Role</span>
//             </button>
//           </div>

//           {/* <div className="flex flex-col gap-2 mt-4">
//             <div className="flex justify-between items-center hover:bg-gray-200 dark:hover:bg-gray-700 py-3 px-3  transition-colors">
//             {role.map((rol,index)=>(
//                  <ul key={index}>

//               <li className="text-gray-600 dark:text-gray-300">{rol.role}</li>
//  </ul>
//               ))}

//               <div className="flex space-x-4 text-gray-600 dark:text-gray-400">
//                 <Edit
//                   className="inline hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
//                   size={20}
//                 />
//                 <Trash2
//                   className="inline hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
//                   size={20}
//                 />
//               </div>
//             </div>

//           </div> */}
//           <div className="flex flex-col gap-1 mt-4">
//             <ul>
//               {role.map((rol) => (
//                 <li
//                   key={rol.id}
//                   className="flex justify-between items-center hover:bg-gray-200 dark:hover:bg-gray-700 py-3 px-3 transition-colors"
//                 >
//                   <span className="text-gray-600 dark:text-gray-300">
//                     {rol.role}
//                   </span>
//                   <div className="flex space-x-4 text-gray-600 dark:text-gray-400">
//                     <button onClick={() => handleRoleSelect(rol)}>
//                       <Edit
//                         className="inline hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
//                         size={20}
//                       />
//                     </button>
//                     <Trash2
//                       className="inline hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
//                       onClick={() => handleDeleteClick(rol)}
//                       size={20}
//                     />
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//         <div></div>

//         {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full lg:w-[50%]">
//           <h1 className="text-lg font-bold text-gray-600 dark:text-gray-300">
//             Permission: Admin
//           </h1>

//           <div className="flex flex-col gap-6 mt-4">
//             <div className="flex gap-3 items-center">
//               <Key className="text-gray-600 dark:text-gray-400" size={20} />
//               <p className="text-gray-600 dark:text-gray-300">
//                 Set Project Permission:
//               </p>
//             </div>

//             <div className="flex flex-col gap-4 pl-9">
//               <label className="flex items-center gap-3 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   className="h-4 w-4 rounded border-gray-300 dark:border-gray-600
//                     bg-white dark:bg-gray-700
//                     checked:bg-red-700 dark:checked:bg-red-600
//                     focus:ring-red-700 dark:focus:ring-red-600
//                     text-red-700 dark:text-red-600
//                     transition-colors"
//                 />
//                 <span className="text-sm text-gray-600 dark:text-gray-300">
//                   Create Project
//                 </span>
//               </label>

//               <label className="flex items-center gap-3 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   className="h-4 w-4 rounded border-gray-300 dark:border-gray-600
//                     bg-white dark:bg-gray-700
//                     checked:bg-red-700 dark:checked:bg-red-600
//                     focus:ring-red-700 dark:focus:ring-red-600
//                     text-red-700 dark:text-red-600
//                     transition-colors"
//                 />
//                 <span className="text-sm text-gray-600 dark:text-gray-300">
//                   View Project
//                 </span>
//               </label>

//               <label className="flex items-center gap-3 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   className="h-4 w-4 rounded border-gray-300 dark:border-gray-600
//                     bg-white dark:bg-gray-700
//                     checked:bg-red-700 dark:checked:bg-red-600
//                     focus:ring-red-700 dark:focus:ring-red-600
//                     text-red-700 dark:text-red-600
//                     transition-colors"
//                 />
//                 <span className="text-sm text-gray-600 dark:text-gray-300">
//                   Edit Project
//                 </span>
//               </label>

//               <label className="flex items-center gap-3 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   className="h-4 w-4 rounded border-gray-300 dark:border-gray-600
//                     bg-white dark:bg-gray-700
//                     checked:bg-red-700 dark:checked:bg-red-600
//                     focus:ring-red-700 dark:focus:ring-red-600
//                     text-red-700 dark:text-red-600
//                     transition-colors"
//                 />
//                 <span className="text-sm text-gray-600 dark:text-gray-300">
//                   Delete Project
//                 </span>
//               </label>
//             </div>
//           </div>
//         </div>

//       </div> */}
//         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full lg:w-[50%]">
//           <div className="flex justify-between items-center">
//             <h1 className="text-lg font-bold text-gray-600 dark:text-gray-300">
//               Permissions: {currentRole?.role || "Select a role"}
//             </h1>
//             {currentRole && (
//               <button
//                 onClick={handleUpdatePermissions}
//                 className="px-3 py-1 bg-[var(--color-primary)] text-sm hover:bg-[var(--color-hover)] text-white rounded hover:bg-gradient-to-b hover-effect transition"
//                 disabled={loading}
//               >
//                 {loading ? <ButtonLoader /> : "Save Permissions"}
//               </button>
//             )}
//           </div>

//           {currentRole ? (
//             <div className="flex flex-col gap-6 mt-4">
//               {renderPermissionSection("project", "Project Permissions")}
//               {renderPermissionSection("task", "Task Permissions")}
//               {renderPermissionSection("milestone", "Milestone Permissions")}
//               {renderPermissionSection(
//                 "teammembers",
//                 "Team Members Permissions"
//               )}
//               {renderPermissionSection("branches", "Branches Permissions")}
//               {renderPermissionSection("invoices", "Invoices Permissions")}
//               {renderPermissionSection("campaign", "Campaign Permissions")}
//               {renderPermissionSection("leads", "Leads Permissions")}
//               {renderPermissionSection("client", "Client Permissions")}

//               <div className="flex flex-col py-2 text-left">
//                 <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
//                   User ID (required for update)
//                 </label>
//                 <input
//                   name="userId"
//                   value={formData.userId}
//                   onChange={handleChange}
//                   className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-3 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//                   type="text"
//                   placeholder="Enter user ID"
//                   required
//                 />
//               </div>
//             </div>
//           ) : (
//             <div className="mt-4 text-gray-500 dark:text-gray-400">
//               Please select a role to view and edit permissions
//             </div>
//           )}
//         </div>
//       </div>

//       <Modal
//         isVisible={showAddModal}
//         onClose={() => setShowAddModal(false)}
//         title="Add Role Form"
//       >
//         <Toaster position="top-center" reverseOrder={false} />

//         <div className="flex flex-col py-2 text-left">
//           <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
//             Select Branch Code
//           </label>
//           <select
//             name="branchcode"
//             value={formData.branchcode}
//             onChange={handleChange}
//             className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-3 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//             required
//           >
//             {branch.map((branc, index) => (
//               <option value={branc.branchcode}>{branc.branchcode}</option>
//             ))}
//           </select>
//         </div>

//         <div className="flex flex-col py-2 text-left">
//           <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
//             Admin Role
//           </label>
//           <input
//             name="role"
//             value={formData.role}
//             onChange={handleChange}
//             className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-3 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//             type="text"
//             placeholder="Admin Role"
//             required
//           />
//         </div>

//         <div className="flex justify-end gap-3 mt-6">
//           <button
//             type="button"
//             onClick={() => setShowAddModal(false)}
//             className="px-4 py-2 bg-[var(--color-secondary)] hover:[var(--color-hover-secondary)] hover-effect text-gray-800 dark:text-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
//             disabled={loading}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)]  text-white rounded hover:bg-gradient-to-b hover-effect transition"
//             disabled={loading}
//             onClick={handleAddRoleSubmit}
//           >
//             {loading ? <ButtonLoader /> : "Create Role"}
//           </button>
//         </div>
//       </Modal>
//       {/* <Modal
//         isVisible={showDeleteModal}
//         className="w-200"
//         title="Are You Want to Delete this role?"
//         onClose={() => setShowDeleteModal(false)}
//       >
//         <form onSubmit={handleDeteleSubmit}>
//           <div className="flex flex-col py-2 text-left">
//             <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
//               Notes:
//             </label>
//             <input
//               name="notes"
//               value={deleteData.notes}
//               onChange={handleDeleteChange}
//               className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-3 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//               type="text"
//               placeholder="Notes"
//               required
//             />
//           </div>
//           <div className="flex justify-end gap-3 mt-6">
//             <button
//               type="button"
//               onClick={() => setShowDeleteModal(false)}
//               className="px-4 py-2 bg-[var(--color-secondary)] hover:[var(--color-hover-secondary)] hover-effect text-gray-800 dark:text-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)]  text-white rounded hover:bg-gradient-to-b hover-effect transition"
//               disabled={loading}
//             >
//               {loading ? "Creating..." : "Create Branch"}
//             </button>
//           </div>
//         </form>
//       </Modal> */}
//       {renderDeleteModal()}
//     </div>
//   );
// }
import { apiClient } from "src/services/apiClient";
import { Edit, Hash, Key, Plus, Trash2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { notify } from "~/services/notificationService";
import Modal from "src/component/Modal";
import { BASE_URL } from "~/constants/api";

import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";

export default function AccessRole() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [branch, setBranch] = useState([]);
  const [errors, setErrors] = useState(null);
  const [role, setRole] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    branchcode: "",
    role: "",
  });
  const [deleteData, setDeleteData] = useState({
    branchid: "",
    roleid: "",
    notes: "",
    userId: "GK123",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.accessToken);
const branchCodeOption=useBranchStore((state)=>state.branchCodeOptions)
// const roleOptions=useBranchStore((state)=>state.roleOptions)
  const [branchCode, setBranchCode] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  // const getBranch = async () => {
  //   try {
  //     const url = `/branch/read?status=active`;
  //     const response = await apiClient.get(url, {
  //
  //     });
  //     console.log("response", response?.data);
  //     setBranch(response?.data || []);
  //   } catch (error) {
  //     console.log("error in fetch barachlist", error);
  //   }
  // };

  // useEffect(() => {
  //   getBranch();
  // }, []);

  const getRole = async () => {
    try {
      const response = await apiClient.get(`/setting/read`);
      console.log("userole responsee", response?.data);
      setRole(response?.data);
    } catch (error) {
      console.log("error in fetch user role", error);
    }
  };

  useEffect(() => {
    getRole();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleBranchChange = async (e) => {
    const selectedBranch = e.target.value;
    setFormData(prev => ({ ...prev, branchcode: selectedBranch, role: '' }));
    
    if (selectedBranch) {
      try {
        setLoading(true);
        const response = await fetch(`/branch/dropdown?branchcode=${selectedBranch}`);
        const data = await response.json();
        
        // Map the roles for the dropdown
        const roles = data.result.map(item => ({
          value: item.role,
          label: item.role
        }));
        
        setRoleOptions(roles);
      } catch (error) {
        console.error("Error fetching roles:", error);
        setRoleOptions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setRoleOptions([]);
    }
  };
  const handleDeleteChange = (e) => {
    const { name, value } = e.target;
    setDeleteData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddRoleSubmit = async (e) => {
    setErrors(null);
    e.preventDefault();
    try {
      setLoading(true);
      console.log("addroledata", formData);
      const url = `/setting/create`;
      const response = await apiClient.post(url, formData);
      if (response.status == 201) {
        setShowAddModal(false);
        notify.success("Add Role Successfully!", {
          style: {
            border: "1px solid #2b6cb0",
            padding: "14px",
            width: "900px",
            color: "#2b6cb0",
          },
          iconTheme: {
            primary: "#2b6cb0",
            secondary: "#FFFAEE",
          },
        });
      }
      setLoading(false);
      getRole();
      setFormData({
        branchId: "",
        role: "",
        userId: "",
      });
    } catch (error) {
      console.log("error in Add role", error?.response?.data?.error);
      setErrors(error?.response?.data?.error);
      setShowAddModal(true);
      notify.error(`${errors} Error in add role`, {
        style: {
          border: "1px solid  rgb(185 28 28)",
          padding: "14px",
          width: "900px",
          color: " rgb(185 28 28)",
        },
        iconTheme: {
          primary: " rgb(185 28 28)",
          secondary: "#FFFAEE",
        },
      });
      setErrors(null);
      setLoading(false);
    }
  };

  const handleRoleSelect = (roleItem) => {
    setCurrentRole(roleItem);
    const {
      _id,
      id,
      branch_id,
      role,
      create_datetime,
      last_update_datetime,
      ...perms
    } = roleItem;
    console.log("errorrsetdeletee", id, branch_id);
    setPermissions(perms);
  };

  const handlePermissionChange = (category, field, value) => {
    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleUpdatePermissions = async () => {
    if (!currentRole) {
      notify.error("Please select a role and enter User ID");
      return;
    }

    try {
      setLoading(true);
      const url = `/setting/edit/${currentRole.id}`;
      const payload = {
        branchcode: currentRole.branchcode.toString(),
        data: permissions,
        userId: formData.userId,
      };

      console.log("Sending payload:", payload);

      const response = await apiClient.put(url, payload);

      if (response.status === 200) {
        notify.success("Access permission updated Successfully!", {
          style: {
            border: "1px solid #2b6cb0",
            padding: "14px",
            width: "900px",
            color: "#2b6cb0",
          },
          iconTheme: {
            primary: "#2b6cb0",
            secondary: "#FFFAEE",
          },
        });
        getRole();
      }
    } catch (error) {
      console.log("Error updating permissions:", error);
      notify.error(error?.response?.data?.error || "Error in add role", {
        style: {
          border: "1px solid  rgb(185 28 28)",
          padding: "14px",
          width: "900px",
          color: " rgb(185 28 28)",
        },
        iconTheme: {
          primary: " rgb(185 28 28)",
          secondary: "#FFFAEE",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPermissionCheckboxes = (category) => {
    if (!permissions || !permissions[category]) return null;

    return (
      <div className="flex flex-col gap-4 pl-9">
        {Object.entries(permissions[category]).map(([key, value]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) =>
                handlePermissionChange(category, key, e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-700
                checked:bg-red-700 dark:checked:bg-red-600
                focus:ring-red-700 dark:focus:ring-red-600
                text-red-700 dark:text-red-600
                transition-colors"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {key === "all"
                ? `All ${category.replace(/([A-Z])/g, " $1").toLowerCase()}`
                : `${key.charAt(0).toUpperCase() + key.slice(1)} ${category.replace(/([A-Z])/g, " $1").toLowerCase()}`}
            </span>
          </label>
        ))}
      </div>
    );
  };

  const renderPermissionSections = () => {
    if (!permissions) return null;

    // Exclude non-permission fields
    const permissionCategories = Object.keys(permissions).filter(
      (key) =>
        ![
          "_id",
          "id",
          "branchcode",
          "role",
          "create_datetime",
          "last_update_datetime",
        ].includes(key)
    );

    return permissionCategories.map((category) => (
      <div key={category}>
        <div className="flex gap-3 items-center">
          <Key className="text-gray-600 dark:text-gray-400" size={20} />
          <p className="text-gray-600 dark:text-gray-300">
            {category.replace(/([A-Z])/g, " $1")} Permissions:
          </p>
        </div>
        {renderPermissionCheckboxes(category)}
      </div>
    ));
  };

  const handleDeleteClick = (roleItem) => {
    console.log("deleterolited", roleItem);
    setRoleToDelete(roleItem);
    setShowDeleteModal(true);
  };
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    const payload = {
      branchcode: roleToDelete.branchcode.toString(),
      notes: deleteData.notes,
    };
    console.log("deletepayload", payload);
    try {
      setLoading(true);

      const url = `/setting/delete/${roleToDelete.id}`;
      console.log("deleteurlll", url);
      const response = await apiClient.delete(url, {
        data: payload,
      });

      if (response.status === 200) {
        notify.success("User Role Deleted Successfully!", {
          style: {
            border: "1px solid #2b6cb0",
            padding: "14px",
            width: "900px",
            color: "#2b6cb0",
          },
          iconTheme: {
            primary: "#2b6cb0",
            secondary: "#FFFAEE",
          },
        });
        getRole();
        setRoleToDelete(null);
        setDeleteData([]);
        if (currentRole?.id === roleToDelete.id) {
          setCurrentRole(null);
          setPermissions(null);
        }
      }
    } catch (error) {
      console.log("Error deleting role:", error);
      notify.error(error?.response?.data?.error || `Error in deleting role`, {
        style: {
          border: "1px solid  rgb(185 28 28)",
          padding: "14px",
          width: "900px",
          color: " rgb(185 28 28)",
        },
        iconTheme: {
          primary: " rgb(185 28 28)",
          secondary: "#FFFAEE",
        },
      });
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setRoleToDelete(null);
    }
  };


  const renderDeleteModal = () => (
    <Modal
      isVisible={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      title="Confirm Delete"
    >
      <div className="p-4">
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete the role "{roleToDelete?.role}"?
        </p>

        <div className="flex flex-col py-2 text-left mt-4">
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
            Notes (required for deletion)
          </label>
          <input
            name="notes"
            value={deleteData.notes}
            onChange={handleDeleteChange}
            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-3 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
            type="text"
            placeholder="Enter Your Notes Here"
            required
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 bg-[var(--color-secondary)] hover:[var(--color-hover-secondary)] hover-effect text-gray-800 dark:text-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteRole}
            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white rounded hover:bg-gradient-to-b hover-effect transition"
            disabled={loading}
          >
            {loading ? <ButtonLoader /> : "Delete Role"}
          </button>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="p-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full lg:w-[50%]">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-gray-600 dark:text-gray-300">
              Role
            </h1>
            <button
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600 flex items-center gap-1"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="inline" size={20} />
              <span>Add Role</span>
            </button>
          </div>

          <div className="flex flex-col gap-1 mt-4">
            <ul>
              {role.map((rol) => (
                <li
                  key={rol.id}
                  className="flex justify-between items-center hover:bg-gray-200 dark:hover:bg-gray-700 py-3 px-3 transition-colors"
                >
                  <span className="text-gray-600 dark:text-gray-300">
                  {rol.role.charAt(0).toUpperCase() + rol.role.slice(1).toLowerCase()}

                  </span>
                  <div className="flex space-x-4 text-gray-600 dark:text-gray-400">
                    <button onClick={() => handleRoleSelect(rol)}>
                      <Edit
                        className="inline hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        size={20}
                      />
                    </button>
                    <Trash2
                      className="inline hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      onClick={() => handleDeleteClick(rol)}
                      size={20}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full lg:w-[50%]">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-gray-600 dark:text-gray-300">
              Permissions: {currentRole?.role || "Select a role"}
            </h1>
            {currentRole && (
              <button
                onClick={handleUpdatePermissions}
                className="px-3 py-1 bg-[var(--color-primary)] text-sm hover:bg-[var(--color-hover)] text-white rounded hover:bg-gradient-to-b hover-effect transition"
                disabled={loading}
              >
                {loading ? <ButtonLoader /> : "Save Permissions"}
              </button>
            )}
          </div>

          {currentRole ? (
            <div className="flex flex-col gap-6 mt-4">
              {renderPermissionSections()}

              <div className="flex flex-col py-2 text-left">
                <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  User ID (required for update)
                </label>
                <input
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-3 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                  type="text"
                  placeholder="Enter user ID"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 text-gray-500 dark:text-gray-400">
              Please select a role to view and edit permissions
            </div>
          )}
        </div>
      </div>
{/* 
      <Modal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Role Form"
      >
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
                {branchCodeOption?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
      
  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <UserCheck className="inline mr-1" size={14} /> User Role
              </p>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              >
                {roleOptions?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="px-4 py-2 bg-[var(--color-secondary)] hover:[var(--color-hover-secondary)] hover-effect text-gray-800 dark:text-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)]  text-white rounded hover:bg-gradient-to-b hover-effect transition"
            disabled={loading}
            onClick={handleAddRoleSubmit}
          >
            {loading ? <ButtonLoader /> : "Create Role"}
          </button>
        </div>
      </Modal> */}
  <Modal
      isVisible={showAddModal}
      onClose={() => setShowAddModal(false)}
      title="Add Role Form"
    >
<div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <Hash className="inline mr-1" size={14} /> Branch Code
        </p>
        <select
          name="branchcode"
          value={formData.branchcode}
          onChange={handleBranchChange}  // Use the special handler for branch
          className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
          required
          disabled={loading}
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
          <UserCheck className="inline mr-1" size={14} /> User Role
        </p>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
          required
          disabled={!formData.branchcode || loading}  // Disable if no branch selected or loading
        >
          <option value="">Select Role</option>
          {roleOptions?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

{/*        <input
  type="text"
  name="role"
  value={formData.role}
  onChange={handleChange}
  placeholder="Enter Role"
  className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
  required
  disabled={!formData.branchcode || loading}  // Disable if no branch selected or loading
/>
*/}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => setShowAddModal(false)}
          className="px-4 py-2 bg-[var(--color-secondary)] hover:[var(--color-hover-secondary)] hover-effect text-gray-800 dark:text-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white rounded hover:bg-gradient-to-b hover-effect transition"
          disabled={loading || !formData.branchcode || !formData.role}
          onClick={handleAddRoleSubmit}
        >
          {loading ? <ButtonLoader /> : "Create Role"}
        </button>
      </div>
    </Modal>
      {renderDeleteModal()}
    </div>
  );
}
