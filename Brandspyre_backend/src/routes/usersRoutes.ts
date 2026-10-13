import express, {  Request, Response, NextFunction } from "express";
import authMiddleware, { optionalAuthMiddleware } from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
import { secureSpreadsheetUpload } from "../middleware/secureUpload";
import { loginLimiter } from "../middleware/rateLimiter";
import {profilePage} from '../controllers/user/profile';
import {viewLogin} from '../controllers/user/userManagement/LoginEntry view'
// Import for User List
import { createUsers } from "../controllers/user/userManagement/create";
import { editUsers } from "../controllers/user/userManagement/edit";
import { viewUsers, viewUsersDropDown } from "../controllers/user/userManagement/view";
import { deleteUsers } from "../controllers/user/userManagement/delete";
import { loginUsers } from "../controllers/user/userManagement/login";
import { logoutUser } from "../controllers/user/userManagement/logout"; // adjust relative path


import {importCampaigns} from "../controllers/sales/campaign/importfile"
import {importProjects} from "../controllers/project/importproject"

import {importClients} from "../controllers/project/importclient"

import {importEmployees} from "../controllers/project/importstaff"

import {getCommTypes} from "../controllers/project/comm_type"

import {getCampTypes} from "../controllers/project/camp_type"

import {getindTypes} from "../controllers/project/client_comm_type"

import {getMilestoneTypes} from "../controllers/project/getmilestonetypes"

import {getBloodTypes} from "../controllers/project/bloodgroups"

import {getInvoiceNo} from "../controllers/project/getinvoiceid"

import {revisedProjects} from "../controllers/project/revision"

import {importLeads} from "../controllers/project/importleads"

import { getLeadConversionStats } from "../controllers/user/userManagement/leadConversionrate";

import { getRoleAccess } from "../controllers/user/roleaccess/view";




import { getRoleAccessDetail } from "../controllers/user/roleaccess/viewdetail";

// get department  

import { getDepartmentByStaffId } from "../controllers/user/userManagement/dep"; // adjust path accordingly


import { getProjectsAccess } from "../controllers/project/getProject_access"; // adjust path accordingly

import { getMilestonesAccess } from "../controllers/project/getMilestoneaccess"; // adjust path accordingly

import { getTasksAccess } from "../controllers/project/getTasksaccess"; // adjust path accordingly


import { getUserTasks } from "../controllers/project/task_participants_access"; // adjust path accordingly


//budget_share for team & member for report

import { getTaskProgress } from "../controllers/project/member_budget"; // adjust path accordingly
import { getTeamBudgetShare } from "../controllers/project/team_budget"; // adjust path accordingly
import { getTeamTaskProgress } from "../controllers/project/member_budget_tl_view"; // adjust path accordingly
import { getTeamBudgetShareById } from "../controllers/project/team_budget_tl_view"; // adjust path accordingly

import { getTeamByStaff } from "../controllers/project/get_team_id"; // adjust path accordingly




//budget_share for team & member for report

//dashboard data
import { getProjectStats } from "../controllers/project/employee_dashboard"; // adjust path accordingly



//dashboard data

// Import Emergency Contact's
import {viewUserEmergencyContact} from '../controllers/user/emergencyContact/view'
import {createUserEmergencyContactsInfo as createUserEmergencyContact} from '../controllers/user/emergencyContact/create'
import {editUserEmergencyContactsInfo as editUserEmergencyContact} from '../controllers/user/emergencyContact/edit'
import {deleteUserEmergencyContactsInfo as deleteUserEmergencyContact} from '../controllers/user/emergencyContact/delete'

// Import Reference
import {viewUserReferenceContact} from '../controllers/user/referrence/view'
import {createUserReferenceInfo as createUserReferenceContact} from '../controllers/user/referrence/create'
import {editUserReferenceInfo as editUserReferenceContact} from '../controllers/user/referrence/edit'
import {deleteUserReferenceInfo as deleteUserReferenceContact} from '../controllers/user/referrence/delete'

// Import Bank Info
import {viewUserBankInfo} from '../controllers/user/bankinfo/view'
import {createUserBankInfo} from '../controllers/user/bankinfo/create'
import {editUserBankInfo} from '../controllers/user/bankinfo/edit'
import {deleteUserBankInfo} from '../controllers/user/bankinfo/delete'

