import express, {  Request, Response, NextFunction } from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

// INVOICES MANAGMENTS
import {viewNotifications, viewUserResignationRequests, viewOverdueRecords} from '../controllers/notifications/view';
import {sendNotification} from '../controllers/notifications/create';
import {createUserResignRequest} from '../controllers/notifications/create'
import {approveResignationRequest} from '../controllers/notifications/edit'


import {createPayRequest, createPay} from '../controllers/project/Project5Payments/create';
import {viewPayRequest,viewPayHistoryLog, getInvoiceDetailsWithMilestones, teamWiseFinacialSummary} from '../controllers/project/Project5Payments/view';
import {editPayRequest} from '../controllers/project/Project5Payments/editrequest';

import {deletePayRequest} from '../controllers/project/Project5Payments/deletePayRequest';

import {updateInvoiceAndPayment} from '../controllers/project/Project5Payments/editPayMilestone';
import {addPayment} from '../controllers/project/Project5Payments/addPayMilestone';

const router = express.Router();

enum RoutePath {
  Invoices = "invoice",
  project = 'project',
  notification = 'notification',
  userResign = 'user_resign_form',
  overdue = 'overdue',
  teamview = 'teamview',
}
enum RouteField {
  request = 'req',
  pay = 'pay',
  report = 'report'
}

enum RouteAction {
  View = "read",
  Create = "create",
  Edit = "edit",
  Delete = "delete"
}

// USERS MANAGMENT'S 
// example Route: /users/read,/users/read/:id 

// router.get(`/${RoutePath.Invoices}/${RouteAction.View}`, authMiddleware, viewInvoices);
// router.post(`/${RoutePath.Invoices}/${RouteAction.Create}`, authMiddleware, createInvoices);
// router.put(`/${RoutePath.Invoices}/${RouteAction.Edit}/:id`, authMiddleware, editInvoices);
// router.delete(`/${RoutePath.Invoices}/${RouteAction.Delete}/:id`, authMiddleware, deleteInvoices);

router.post(`/${RoutePath.project}/${RouteField.request}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createPayRequest);
router.post(`/${RoutePath.project}/${RouteField.pay}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createPay);


router.put(`/${RoutePath.project}/${RouteField.request}/${RouteAction.Edit}`, authMiddleware, tenantAuth(), editPayRequest);


router.get(`/${RoutePath.project}/${RouteField.request}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewPayRequest);
router.get(`/${RoutePath.project}/${RouteField.pay}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewPayHistoryLog);
router.get(`/${RoutePath.project}/${RoutePath.Invoices}/${RouteAction.View}`, authMiddleware, tenantAuth(), getInvoiceDetailsWithMilestones);


router.get(`/${RoutePath.notification}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewNotifications);
router.post(`/${RoutePath.notification}/${RouteAction.Create}`, authMiddleware, tenantAuth(), async (req, res) => {
  const result = await sendNotification({ ...req.body, tenant_id: req.user?.tenantId });
  res.status(result.success ? 200 : 400).json(result);
});

router.get(`/${RoutePath.userResign}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewUserResignationRequests);
router.post(`/${RoutePath.userResign}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createUserResignRequest);
router.put(`/${RoutePath.userResign}/${RouteAction.Edit}`, authMiddleware, tenantAuth(), approveResignationRequest);


router.get(`/${RoutePath.overdue}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewOverdueRecords);

router.get(`/${RoutePath.teamview}/${RouteField.report}/${RouteAction.View}`, authMiddleware, tenantAuth(), teamWiseFinacialSummary);


router.put("/updatepay", authMiddleware, tenantAuth(), updateInvoiceAndPayment);
router.post("/createpay", authMiddleware, tenantAuth(), addPayment);

router.delete(
  "/project/payrequest/delete",
  authMiddleware,
  tenantAuth(),
  deletePayRequest
);

export default router;
