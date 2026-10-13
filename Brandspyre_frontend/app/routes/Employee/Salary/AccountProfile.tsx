// import { useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { ArrowBigLeft, DotIcon, Edit, Edit2, MailCheck, PhoneCall, PrinterCheck, PrinterCheckIcon } from 'lucide-react';


// const EmployeeProfile = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('personal');

//   const employee = {
//     id: "1",
//     name: "Bharathi",
//     email: "bharathi@gmail.com",
//     position: "Team Lead",
//     phone: "+91 98765 43210",
//     address: "123 Main Street, Chennai, Tamil Nadu",
//     department: "Development Team",
//     staffId: "ASC 01",
//     license: "----",
//     dateOfJoining: "15-05-2018",
//     bloodGroup: "A1-ve",
//     fathersName: "Ganesan",
//     dateOfBirth: "10-06-1990",
//     alternateContact: "+91 98765 43211",
//     profileImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
//   };

//   const handleBack = () => {
//     navigate(-1);
//   };

//   return (
//     <div className=" min-h-screen">
//       <div className="">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="py-6 flex items-center justify-between">
//             <button 
//               onClick={handleBack}
//               className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-700"
//             >
//               <ArrowBigLeft className="mr-2" size={20} />
//               Back to Employees
//             </button>
//             {/* <div className="flex space-x-3">
//               <button>
//                 <PrinterCheckIcon size={16} /> Print
//               </button>
//               <button  >
//                 <Edit2 size={16} /> Edit
//               </button>
//             </div> */}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="bg-red-700 dark:bg-red-700/25 rounded-lg shadow overflow-hidden">
//           <div className="flex flex-col md:flex-row">
//             <div className="md:w-1/4 bg-red-700 dark:bg-red-700/15 p-6 flex items-center justify-center">
//               <div className="relative">
//                 <img
//                   className="h-48 w-48 rounded-full object-cover border-4 border-white dark:border-gray-600"
//                   src={employee.profileImage}
//                   alt={employee.name}
//                 />
//                 <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
//                   <Edit className="text-white" size={16} />
//                 </div>
//               </div>
//             </div>

//             <div className="md:w-3/4 p-6">
//               <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//                 <div>
//                   <h1 className="text-2xl font-bold text-gray-100 dark:text-gray-100">{employee.name}</h1>
//                   <p className="text-lg text-gray-300 dark:text-gray-300">{employee.position} | since 2021</p>
//                 </div>
//                 <div className="mt-4 md:mt-0 flex space-x-3 text-gray-100">
//                   <button>
//                   <MailCheck size={16} className='inline'/>  Message
//                   </button>
//                   <button>
//                    <PhoneCall size={16} className='inline' /> Call
//                   </button>
//                 </div>
//               </div>