// Import Software Skill's Info
import {viewUserSoftwareInfo} from '../controllers/user/softwareskills/view'
import {createUserSoftwareInfo} from '../controllers/user/softwareskills/create'
import {editUserSoftwareInfo} from '../controllers/user/softwareskills/edit'
import {deleteUserSoftwareInfo} from '../controllers/user/softwareskills/delete'

// Import Document Uploading
import {viewUserDocumentsUploadInfo} from '../controllers/user/documentsUpload/view'
import {createUserDocumentUploadInfo as createUserDocumentsUploadInfo} from '../controllers/user/documentsUpload/create'
import {editUserDocumentUploadInfo as editUserDocumentsUploadInfo} from '../controllers/user/documentsUpload/edit'
import {deleteUserDocumentUploadInfo as deleteUserDocumentsUploadInfo} from '../controllers/user/documentsUpload/delete'

// Import Education
import {viewUserEducationsInfo} from '../controllers/user/education/view'
import {createUserEducationInfo as createUserEducationsInfo} from '../controllers/user/education/create'
import {editUserEducationInfo as editUserEducationsInfo} from '../controllers/user/education/edit'
import {deleteUserEducationInfo as deleteUserEducationsInfo} from '../controllers/user/education/delete'

// Import Experience's
import {viewUserExperiencesInfo} from '../controllers/user/experience/view'
import {createUserExperienceInfo as createUserExperiencesInfo} from '../controllers/user/experience/create'
import {editUserExperienceInfo as editUserExperiencesInfo} from '../controllers/user/experience/edit'
import {deleteUserExperienceInfo as deleteUserExperiencesInfo} from '../controllers/user/experience/delete'

// Import Language's
import {viewUserLanguagesInfo} from '../controllers/user/languages/view'
import {createUserLanguagesInfo} from '../controllers/user/languages/create'
import {editUserLanguagesInfo} from '../controllers/user/languages/edit'
import {deleteUserLanguagesInfo} from '../controllers/user/languages/delete'

// Import salary's
import {viewUserSalaryInfo, viewFeedbackInfo} from '../controllers/user/salary/view'
import {createUserSalaryInfo, createPerformanceReview} from '../controllers/user/salary/create'
import {editUserSalaryInfo, teamLeadRating, managementRating} from '../controllers/user/salary/edit'
import {deleteUserSalaryInfo} from '../controllers/user/salary/delete'

// Import Incentive's
import {viewUserIncentivesInfo} from '../controllers/user/incentives/view'
import {createUserIncentivesInfo} from '../controllers/user/incentives/create'
import {editUserIncentivesInfo} from '../controllers/user/incentives/edit'
import {deleteUserIncentivesInfo} from '../controllers/user/incentives/delete'

// Import Promotion's
import {viewUserPromotionInfo} from '../controllers/user/promotion/view'
import {createUserPromotionInfo} from '../controllers/user/promotion/create'
import {editUserPromotionInfo} from '../controllers/user/promotion/edit'
import {deleteUserPromotionInfo} from '../controllers/user/promotion/delete'

import {createSelfRating} from '../controllers/user/promotion/empFeedbackCreate'

// Import Salary Slip's
import {viewUserSalarySlipInfo} from '../controllers/user/salarySlip/view'
import {createUserSalarySlipInfo} from '../controllers/user/salarySlip/create'
import {editUserSalarySlipInfo} from '../controllers/user/salarySlip/edit'
import {deleteUserSalarySlipInfo} from '../controllers/user/salarySlip/delete'
import { runBatchPayroll, getPayrollRuns, getPayrollRunById, approvePayrollRun, finalizePayrollRun, cancelPayrollRun } from '../controllers/user/payroll/payrollController';

// Import Attendance's / Log
import {viewUserAttendanceInfo , viewUserAttendanceLogInfo} from '../controllers/user/attendance-log/view'
import { createUserAttendanceInfo, createUserAttendanceLogInfo, createUserAttendanceLogInfo as bulkUserAttendanceLogInfo } from '../controllers/user/attendance-log/create'
import {editUserAttendanceInfo } from '../controllers/user/attendance-log/edit'

import {updateAttendanceLog } from '../controllers/user/attendance-log/editAttendance'
import {deleteUserAttendanceLogInfo as deleteUserAttendanceInfo } from '../controllers/user/attendance-log/delete'

// Import Leave Request's / Leave Balances
import {viewUserLeaveReqInfo } from '../controllers/user/leave-balanceleave/view'
import {createUserLeaveReqInfo } from '../controllers/user/leave-balanceleave/create'
import {editUserLeaveReqInfo, editApproveUserLeaveReqInfo } from '../controllers/user/leave-balanceleave/edit'
import {deleteUserLeaveInfo } from '../controllers/user/leave-balanceleave/delete'

