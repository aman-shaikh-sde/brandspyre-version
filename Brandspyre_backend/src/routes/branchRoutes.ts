import express, {  Request, Response, NextFunction } from "express";
import authMiddleware, { optionalAuthMiddleware } from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

// BRANCH MANAGMENTS
import { viewBranch, viewBranchDropDown,viewBranchAdmin } from "../controllers/branch/view";
import {createBranch} from "../controllers/branch/create"
import {editBranch} from "../controllers/branch/edit"
import {deleteBranch} from "../controllers/branch/delete"


import {createDepartment} from "../controllers/branch/create_department"
// import {editBranch} from "../controllers/branch/edit"
import {deleteDepartment} from "../controllers/branch/delete_department"

import { getDepartments } from "../controllers/branch/view_department";

import {createDesignation} from "../controllers/branch/create_designation"
// import {editBranch} from "../controllers/branch/edit"
import {deleteDesignation} from "../controllers/branch/delete_designation"

import { getDesignations } from "../controllers/branch/view_designation";

import { getStaff } from "../controllers/branch/getstaff_dept";
import { getStaffbranch } from "../controllers/branch/branch_staff";




// TEAMS MANAGEMENTS
import { viewTeamInfo , viewSingleTeamProfileInfo, viewTeamHistoryInfo, viewTeamByStaffId} from "../controllers/teams/team/view";
import {createTeamInfo} from "../controllers/teams/team/create"
import {editTeamInfo} from "../controllers/teams/team/edit"
import {deleteTeamInfo} from "../controllers/teams/team/delete"

// MEMBER'S MANAGEMENTS
import { viewMemberInfo } from "../controllers/teams/members/view";
import {createMemberInfo} from "../controllers/teams/members/create"
import {editMemberInfo} from "../controllers/teams/members/edit"
import {deleteMemberInfo} from "../controllers/teams/members/delete"

const router = express.Router();

enum RoutePath {
  Branch = "branch",
  Teams = "teams",
  Member = "members"
}

enum RouteField {
  Profile = "profile"
}

enum RouteAction {
  View = "read",
  Create = "create",
  Edit = "edit",
  Delete = "delete",
  dropdown = "dropdown",
  history ="history",
  admin = "admin"
}
// Branch MANAGMENT'S 
// example Route: /users/read,/users/read/:id 

router.get(`/${RoutePath.Branch}/${RouteAction.View}`,authMiddleware, tenantAuth(), viewBranch);
router.get(`/${RoutePath.Branch}/${RouteAction.dropdown}`,authMiddleware, tenantAuth(), viewBranchDropDown);
router.get(`/${RoutePath.Branch}/${RouteAction.admin}`,authMiddleware, tenantAuth(), viewBranchAdmin);
router.post(`/${RoutePath.Branch}/${RouteAction.Create}`,authMiddleware, tenantAuth(),  createBranch);
router.put(`/${RoutePath.Branch}/${RouteAction.Edit}/:id`,authMiddleware, tenantAuth(), editBranch);
router.delete(`/${RoutePath.Branch}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(), deleteBranch);

// Teams Profile (supports both /teams/* and /team/* singular alias)
router.get(`/${RoutePath.Teams}/${RouteAction.View}/${RouteField.Profile}`, authMiddleware, tenantAuth(), viewSingleTeamProfileInfo);
router.get(`/team/${RouteAction.View}/${RouteField.Profile}`, authMiddleware, tenantAuth(), viewSingleTeamProfileInfo);

router.get(`/${RoutePath.Teams}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewTeamInfo);
router.get(`/team/${RouteAction.View}`, authMiddleware, tenantAuth(), viewTeamInfo);

router.get(`/${RoutePath.Teams}/${RouteAction.history}`, authMiddleware, tenantAuth(), viewTeamHistoryInfo);
router.get(`/team/${RouteAction.history}`, authMiddleware, tenantAuth(), viewTeamHistoryInfo);

router.post(`/${RoutePath.Teams}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createTeamInfo);
router.post(`/team/${RouteAction.Create}`, authMiddleware, tenantAuth(), createTeamInfo);

router.put(`/${RoutePath.Teams}/${RouteAction.Edit}`, authMiddleware, tenantAuth(), editTeamInfo);
router.put(`/team/${RouteAction.Edit}`, authMiddleware, tenantAuth(), editTeamInfo);

router.delete(`/${RoutePath.Teams}/${RouteAction.Delete}`, authMiddleware, tenantAuth(), deleteTeamInfo);
router.delete(`/team/${RouteAction.Delete}`, authMiddleware, tenantAuth(), deleteTeamInfo);

router.get(`/${RoutePath.Member}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewMemberInfo);
router.post(`/${RoutePath.Member}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createMemberInfo);
router.put(`/${RoutePath.Member}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editMemberInfo);
router.delete(`/${RoutePath.Member}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteMemberInfo);

router.get(`/${RoutePath.Teams}/${RoutePath.Member}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewTeamByStaffId);
router.get(`/team/${RoutePath.Member}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewTeamByStaffId);

router.post(`/createDepartment`,authMiddleware, tenantAuth(),  createDepartment);
router.delete(`/deleteDepartment/:id`,authMiddleware, tenantAuth(), deleteDepartment);
router.get(`/getDepartments`, authMiddleware, tenantAuth(), getDepartments);


router.post(`/createDesignation`,authMiddleware, tenantAuth(),  createDesignation);
router.delete(`/deleteDesignation/:id`,authMiddleware, tenantAuth(), deleteDesignation);
router.get(`/getDesignations`, authMiddleware, tenantAuth(), getDesignations);

router.get(`/getStaff`, authMiddleware, tenantAuth(), getStaff);
router.get(`/getStaffbranch`, authMiddleware, tenantAuth(), getStaffbranch);



/*
result = {
  branchcode:"",
  team_name: "",
  team_id: "",
  team_lead:"",
  team_lead_name:"",
  createdon:"",
  members:[
  {
  team_id: "",
  branchcode:"",
  staff_id:"",
  staff_name:"",
  role_in_team:"",
  joined_on:"",
  status:""
  }
  ]
}
*/
export default router;