//               <div className="mt-6 flex flex-col gap-2">
//                 <div className=" flex">
//                   <p className="text-sm text-gray-500  dark:text-gray-400">Staff ID :</p>
//                   <p className="font-medium text-sm text-gray-300 dark:text-white"> {employee.staffId}</p>
//                 </div>
//                 <div className="flex">
//                   <p className="text-sm text-gray-500 dark:text-gray-400">Department :</p>
//                   <p className="font-medium text-gray-300 dark:text-white">{employee.department}</p>
//                 </div>
//                 <div className=" flex">
//                   <p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining :</p>
//                   <p className="font-medium text-gray-300 dark:text-white">{employee.dateOfJoining}</p>
//                 </div>
//                 <div>
//                     <span
//                       className="px-3 py-1 rounded-full text-sm font-medium  bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
//                     >
//                    <DotIcon className='font-extrabold inline'/> Active
//                     </span>
//                   {/* <p className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200  h-[35px] w-[100px] flex items-center rounded-3xl'><DotIcon size={40} className='inline'/> Active</p> */}
//                 </div>
//               </div>
//             </div>
//           </div>

     
//         </div>
//      <div className="border-b border-gray-200 dark:border-gray-700">
//             <nav className="-mb-px flex space-x-8 px-6">
//               <button
//                 onClick={() => setActiveTab('personal')}
//                 className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'personal' ? 'border-red-700 text-red-900 dark:text-red-900' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
//               >
//                 Personal Details
//               </button>
//               <button
//                 onClick={() => setActiveTab('professional')}
//                 className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'professional' ? 'border-red-700 text-red-900 dark:text-red-900' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
//               >
//                 Professional Details
//               </button>
//               <button
//                 onClick={() => setActiveTab('documents')}
//                 className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-red-700 text-red-900 dark:text-red-900' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
//               >
//                 Documents
//               </button>
//             </nav>
//           </div>
//         <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
//           {activeTab === 'personal' && (
//             <div className="p-6">
//               <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.name}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.phone}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.email}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.dateOfBirth}</p>
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Father's Name</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.fathersName}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Blood Group</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.bloodGroup}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Alternate Contact</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.alternateContact}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.address}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeTab === 'professional' && (
//             <div className="p-6">
//               <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Professional Information</h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Staff ID</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.staffId}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.department}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.position}</p>
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.dateOfJoining}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">License</p>
//                     <p className="font-medium text-gray-900 dark:text-white">{employee.license}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeTab === 'documents' && (
//             <div className="p-6">
//               <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Documents</h2>
//               <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet.</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmployeeProfile;

// import { useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { 
//   ArrowBigLeft, 
//   Edit, 
//   Mail, 
//   Phone, 
//   FileText, 
//   GraduationCap, 
//   Briefcase,
//   File,
//   User,
//   Home,
//   Calendar,
//   Droplet,
//   Bookmark,
//   Shield
// } from 'lucide-react';

// const EmployeeProfile = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('personal');

//   const employee = {
//     id: "1",
//     name: "Bharathi",
//     email: "bharathi@gmail.com",
//     position: "Team Lead",
//     phone: "+91 98765 43210",
//     address: "123 Main Street, Chennai, Tamil Nadu",
//     permanentAddress: "456 Permanent Address, Madurai, Tamil Nadu",
//     department: "Development Team",
//     staffId: "ASC 01",
//     license: "Structural Engineer License #SE12345",
//     dateOfJoining: "15-05-2018",
//     bloodGroup: "A1-ve",
//     fathersName: "Ganesan",
//     dateOfBirth: "10-06-1990",
//     alternateContact: "+91 98765 43211",
//     gender: "Female",
//     maritalStatus: "Married",
//     residenceContact: "+91 98765 43212",
//     profileImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
//     status: "Active",
//     documents: [
//       { name: "Resume.pdf", type: "Resume", uploaded: "10-05-2018" },
//       { name: "Degree_Certificate.pdf", type: "Education", uploaded: "12-05-2018" },
//       { name: "Aadhaar_Card.pdf", type: "ID Proof", uploaded: "08-05-2018" },
//       { name: "PAN_Card.pdf", type: "ID Proof", uploaded: "08-05-2018" },
//     ],
//     education: [
//       { degree: "B.E. Civil Engineering", institute: "Anna University", year: "2012", percentage: "85%" },
//       { degree: "HSC", institute: "State Board", year: "2008", percentage: "92%" },
//       { degree: "SSLC", institute: "State Board", year: "2006", percentage: "95%" }
//     ],
//     experience: [
//       { company: "ABC Constructions", designation: "Junior Engineer", from: "2012", to: "2015", salary: "₹25,000", reason: "Career Growth" },
//       { company: "XYZ Designs", designation: "Engineer", from: "2015", to: "2018", salary: "₹45,000", reason: "Better Opportunity" }
//     ],
//     skills: [
//       { name: "AutoCAD", level: "Advanced" },
//       { name: "Revit", level: "Intermediate" },
//       { name: "STAAD Pro", level: "Advanced" },
//       { name: "MS Office", level: "Advanced" }
//     ],
//     languages: [
//       { name: "Tamil", read: true, speak: true, write: true },
//       { name: "English", read: true, speak: true, write: true },
//       { name: "Hindi", read: false, speak: true, write: false }
//     ],
//     emergencyContacts: [
//       { name: "Ganesan", relation: "Father", contact: "+91 98765 43213" },
//       { name: "Malathi", relation: "Spouse", contact: "+91 98765 43214" }
//     ]
//   };