const router = express.Router();

enum RoutePath {
  users = "users",
}
enum RouteField {
  emergency = "emergency",
  reference = "reference",
  bank = "bank",
  software = "software",
  document = "document",
  education = "education",
  experience = "experience",
  language = "language",
  salary = "salary",
  incentive= "incentive",
  promotion = "promotion",
  salaryslip = "salaryslip",
  attendance = "attendance",
  attendancelog = "attendance-log",
  attendancelogbulk = "attendance-log-bulk",
  leavereq = "leavereq",
  leaveaproved = "leaveaproved",
  self_rating='self_rating',
  lead_rating ='lead_rating',
  hr_rating ='hr_rating'
}

enum RouteAction {
  profile = "profile",
  View = "read",
  Create = "create",
  Edit = "edit",
  Delete = "delete",
  log = "login",
  dropdown = "dropdown",
  filter = "filter"
}

// USERS MANAGMENT'S 
// example Route: /users/read,/users/read/:id 
router.post(`/${RoutePath.users}/${RouteAction.log}`, loginLimiter, loginUsers);
router.post("/logout", logoutUser);
router.get(`/${RoutePath.users}/${RouteAction.log}/${RouteAction.View}`,authMiddleware, viewLogin);

router.post(`/${RoutePath.users}/${RouteAction.profile}`, authMiddleware, tenantAuth(), profilePage);
router.get(`/${RoutePath.users}/${RouteAction.profile}`, authMiddleware, tenantAuth(), profilePage);

