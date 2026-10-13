import { ClientModel } from "../../../../db/ModelSceham/project/client";
import { Project } from "../../../../db/ModelSceham/project/client";
import { Milestone } from "../../../../db/ModelSceham/project/client";
import { Task } from "../../../../db/ModelSceham/project/client";
import { TaskParticipant } from "../../../../db/ModelSceham/project/client";
import { TaskParticipantLog } from "../../../../db/ModelSceham/project/client";

export const getClientProjectSummary = async (client_code: string) => {
  if (!client_code) throw new Error("client_code is required");

  const clientCode = client_code;
  const c = await ClientModel.findOne({ client_code: clientCode }).lean() as any;
  if (!c) {
    return null;
  }

  const projects = await Project.find({ client_code: clientCode }).lean() as any[];
  const milestones = await Milestone.find({ client_code: clientCode }).lean() as any[];
  const tasks = await Task.find({ client_code: clientCode }).lean() as any[];
  const taskParticipants = await TaskParticipant.find({ client_code: clientCode }).lean() as any[];
  const logs = await TaskParticipantLog.find({ client_code: clientCode }).lean() as any[];

  const totalproject = projects.length;
  const archiveproject = projects.filter(p => p.status === 'archived').length;
  const draftproject = projects.filter(p => p.status === 'draft').length;
  const inprogressprojectcount = projects.filter(p => p.status === 'inprocess').length;

  const totalmilestone = milestones.length;
  const totalarchivedmilestones = milestones.filter(m => m.status === 'archived').length;
  const totaldraftmilestones = milestones.filter(m => m.status === 'draft').length;
  const totalverifiedclosedmilestones = milestones.filter(m => m.status === 'verified').length;
  const totalrevisionmajor = milestones.filter(m => m.milestone_type === 'revision-major').length;
  const totalrevisionminor = milestones.filter(m => m.milestone_type === 'revision-minor').length;

  const total_taskcount = tasks.length;
  const totalarchivedtask = tasks.filter(t => t.status === 'archived').length;
  const totalverifiedclosedtask = tasks.filter(t => t.status === 'verified-closed').length;
  const totalreworktask = tasks.filter(t => t.status === 'rework').length;

  const totalparticipants = taskParticipants.length;
  const totalarchivedparticipants = taskParticipants.filter(tp => tp.status === 'archived').length;
  const totaldraftparticipants = taskParticipants.filter(tp => tp.status === 'draft').length;
  const totalverifiedclosedparticipants = taskParticipants.filter(tp => tp.status === 'verified-closed').length;
  const totaldelaybyclient = taskParticipants.filter(tp => tp.delay_by === 'client').length;
  const totaldelaybymember = taskParticipants.filter(tp => tp.delay_by === 'member').length;

  const total_seconds = logs.reduce((acc, l) => acc + ((l.duration || 0) * 60), 0);

  const hours = Math.floor(total_seconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((total_seconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (total_seconds % 60).toString().padStart(2, "0");

  return {
    client_code: c.client_code,
    client_name: c.client_name,
    company_name: c.company_name,
    branchcode: c.branchcode,
    campaign_code: c.campaign_code,
    lead_id: c.lead_id,
    primary_phone: c.primary_phone,
    email: c.email,
    office_address: c.office_address,
    website: c.website,
    industry_type: c.industry_type,
    comm_type: c.comm_type,
    status: c.status,
    contacts: c.contacts,
    createdby: c.createdby,
    updatedby: c.updatedby,
    created_on: c.created_on,
    updated_on: c.updated_on,
    totalproject,
    archiveproject,
    draftproject,
    inprogressprojectcount,
    totalmilestone,
    totalarchivedmilestones,
    totaldraftmilestones,
    totalverifiedclosedmilestones,
    total_revision_majormilestones: totalrevisionmajor,
    revision_minormilestones: totalrevisionminor,
    total_taskcount,
    totalarchivedtask,
    totalverifiedclosedtask,
    totalreworktask,
    totalparticipants,
    totalarchivedparticipants,
    totaldraftparticipants,
    totalverifiedclosedparticipants,
    totaldelay_byclientcount: totaldelaybyclient,
    totaldelay_bymemberscount: totaldelaybymember,
    total_duration_seconds: total_seconds,
    totaldurationoverallworkedhrs: `${hours}:${minutes}:${seconds}`
  };
};