//   const handleBack = () => {
//     navigate(-1);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="flex items-center justify-between mb-6">
//           <button 
//             onClick={handleBack}
//             className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
//           >
//             <ArrowBigLeft className="mr-2" size={20} />
//             Back to Employees
//           </button>
//           <div className="flex space-x-4">
//             <button className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
//               <FileText className="mr-2" size={16} />
//               Print Profile
//             </button>
//             <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700">
//               <Edit className="mr-2" size={16} />
//               Edit Profile
//             </button>
//           </div>
//         </div>

//         {/* Profile Card */}
//         <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
//           <div className="flex flex-col md:flex-row">
//             {/* Profile Image */}
//             <div className="md:w-1/4 bg-gradient-to-b from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 p-8 flex flex-col items-center justify-center">
//               <div className="relative mb-4">
//                 <img
//                   className="h-40 w-40 rounded-full object-cover border-4 border-white dark:border-gray-200"
//                   src={employee.profileImage}
//                   alt={employee.name}
//                 />
//                 <button className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors">
//                   <Edit className="text-white" size={16} />
//                 </button>
//               </div>
//               <h2 className="text-xl font-bold text-white text-center">{employee.name}</h2>
//               <p className="text-gray-200 text-center">{employee.position}</p>
//               <div className="mt-2 px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium">
//                 {employee.status}
//               </div>
//             </div>

//             <div className="md:w-3/4 p-6">
//               <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
//                 <div>
//                   <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{employee.name}</h1>
//                   <p className="text-lg text-gray-600 dark:text-gray-300">{employee.position} | {employee.department}</p>
//                 </div>
//                 <div className="mt-4 md:mt-0 flex space-x-3">
//                   <button className="flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
//                     <Mail className="mr-2" size={16} />
//                     Message
//                   </button>
//                   <button className="flex items-center px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
//                     <Phone className="mr-2" size={16} />
//                     Call
//                   </button>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
//                   <p className="text-sm text-gray-500 dark:text-gray-400">Staff ID</p>
//                   <p className="font-medium text-gray-800 dark:text-white">{employee.staffId}</p>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
//                   <p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining</p>
//                   <p className="font-medium text-gray-800 dark:text-white">{employee.dateOfJoining}</p>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
//                   <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
//                   <p className="font-medium text-gray-800 dark:text-white">{employee.phone}</p>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
//                   <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
//                   <p className="font-medium text-gray-800 dark:text-white">{employee.email}</p>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
//                   <p className="text-sm text-gray-500 dark:text-gray-400">Blood Group</p>
//                   <p className="font-medium text-gray-800 dark:text-white">{employee.bloodGroup}</p>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
//                   <p className="text-sm text-gray-500 dark:text-gray-400">License</p>
//                   <p className="font-medium text-gray-800 dark:text-white">{employee.license}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
//           <nav className="-mb-px flex space-x-8">
//             <button
//               onClick={() => setActiveTab('personal')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'personal' ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
//             >
//               Personal Details
//             </button>
//             <button
//               onClick={() => setActiveTab('professional')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'professional' ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
//             >
//               Professional Details
//             </button>
//             <button
//               onClick={() => setActiveTab('documents')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
//             >
//               Documents
//             </button>
//           </nav>
//         </div>

