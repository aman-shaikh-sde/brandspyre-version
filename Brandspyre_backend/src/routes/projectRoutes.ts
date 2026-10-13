import express, {  Request, Response, NextFunction } from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";


// Import for Campaign OverViewe's List
import { viewCampaignInfo, viewSingleCampaignDetails, viewCampaignDropdownInfo ,campaignReportByBranch} from "../controllers/project/campaign/basicinfo/view";
import { createCampaignInfo } from "../controllers/project/campaign/basicinfo/create";
import { editCampaignInfo } from "../controllers/project/campaign/basicinfo/edit";
import { deleteCampaignInfo } from "../controllers/project/campaign/basicinfo/delete";

// Import for Campaign Lead's List
import { viewLeadsInfo , getSingleLeadWithFollowupsDetails, viewLeadsDropDownInfo } from "../controllers/project/campaign/leads/view";
import { createLeadsInfo } from "../controllers/project/campaign/leads/create";
import { editLeadsInfo } from "../controllers/project/campaign/leads/edit";
import { deleteLeadsInfo } from "../controllers/project/campaign/leads/delete";

import { viewFollowupInfo, getSingleFollowupInfo  } from "../controllers/project/campaign/followup/view";
import { createFollowupInfo } from "../controllers/project/campaign/followup/create";
import { editFollowupInfo } from "../controllers/project/campaign/followup/edit";
import { deleteFollowupInfo } from "../controllers/project/campaign/followup/delete";

// Import for Clients List
import { viewClientInfo ,viewClientDropdownInfo, viewClientWithProjects} from "../controllers/project/client/overview/view";
import { createClientInfo } from "../controllers/project/client/overview/create";
import { editClientInfo } from "../controllers/project/client/overview/edit";
import { deleteClientInfo } from "../controllers/project/client/overview/delete";

// Import for Project OverViewe's List
import { viewProjectOverview , viewProjectDropDown,  viewTypeDropdown , viewProjectWithMilestones} from "../controllers/project/Project1Overview/view";
import { createProjectOverview } from "../controllers/project/Project1Overview/create";
import { editProjectOverview } from "../controllers/project/Project1Overview/edit";
import { deleteProjectOverview } from "../controllers/project/Project1Overview/delete";

import {editProjectReason} from "../controllers/project/Project1Overview/editreason";

import {viewCumulativeReport} from "../controllers/project/Project1Overview/project_cumulative_report";

// Import for Project MilesStone's List
import { viewProjectMilestone,viewProjectMilestoneDropDown } from "../controllers/project/Project2Milestone/view";
import { createProjectMilestone } from "../controllers/project/Project2Milestone/create";
import { editProjectMilestone } from "../controllers/project/Project2Milestone/edit";
import { deleteProjectMilestone } from "../controllers/project/Project2Milestone/delete";

import {editmilestoneReason} from "../controllers/project/Project2Milestone/editreason";
// import {editmilestoneReason} from "../controllers/project/Project2Milestone/editreason";

// Import for Project Task's List
import { viewProjectTask } from "../controllers/project/Project3Task/view";
import { createProjectTask } from "../controllers/project/Project3Task/create";
import { editProjectTask , editProjectTaskParticipants} from "../controllers/project/Project3Task/edit";
import { deleteProjectTask } from "../controllers/project/Project3Task/delete";

import { getEmployeePayments } from "../controllers/project/get_payment_employee";

 // Import Participants List
 import { viewParticipantDetails } from '../controllers/project/Project3Taskparticipants/view'
import { addCollaboratorsToTask } from '../controllers/project/Project3Taskparticipants/create'
import { deleteProjectTaskParticipants } from '../controllers/project/Project3Taskparticipants/delete'
import { editProjectTaskParticipant } from '../controllers/project/Project3Taskparticipants/edit'


// Import Participant Time Sheet
import {createTaskCheckINOUT} from '../controllers/project/Project3TaskpCheckinout/create'
import {viewProjectCheckinOut} from '../controllers/project/Project3TaskpCheckinout/view'



const router = express.Router();