// Create New User's
router.get(`/${RoutePath.users}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUsers);
router.get(`/${RoutePath.users}/userinfo/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUsers);
router.get(`/${RoutePath.users}/userinfo/${RouteAction.View}/:id`, authMiddleware, tenantAuth(), viewUsers);
router.get(`/${RoutePath.users}/${RouteAction.dropdown}/`, authMiddleware, tenantAuth(), viewUsersDropDown);
router.post(`/${RoutePath.users}/${RouteAction.filter}/`, authMiddleware, tenantAuth(), viewUsersDropDown);
router.post(`/${RoutePath.users}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUsers);
router.put(`/${RoutePath.users}/${RouteAction.Edit}`,  authMiddleware, tenantAuth(),  editUsers);
router.delete(`/${RoutePath.users}/${RouteAction.Delete}`, authMiddleware, tenantAuth(),  deleteUsers);

// Create Emergency Contact's
router.get(`/${RoutePath.users}/${RouteField.emergency}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserEmergencyContact);
router.post(`/${RoutePath.users}/${RouteField.emergency}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserEmergencyContact);
router.put(`/${RoutePath.users}/${RouteField.emergency}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserEmergencyContact);
router.delete(`/${RoutePath.users}/${RouteField.emergency}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserEmergencyContact);

// Create References
router.get(`/${RoutePath.users}/${RouteField.reference}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserReferenceContact);
router.post(`/${RoutePath.users}/${RouteField.reference}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserReferenceContact);
router.put(`/${RoutePath.users}/${RouteField.reference}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserReferenceContact);
router.delete(`/${RoutePath.users}/${RouteField.reference}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserReferenceContact);

// Create Bank Info
router.get(`/${RoutePath.users}/${RouteField.bank}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserBankInfo);
router.post(`/${RoutePath.users}/${RouteField.bank}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserBankInfo);
router.put(`/${RoutePath.users}/${RouteField.bank}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserBankInfo);
router.delete(`/${RoutePath.users}/${RouteField.bank}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserBankInfo);

// Create software skill's
router.get(`/${RoutePath.users}/${RouteField.software}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserSoftwareInfo);
router.post(`/${RoutePath.users}/${RouteField.software}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserSoftwareInfo);
router.put(`/${RoutePath.users}/${RouteField.software}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserSoftwareInfo);
router.delete(`/${RoutePath.users}/${RouteField.software}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserSoftwareInfo);

// Create Document's Uploading
router.get(`/${RoutePath.users}/${RouteField.document}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserDocumentsUploadInfo);
router.post(`/${RoutePath.users}/${RouteField.document}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserDocumentsUploadInfo);
router.put(`/${RoutePath.users}/${RouteField.document}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserDocumentsUploadInfo);
router.delete(`/${RoutePath.users}/${RouteField.document}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserDocumentsUploadInfo);

// Create Education's
router.get(`/${RoutePath.users}/${RouteField.education}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserEducationsInfo);
router.post(`/${RoutePath.users}/${RouteField.education}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserEducationsInfo);
router.put(`/${RoutePath.users}/${RouteField.education}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserEducationsInfo);
router.delete(`/${RoutePath.users}/${RouteField.education}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserEducationsInfo);

// Create Experience's
router.get(`/${RoutePath.users}/${RouteField.experience}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserExperiencesInfo);
router.post(`/${RoutePath.users}/${RouteField.experience}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserExperiencesInfo);
router.put(`/${RoutePath.users}/${RouteField.experience}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserExperiencesInfo);
router.delete(`/${RoutePath.users}/${RouteField.experience}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserExperiencesInfo);

// Create Languages's
router.get(`/${RoutePath.users}/${RouteField.language}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserLanguagesInfo);
router.post(`/${RoutePath.users}/${RouteField.language}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserLanguagesInfo);
router.put(`/${RoutePath.users}/${RouteField.language}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserLanguagesInfo);
router.delete(`/${RoutePath.users}/${RouteField.language}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserLanguagesInfo);

// Create salary's
router.get(`/${RoutePath.users}/${RouteField.salary}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserSalaryInfo);
router.post(`/${RoutePath.users}/${RouteField.salary}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserSalaryInfo);
router.put(`/${RoutePath.users}/${RouteField.salary}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserSalaryInfo);
router.delete(`/${RoutePath.users}/${RouteField.salary}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserSalaryInfo);

//Feedback Form
router.get(`/${RoutePath.users}/${RouteField.self_rating}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewFeedbackInfo);
router.post(`/${RoutePath.users}/${RouteField.self_rating}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createPerformanceReview);
router.put(`/${RoutePath.users}/${RouteField.lead_rating}/${RouteAction.Edit}`, authMiddleware, tenantAuth(), teamLeadRating);
router.put(`/${RoutePath.users}/${RouteField.hr_rating}/${RouteAction.Edit}`, authMiddleware, tenantAuth(), managementRating);

// Create Incentive's
router.get(`/${RoutePath.users}/${RouteField.incentive}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserIncentivesInfo);
router.post(`/${RoutePath.users}/${RouteField.incentive}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserIncentivesInfo);
router.put(`/${RoutePath.users}/${RouteField.incentive}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserIncentivesInfo);
router.delete(`/${RoutePath.users}/${RouteField.incentive}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserIncentivesInfo);

// Create Promotion's
router.get(`/${RoutePath.users}/${RouteField.promotion}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserPromotionInfo);
router.post(`/${RoutePath.users}/${RouteField.promotion}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserPromotionInfo);
router.put(`/${RoutePath.users}/${RouteField.promotion}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserPromotionInfo);
router.delete(`/${RoutePath.users}/${RouteField.promotion}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserPromotionInfo);

// Create Salary Slip's
router.get(`/${RoutePath.users}/${RouteField.salaryslip}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserSalarySlipInfo);
router.post(`/${RoutePath.users}/${RouteField.salaryslip}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserSalarySlipInfo);
router.put(`/${RoutePath.users}/${RouteField.salaryslip}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserSalarySlipInfo);
router.delete(`/${RoutePath.users}/${RouteField.salaryslip}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserSalarySlipInfo);

// Automated Batch Payroll Processor Routes
router.post(`/${RoutePath.users}/payroll/run`, authMiddleware, tenantAuth(), runBatchPayroll);
router.get(`/${RoutePath.users}/payroll/runs`, authMiddleware, tenantAuth(), getPayrollRuns);
router.get(`/${RoutePath.users}/payroll/runs/:id`, authMiddleware, tenantAuth(), getPayrollRunById);
router.post(`/${RoutePath.users}/payroll/runs/:id/approve`, authMiddleware, tenantAuth(), approvePayrollRun);
router.post(`/${RoutePath.users}/payroll/runs/:id/finalize`, authMiddleware, tenantAuth(), finalizePayrollRun);
router.post(`/${RoutePath.users}/payroll/runs/:id/cancel`, authMiddleware, tenantAuth(), cancelPayrollRun);

// Create Attendance's
router.get(`/${RoutePath.users}/${RouteField.attendance}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserAttendanceInfo);
router.get(`/attendance/read`, authMiddleware, tenantAuth(), viewUserAttendanceInfo);
router.post(`/${RoutePath.users}/${RouteField.attendance}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserAttendanceInfo);
router.post(`/attendance/create`, authMiddleware, tenantAuth(), createUserAttendanceInfo);
router.put(`/${RoutePath.users}/${RouteField.attendance}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserAttendanceInfo);
router.delete(`/${RoutePath.users}/${RouteField.attendance}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserAttendanceInfo);

router.put(`/editattendace/:id`, authMiddleware, tenantAuth(), updateAttendanceLog);

// Create Attendance's Log
router.get(`/${RoutePath.users}/${RouteField.attendancelog}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserAttendanceLogInfo);
router.get(`/attendance-log/read`, authMiddleware, tenantAuth(), viewUserAttendanceLogInfo);
router.post(`/${RoutePath.users}/${RouteField.attendancelog}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserAttendanceLogInfo);
router.post(`/attendance-log/create`, authMiddleware, tenantAuth(), createUserAttendanceLogInfo);
router.post(`/${RoutePath.users}/${RouteField.attendancelogbulk}/${RouteAction.Create}`, authMiddleware, tenantAuth(), bulkUserAttendanceLogInfo);
router.post(`/attendance-log-bulk/create`, authMiddleware, tenantAuth(), bulkUserAttendanceLogInfo);

// Create Leave Request's
router.get(`/${RoutePath.users}/${RouteField.leavereq}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserLeaveReqInfo);
router.post(`/${RoutePath.users}/${RouteField.leavereq}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserLeaveReqInfo);
router.put(`/${RoutePath.users}/${RouteField.leavereq}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editUserLeaveReqInfo);
router.put(`/${RoutePath.users}/${RouteField.leaveaproved}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editApproveUserLeaveReqInfo);
router.delete(`/${RoutePath.users}/${RouteField.leavereq}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteUserLeaveInfo);