//         {/* Tab Content */}
//         <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
//           {/* Personal Details */}
//           {activeTab === 'personal' && (
//             <div className="p-6">
//               <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
//                 <User className="mr-2 text-red-600" size={20} />
//                 Personal Information
//               </h2>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-6">
//                   <div>
//                     <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Basic Details</h3>
//                     <div className="space-y-4">
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.name}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Father's Name</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.fathersName}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.dateOfBirth}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.gender}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Marital Status</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.maritalStatus}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Blood Group</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.bloodGroup}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="space-y-6">
//                   <div>
//                     <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Contact Information</h3>
//                     <div className="space-y-4">
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.phone}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Alternate Contact</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.alternateContact}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Residence Contact</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.residenceContact}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.email}</p>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div>
//                     <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Address</h3>
//                     <div className="space-y-4">
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Present Address</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.address}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Permanent Address</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.permanentAddress}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Emergency Contacts */}
//               <div className="mt-8">
//                 <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
//                   <Shield className="mr-2 text-red-600" size={20} />
//                   Emergency Contacts
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {employee.emergencyContacts.map((contact, index) => (
//                     <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
//                       <div className="flex justify-between items-start">
//                         <div>
//                           <p className="font-medium text-gray-800 dark:text-white">{contact.name}</p>
//                           <p className="text-sm text-gray-500 dark:text-gray-400">{contact.relation}</p>
//                         </div>
//                         <p className="font-medium text-gray-800 dark:text-white">{contact.contact}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Professional Details */}
//           {activeTab === 'professional' && (
//             <div className="p-6">
//               <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
//                 <Briefcase className="mr-2 text-red-600" size={20} />
//                 Professional Information
//               </h2>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-6">
//                   <div>
//                     <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Employment Details</h3>
//                     <div className="space-y-4">
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Staff ID</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.staffId}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.department}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.position}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.dateOfJoining}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">License</p>
//                         <p className="font-medium text-gray-800 dark:text-white">{employee.license}</p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Skills */}
//                   <div>
//                     <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Skills</h3>
//                     <div className="space-y-3">
//                       {employee.skills.map((skill, index) => (
//                         <div key={index}>
//                           <div className="flex justify-between items-center mb-1">
//                             <span className="text-sm font-medium text-gray-800 dark:text-white">{skill.name}</span>
//                             <span className="text-xs text-gray-500 dark:text-gray-400">{skill.level}</span>
//                           </div>
//                           <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
//                             <div 
//                               className={`h-2 rounded-full ${
//                                 skill.level === 'Advanced' ? 'bg-green-500' : 
//                                 skill.level === 'Intermediate' ? 'bg-blue-500' : 'bg-yellow-500'
//                               }`}
//                               style={{ width: 
//                                 skill.level === 'Advanced' ? '90%' : 
//                                 skill.level === 'Intermediate' ? '60%' : '30%'
//                               }}
//                             ></div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-6">
//                   {/* Education */}
//                   <div>
//                     <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
//                       <GraduationCap className="mr-2 text-red-600" size={20} />
//                       Education
//                     </h3>
//                     <div className="space-y-4">
//                       {employee.education.map((edu, index) => (
//                         <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
//                           <div className="flex justify-between items-start">
//                             <div>
//                               <p className="font-medium text-gray-800 dark:text-white">{edu.degree}</p>
//                               <p className="text-sm text-gray-500 dark:text-gray-400">{edu.institute}</p>
//                             </div>
//                             <div className="text-right">
//                               <p className="text-sm text-gray-800 dark:text-white">{edu.year}</p>
//                               <p className="text-sm text-gray-500 dark:text-gray-400">{edu.percentage}</p>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Experience */}
//                   <div>
//                     <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Work Experience</h3>
//                     <div className="space-y-4">
//                       {employee.experience.map((exp, index) => (
//                         <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
//                           <div className="flex justify-between items-start mb-2">
//                             <div>
//                               <p className="font-medium text-gray-800 dark:text-white">{exp.company}</p>
//                               <p className="text-sm text-gray-500 dark:text-gray-400">{exp.designation}</p>
//                             </div>
//                             <div className="text-right">
//                               <p className="text-sm text-gray-800 dark:text-white">{exp.from} - {exp.to}</p>
//                               <p className="text-sm text-gray-500 dark:text-gray-400">{exp.salary}</p>
//                             </div>
//                           </div>
//                           <p className="text-xs text-gray-500 dark:text-gray-400">
//                             <span className="font-medium">Reason for leaving:</span> {exp.reason}
//                           </p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Languages */}
//               <div className="mt-8">
//                 <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Languages Known</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {employee.languages.map((lang, index) => (
//                     <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
//                       <p className="font-medium text-gray-800 dark:text-white mb-2">{lang.name}</p>
//                       <div className="flex space-x-4 text-sm">
//                         <span className={`${lang.read ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>Read</span>
//                         <span className={`${lang.speak ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>Speak</span>
//                         <span className={`${lang.write ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>Write</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Documents */}
//           {activeTab === 'documents' && (
//             <div className="p-6">
//               <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
//                 <File className="mr-2 text-red-600" size={20} />
//                 Documents
//               </h2>
              
