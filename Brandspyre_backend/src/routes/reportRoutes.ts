import express, {  Request, Response, NextFunction } from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

// REPORT MANAGMENTS
// import { leadAnalysis } from "../controllers/report/1_leadAnalysis";
// import {projectAnalysis} from "../controllers/report/2_projectAnalysis"
// import {paymentAnalysis} from "../controllers/report/3_paymentAnalysis"
import {branchPaymentSummary} from "../controllers/report/branchsummary"

// Report Task Summary
import {perTaskSummaryByStaffAndProjects } from '../controllers/report/2_projectAnalysis'
import {projectOverviewAnalysis} from '../controllers/report/2_projectAnalysis'

import {employeeAnalysis} from '../controllers/report/4_employeeAnalysis'

import {getBranchwiseSummaryAnalysis} from '../controllers/report/clientReports/getClientAnalysis'

// Attedance Report For Branchs only
import{viewBranchAttendanceSummary} from '../controllers/user/attendance-log/view'

const router = express.Router();

enum RoutePath {
  Report = "report",
}

enum RouteAction {
  View = "read",
  Create = "create",
  Edit = "edit",
  Delete = "delete"
}
enum RouteField {
 task = 'tasksummary',
 project = 'projectoverview',
 users = 'usersummary',
 branches = 'branchsummary',
 attendance = 'attendancesummary'
}

// REPORT MANAGMENT'S 
// example Route: /users/read,/users/read/:id 

// router.get(`/${RoutePath.Report}/${RouteAction.View}`, authMiddleware, leadAnalysis);
// router.get(`/${RoutePath.Report}/${RouteAction.Create}`, authMiddleware, projectAnalysis);
// router.get(`/${RoutePath.Report}/${RouteAction.Edit}/:id`, authMiddleware, paymentAnalysis);
// router.get(`/${RoutePath.Report}/${RouteAction.Delete}/:id`, authMiddleware, employeeAnalysis);

router.get(`/${RoutePath.Report}/${RouteField.task}/${RouteAction.View}`, authMiddleware, tenantAuth(), perTaskSummaryByStaffAndProjects);
router.get(`/${RoutePath.Report}/${RouteField.project}/${RouteAction.View}`, authMiddleware, tenantAuth(), projectOverviewAnalysis);

// Employee Analysis

router.get(`/${RoutePath.Report}/${RouteField.users}/${RouteAction.View}`, authMiddleware, tenantAuth(), employeeAnalysis);

router.get(`/${RoutePath.Report}/${RouteField.branches}/${RouteAction.View}`, authMiddleware, tenantAuth(), getBranchwiseSummaryAnalysis);


// User Attendance Summary
router.get(`/${RoutePath.Report}/${RouteField.attendance}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewBranchAttendanceSummary);

router.get(`/branchpayment/view/`, authMiddleware, tenantAuth(), branchPaymentSummary);


export default router;