enum RoutePath {
  project = "project",
  campaign = "campaign",
  client = "client"
}
enum RouteField {
    overview = "overview",
    milestone = "milestone",
    task = "task",
    members = "members",
    leads = "leads",
    followup = "followup",
    profile="profile",
    report = 'report'
}

enum RouteAction {
  View = "read",
  Create = "create",
  Edit = "edit",
  Delete = "delete",
  dropdown="dropdown",
  members = "members",
  checkinout = "checkinout"
}

// Create Campaign Profile's List
router.get(`/${RoutePath.campaign}/${RouteField.overview}/${RouteAction.View}/${RouteField.profile}`, authMiddleware, tenantAuth(), viewSingleCampaignDetails);

// Create Campaign OverViewe's List
router.get(`/${RoutePath.campaign}/${RouteField.overview}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewCampaignInfo);
router.get(`/${RoutePath.campaign}/${RouteField.overview}/${RouteAction.dropdown}`, authMiddleware, tenantAuth(), viewCampaignDropdownInfo);// DropDown
router.post(`/${RoutePath.campaign}/${RouteField.overview}/${RouteAction.Create}`,authMiddleware, tenantAuth(), createCampaignInfo);
router.put(`/${RoutePath.campaign}/${RouteField.overview}/${RouteAction.Edit}`,authMiddleware, tenantAuth(), editCampaignInfo);
router.delete(`/${RoutePath.campaign}/${RouteField.overview}/${RouteAction.Delete}`,authMiddleware, tenantAuth(), deleteCampaignInfo);

// Create lead's Profile for Campaign List
router.get(`/${RoutePath.campaign}/${RouteField.leads}/${RouteAction.View}/${RouteField.profile}`, authMiddleware, tenantAuth(), getSingleLeadWithFollowupsDetails);
router.get(`/${RoutePath.campaign}/${RouteField.report}/${RouteAction.View}/${RouteField.profile}`, authMiddleware, tenantAuth(), campaignReportByBranch);


// Create lead's for Campaign List
router.get(`/${RoutePath.campaign}/${RouteField.leads}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewLeadsInfo);
router.get(`/${RoutePath.campaign}/${RouteField.leads}/${RouteAction.dropdown}`, authMiddleware, tenantAuth(), viewLeadsDropDownInfo);// DropDown
router.post(`/${RoutePath.campaign}/${RouteField.leads}/${RouteAction.Create}`,authMiddleware, tenantAuth(), createLeadsInfo);
router.put(`/${RoutePath.campaign}/${RouteField.leads}/${RouteAction.Edit}/:id`,authMiddleware, tenantAuth(), editLeadsInfo);
router.delete(`/${RoutePath.campaign}/${RouteField.leads}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(), deleteLeadsInfo);

// Create Follow-up for lead's in Campaign List
router.get(`/${RoutePath.campaign}/${RouteField.followup}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewFollowupInfo);
router.get(`/${RoutePath.campaign}/${RouteField.followup}/${RouteAction.View}/:id`, authMiddleware, tenantAuth(), getSingleFollowupInfo);
router.post(`/${RoutePath.campaign}/${RouteField.followup}/${RouteAction.Create}`,authMiddleware, tenantAuth(), createFollowupInfo);
router.put(`/${RoutePath.campaign}/${RouteField.followup}/${RouteAction.Edit}/:id`,authMiddleware, tenantAuth(), editFollowupInfo);
router.delete(`/${RoutePath.campaign}/${RouteField.followup}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(), deleteFollowupInfo);

// Create Client List 
router.get(`/${RoutePath.client}/${RouteField.profile}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewClientWithProjects);