//               {employee.documents.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {employee.documents.map((doc, index) => (
//                     <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
//                       <div className="flex items-start justify-between">
//                         <div>
//                           <p className="font-medium text-gray-800 dark:text-white">{doc.name}</p>
//                           <p className="text-sm text-gray-500 dark:text-gray-400">{doc.type}</p>
//                         </div>
//                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
//                           PDF
//                         </span>
//                       </div>
//                       <div className="mt-4 flex justify-between items-center">
//                         <span className="text-xs text-gray-500 dark:text-gray-400">Uploaded: {doc.uploaded}</span>
//                         <div className="flex space-x-2">
//                           <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
//                             View
//                           </button>
//                           <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300">
//                             Download
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-12">
//                   <File className="mx-auto h-12 w-12 text-gray-400" />
//                   <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No documents</h3>
//                   <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No documents have been uploaded yet.</p>
//                   <div className="mt-6">
//                     <button
//                       type="button"
//                       className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//                     >
//                       <File className="-ml-1 mr-2 h-5 w-5" />
//                       Upload Document
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmployeeProfile;
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBigLeft, 
  Edit, 
  Mail, 
  Phone, 
  FileText, 
  GraduationCap, 
  Briefcase,
  File,
  User,
  Shield,
  Save,
  X
} from 'lucide-react';