router.get("/get-staff-department/:staff_id", authMiddleware, tenantAuth(), getDepartmentByStaffId);

router.get("/get-roleaccess/:role", authMiddleware, tenantAuth(), getRoleAccess);

router.get("/get-roleaccessdetail/:role", authMiddleware, tenantAuth(), getRoleAccessDetail);

router.get("/getprojectaccess", authMiddleware, tenantAuth(), getProjectsAccess);
router.get("/getmilestoneaccess", authMiddleware, tenantAuth(), getMilestonesAccess);
router.get("/gettaskaccess", authMiddleware, tenantAuth(), getTasksAccess);
router.get("/gettaskdetailaccess", authMiddleware, tenantAuth(), getUserTasks);

router.get("/getmembershare", authMiddleware, tenantAuth(), getTaskProgress);
router.get("/getteamshare", authMiddleware, tenantAuth(), getTeamBudgetShare);
router.get("/getmembershare_tlview", authMiddleware, tenantAuth(), getTeamTaskProgress);
router.get("/getteamshare_tlview", authMiddleware, tenantAuth(), getTeamBudgetShareById);


router.get("/getcommtype", getCommTypes);

router.get("/getcamptype", getCampTypes);

router.get("/getindtype", getindTypes);

router.get("/getmilestonetype", getMilestoneTypes);

router.get("/getbloods", getBloodTypes);

router.get("/next_invoice", authMiddleware, tenantAuth(), getInvoiceNo);

router.get("/getrevisions", authMiddleware, tenantAuth(), revisedProjects);


router.get("/getdashboard", authMiddleware, tenantAuth(), getProjectStats);
router.get("/getteamid", authMiddleware, tenantAuth(), getTeamByStaff);

router.post("/addfeedbackemp", authMiddleware, tenantAuth(), createSelfRating);

router.get("/getleadconvet", authMiddleware, tenantAuth(), getLeadConversionStats);

router.post(
  "/campaignimport",
  authMiddleware,
  tenantAuth(),
  secureSpreadsheetUpload.single("file"),
  importCampaigns
);

router.post(
  "/projectimport",
  authMiddleware,
  tenantAuth(),
  secureSpreadsheetUpload.single("file"),
  importProjects
);

router.post(
  "/clientimport",
  authMiddleware,
  tenantAuth(),
  secureSpreadsheetUpload.single("file"),
  importClients
);

router.post(
  "/staffimport",
  authMiddleware,
  tenantAuth(),
  secureSpreadsheetUpload.single("file"),
  importEmployees
);

router.post(
  "/leadimport",
  authMiddleware,
  tenantAuth(),
  secureSpreadsheetUpload.single("file"),
  importLeads
);



export default router;