router.get(`/${RoutePath.client}/${RouteField.overview}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewClientInfo);
router.get(`/${RoutePath.client}/${RouteField.overview}/${RouteAction.dropdown}`, authMiddleware, tenantAuth(), viewClientDropdownInfo); // Dropdown
router.post(`/${RoutePath.client}/${RouteField.overview}/${RouteAction.Create}`,authMiddleware, tenantAuth(), createClientInfo);
router.put(`/${RoutePath.client}/${RouteField.overview}/${RouteAction.Edit}`,authMiddleware, tenantAuth(), editClientInfo);
router.delete(`/${RoutePath.client}/${RouteField.overview}/${RouteAction.Delete}`,authMiddleware, tenantAuth(), deleteClientInfo);

// Create Project OverViewe's List
router.get(`/${RoutePath.project}/${RouteField.overview}/${RouteField.profile}/${RouteAction.View}`,authMiddleware, tenantAuth(), viewProjectWithMilestones);

router.get(`/${RoutePath.project}/${RouteField.overview}/${RouteAction.View}`,authMiddleware, tenantAuth(), viewProjectOverview);
router.get(`/${RoutePath.project}/${RouteField.overview}/${RouteAction.dropdown}`,authMiddleware, tenantAuth(), viewProjectDropDown);
router.get(`/${RoutePath.project}/${RouteField.overview}/${RouteAction.dropdown}/type`,authMiddleware, tenantAuth(), viewTypeDropdown);
router.post(`/${RoutePath.project}/${RouteField.overview}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createProjectOverview);
router.put(`/${RoutePath.project}/${RouteField.overview}/${RouteAction.Edit}`,authMiddleware, tenantAuth(), editProjectOverview);
router.delete(`/${RoutePath.project}/${RouteField.overview}/${RouteAction.Delete}`,  authMiddleware, tenantAuth(), deleteProjectOverview);

// Create Project MilesStone's List
router.get(`/${RoutePath.project}/${RouteField.milestone}/${RouteField.profile}/${RouteAction.View}`,authMiddleware, tenantAuth(), viewProjectMilestone);

router.get(`/${RoutePath.project}/${RouteField.milestone}/${RouteAction.View}`,authMiddleware, tenantAuth(), viewProjectMilestone);
router.get(`/${RoutePath.project}/${RouteField.milestone}/${RouteAction.dropdown}`,authMiddleware, tenantAuth(), viewProjectMilestoneDropDown);
router.post(`/${RoutePath.project}/${RouteField.milestone}/${RouteAction.Create}`,authMiddleware, tenantAuth(), createProjectMilestone); // authMiddleware,
router.put(`/${RoutePath.project}/${RouteField.milestone}/${RouteAction.Edit}`,authMiddleware, tenantAuth(), editProjectMilestone);
router.delete(`/${RoutePath.project}/${RouteField.milestone}/${RouteAction.Delete}`,authMiddleware, tenantAuth(), deleteProjectMilestone);

// Create Project Task's List
router.get(`/${RoutePath.project}/${RouteField.task}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewProjectTask);
router.post(`/${RoutePath.project}/${RouteField.task}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createProjectTask);
router.put(`/${RoutePath.project}/${RouteField.task}/${RouteAction.Edit}/:id`,authMiddleware, tenantAuth(), editProjectTask);
router.delete(`/${RoutePath.project}/${RouteField.task}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(), deleteProjectTask);

// Create AddPartcipants List 
router.get(`/${RoutePath.project}/${RouteField.task}/${RouteAction.members}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewParticipantDetails);
router.post(`/${RoutePath.project}/${RouteField.task}/${RouteAction.members}/${RouteAction.Create}`, authMiddleware, tenantAuth(), addCollaboratorsToTask);
router.put(`/${RoutePath.project}/${RouteField.task}/${RouteAction.members}/${RouteAction.Edit}/:id`,authMiddleware, tenantAuth(), editProjectTaskParticipant);
router.delete(`/${RoutePath.project}/${RouteField.task}/${RouteAction.members}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(), deleteProjectTaskParticipants);


// Create Check IN - OUT List 
router.get(`/${RoutePath.project}/${RouteField.task}/${RouteAction.checkinout}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewProjectCheckinOut);
router.post(`/${RoutePath.project}/${RouteField.task}/${RouteAction.checkinout}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createTaskCheckINOUT);

router.put (`/edit_project_reason/:id`,authMiddleware, tenantAuth(), editProjectReason);
router.put (`/edit_milestone_reason/:id`,authMiddleware, tenantAuth(), editmilestoneReason);

router.get (`/getemployeepaments`,authMiddleware, tenantAuth(), getEmployeePayments);
router.get (`/cumulative`,authMiddleware, tenantAuth(), viewCumulativeReport);

export default router;