const AccountProfile= () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [employee, setEmployee] = useState({
    id: "1",
    name: "Bharathi",
    email: "bharathi@gmail.com",
    position: "Team Lead",
    phone: "+91 98765 43210",
    address: "123 Main Street, Chennai, Tamil Nadu",
    permanentAddress: "456 Permanent Address, Madurai, Tamil Nadu",
    department: "Development Team",
    staffId: "ASC 01",
    license: "Structural Engineer License #SE12345",
    dateOfJoining: "15-05-2018",
    bloodGroup: "A1-ve",
    fathersName: "Ganesan",
    dateOfBirth: "10-06-1990",
    alternateContact: "+91 98765 43211",
    gender: "Female",
    maritalStatus: "Married",
    residenceContact: "+91 98765 43212",
    profileImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    status: "Active",
    documents: [
      { name: "Resume.pdf", type: "Resume", uploaded: "10-05-2018" },
      { name: "Degree_Certificate.pdf", type: "Education", uploaded: "12-05-2018" },
      { name: "Aadhaar_Card.pdf", type: "ID Proof", uploaded: "08-05-2018" },
      { name: "PAN_Card.pdf", type: "ID Proof", uploaded: "08-05-2018" },
    ],
    education: [
      { degree: "B.E. Civil Engineering", institute: "Anna University", year: "2012", percentage: "85%" },
      { degree: "HSC", institute: "State Board", year: "2008", percentage: "92%" },
      { degree: "SSLC", institute: "State Board", year: "2006", percentage: "95%" }
    ],
    experience: [
      { company: "ABC Constructions", designation: "Junior Engineer", from: "2012", to: "2015", salary: "₹25,000", reason: "Career Growth" },
      { company: "XYZ Designs", designation: "Engineer", from: "2015", to: "2018", salary: "₹45,000", reason: "Better Opportunity" }
    ],
    skills: [
      { name: "AutoCAD", level: "Advanced" },
      { name: "Revit", level: "Intermediate" },
      { name: "STAAD Pro", level: "Advanced" },
      { name: "MS Office", level: "Advanced" }
    ],
    languages: [
      { name: "Tamil", read: true, speak: true, write: true },
      { name: "English", read: true, speak: true, write: true },
      { name: "Hindi", read: false, speak: true, write: false }
    ],
    emergencyContacts: [
      { name: "Ganesan", relation: "Father", contact: "+91 98765 43213" },
      { name: "Malathi", relation: "Spouse", contact: "+91 98765 43214" }
    ]
  });

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log('Saved changes:', employee);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e, field, nestedField = null, index = null) => {
    if (nestedField !== null && index !== null) {
      const updatedArray = [...employee[field]];
      updatedArray[index] = {
        ...updatedArray[index],
        [nestedField]: e.target.value
      };
      setEmployee({
        ...employee,
        [field]: updatedArray
      });
    } else if (nestedField !== null) {
      setEmployee({
        ...employee,
        [field]: {
          ...employee[field],
          [nestedField]: e.target.value
        }
      });
    } else {
      setEmployee({
        ...employee,
        [field]: e.target.value
      });
    }
  };

  const renderEditableField = (value, field, nestedField = null, index = null) => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e, field, nestedField, index)}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      );
    }
    return <span className="font-medium text-gray-800 dark:text-white">{value}</span>;
  };

  const renderEditableTextArea = (value, field) => {
    if (isEditing) {
      return (
        <textarea
          value={value}
          onChange={(e) => handleInputChange(e, field)}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          rows={3}
        />
      );
    }
    return <span className="font-medium text-gray-800 dark:text-white">{value}</span>;
  };

  // Documents Tab Content
  const renderDocumentsTab = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
        <File className="mr-2 text-red-600" size={20} />
        Employee Documents
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Document Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Uploaded On</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {employee.documents.map((doc, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">{doc.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{doc.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{doc.uploaded}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600 mr-3">
                    View
                  </button>
                  <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-600">
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isEditing && (
        <div className="mt-6">
          <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700">
            <File className="mr-2" size={16} />
            Upload New Document
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header and buttons */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <ArrowBigLeft className="mr-2" size={20} />
            Back to Employees
          </button>
          <div className="flex space-x-4">
            <button className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              <FileText className="mr-2" size={16} />
              Print Profile
            </button>
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700"
                >
                  <Save className="mr-2" size={16} />
                  Save Changes
                </button>
                <button 
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-gray-700"
                >
                  <X className="mr-2" size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700"
              >
                <Edit className="mr-2" size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
          <div className="flex flex-col md:flex-row">
            {/* Profile Image */}
            <div className="md:w-1/4 bg-gradient-to-b from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 p-8 flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <img
                  className="h-40 w-40 rounded-full object-cover border-4 border-white dark:border-gray-200"
                  src={employee.profileImage}
                  alt={employee.name}
                />
                {isEditing && (
                  <div className="mt-2">
                    <input
                      type="file"
                      id="profileImage"
                      className="hidden"
                      accept="image/*"
                    />
                    <label
                      htmlFor="profileImage"
                      className="block text-center text-sm text-white cursor-pointer hover:underline"
                    >
                      Change Photo
                    </label>
                  </div>
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={employee.name}
                  onChange={(e) => handleInputChange(e, 'name')}
                  className="w-full text-xl font-bold text-white text-center bg-transparent border-b border-white mb-2"
                />
              ) : (
                <h2 className="text-xl font-bold text-white text-center">{employee.name}</h2>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={employee.position}
                  onChange={(e) => handleInputChange(e, 'position')}
                  className="w-full text-gray-200 text-center bg-transparent border-b border-white"
                />
              ) : (
                <p className="text-gray-200 text-center">{employee.position}</p>
              )}
              <div className="mt-2 px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium">
                {employee.status}
              </div>
            </div>

            <div className="md:w-3/4 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={employee.name}
                        onChange={(e) => handleInputChange(e, 'name')}
                        className="text-2xl font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mb-2"
                      />
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={employee.position}
                          onChange={(e) => handleInputChange(e, 'position')}
                          className="text-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2"
                        />
                        <span>|</span>
                        <input
                          type="text"
                          value={employee.department}
                          onChange={(e) => handleInputChange(e, 'department')}
                          className="text-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ml-2"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{employee.name}</h1>
                      <p className="text-lg text-gray-600 dark:text-gray-300">{employee.position} | {employee.department}</p>
                    </>
                  )}
                </div>
                <div className="mt-4 md:mt-0 flex space-x-3">
                  <button className="flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    <Mail className="mr-2" size={16} />
                    Message
                  </button>
                  <button className="flex items-center px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                    <Phone className="mr-2" size={16} />
                    Call
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Staff ID</p>
                  {renderEditableField(employee.staffId, 'staffId')}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining</p>
                  {renderEditableField(employee.dateOfJoining, 'dateOfJoining')}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  {renderEditableField(employee.phone, 'phone')}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  {renderEditableField(employee.email, 'email')}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Blood Group</p>
                  {renderEditableField(employee.bloodGroup, 'bloodGroup')}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">License</p>
                  {renderEditableField(employee.license, 'license')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('personal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'personal' ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
            >
              Personal Details
            </button>
            <button
              onClick={() => setActiveTab('professional')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'professional' ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
            >
              Professional Details
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}`}
            >
              Documents
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Personal Details */}
          {activeTab === 'personal' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                <User className="mr-2 text-red-600" size={20} />
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Basic Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                        {renderEditableField(employee.name, 'name')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Father's Name</p>
                        {renderEditableField(employee.fathersName, 'fathersName')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                        {renderEditableField(employee.dateOfBirth, 'dateOfBirth')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                        {isEditing ? (
                          <select
                            value={employee.gender}
                            onChange={(e) => handleInputChange(e, 'gender')}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <span className="font-medium text-gray-800 dark:text-white">{employee.gender}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Marital Status</p>
                        {isEditing ? (
                          <select
                            value={employee.maritalStatus}
                            onChange={(e) => handleInputChange(e, 'maritalStatus')}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        ) : (
                          <span className="font-medium text-gray-800 dark:text-white">{employee.maritalStatus}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Blood Group</p>
                        {renderEditableField(employee.bloodGroup, 'bloodGroup')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                        {renderEditableField(employee.phone, 'phone')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Alternate Contact</p>
                        {renderEditableField(employee.alternateContact, 'alternateContact')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Residence Contact</p>
                        {renderEditableField(employee.residenceContact, 'residenceContact')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        {renderEditableField(employee.email, 'email')}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Address</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Present Address</p>
                        {renderEditableTextArea(employee.address, 'address')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Permanent Address</p>
                        {renderEditableTextArea(employee.permanentAddress, 'permanentAddress')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
                    <Shield className="mr-2 text-red-600" size={20} />
                    Emergency Contacts
                  </h3>
                  {isEditing && (
                    <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                      + Add Contact
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.emergencyContacts.map((contact, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                            <input
                              type="text"
                              value={contact.name}
                              onChange={(e) => handleInputChange(e, 'emergencyContacts', 'name', index)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Relation</p>
                            <input
                              type="text"
                              value={contact.relation}
                              onChange={(e) => handleInputChange(e, 'emergencyContacts', 'relation', index)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Contact Number</p>
                            <input
                              type="text"
                              value={contact.contact}
                              onChange={(e) => handleInputChange(e, 'emergencyContacts', 'contact', index)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            />
                          </div>
                          <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">{contact.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{contact.relation}</p>
                          </div>
                          <p className="font-medium text-gray-800 dark:text-white">{contact.contact}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Professional Details */}
          {activeTab === 'professional' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                <Briefcase className="mr-2 text-red-600" size={20} />
                Professional Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Employment Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Staff ID</p>
                        {renderEditableField(employee.staffId, 'staffId')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                        {renderEditableField(employee.department, 'department')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                        {renderEditableField(employee.position, 'position')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining</p>
                        {renderEditableField(employee.dateOfJoining, 'dateOfJoining')}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">License</p>
                        {renderEditableField(employee.license, 'license')}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Skills</h3>
                      {isEditing && (
                        <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                          + Add Skill
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {employee.skills.map((skill, index) => (
                        <div key={index}>
                          {isEditing ? (
                            <div className="flex space-x-2 mb-1">
                              <input
                                type="text"
                                value={skill.name}
                                onChange={(e) => handleInputChange(e, 'skills', 'name', index)}
                                className="w-1/2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                placeholder="Skill name"
                              />
                              <select
                                value={skill.level}
                                onChange={(e) => handleInputChange(e, 'skills', 'level', index)}
                                className="w-1/2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                              >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                              </select>
                              <button className="text-red-500">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-800 dark:text-white">{skill.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{skill.level}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    skill.level === 'Advanced' ? 'bg-green-500' : 
                                    skill.level === 'Intermediate' ? 'bg-blue-500' : 'bg-yellow-500'
                                  }`}
                                  style={{ width: 
                                    skill.level === 'Advanced' ? '90%' : 
                                    skill.level === 'Intermediate' ? '60%' : '30%'
                                  }}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
             
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
                        <GraduationCap className="mr-2 text-red-600" size={20} />
                        Education
                      </h3>
                      {isEditing && (
                        <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                          + Add Education
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {employee.education.map((edu, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Degree</p>
                                <input
                                  type="text"
                                  value={edu.degree}
                                  onChange={(e) => handleInputChange(e, 'education', 'degree', index)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Institute</p>
                                <input
                                  type="text"
                                  value={edu.institute}
                                  onChange={(e) => handleInputChange(e, 'education', 'institute', index)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Year</p>
                                  <input
                                    type="text"
                                    value={edu.year}
                                    onChange={(e) => handleInputChange(e, 'education', 'year', index)}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Percentage/GPA</p>
                                  <input
                                    type="text"
                                    value={edu.percentage}
                                    onChange={(e) => handleInputChange(e, 'education', 'percentage', index)}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                              <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800 dark:text-white">{edu.degree}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{edu.institute}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-800 dark:text-white">{edu.year}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{edu.percentage}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Work Experience</h3>
                      {isEditing && (
                        <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                          + Add Experience
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {employee.experience.map((exp, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                                <input
                                  type="text"
                                  value={exp.company}
                                  onChange={(e) => handleInputChange(e, 'experience', 'company', index)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Designation</p>
                                <input
                                  type="text"
                                  value={exp.designation}
                                  onChange={(e) => handleInputChange(e, 'experience', 'designation', index)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                                </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                                  <input
                                    type="text"
                                    value={exp.from}
                                    onChange={(e) => handleInputChange(e, 'experience', 'from', index)}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">To</p>
                                  <input
                                    type="text"
                                    value={exp.to}
                                    onChange={(e) => handleInputChange(e, 'experience', 'to', index)}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Salary</p>
                                <input
                                  type="text"
                                  value={exp.salary}
                                  onChange={(e) => handleInputChange(e, 'experience', 'salary', index)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Reason for Leaving</p>
                                <input
                                  type="text"
                                  value={exp.reason}
                                  onChange={(e) => handleInputChange(e, 'experience', 'reason', index)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                              </div>
                              <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-white">{exp.company}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{exp.designation}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-800 dark:text-white">{exp.from} - {exp.to}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{exp.salary}</p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Reason: {exp.reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && renderDocumentsTab()}
        </div>
      </div>
    </div>
  );
};

export default AccountProfile;