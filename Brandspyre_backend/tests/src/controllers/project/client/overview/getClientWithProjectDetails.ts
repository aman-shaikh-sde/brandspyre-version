import { ClientModel } from "../../../../db/ModelSceham/project/client";
import { Project } from "../../../../db/ModelSceham/project/client";
import { Milestone } from "../../../../db/ModelSceham/project/client";
import { Task } from "../../../../db/ModelSceham/project/client";
import { TaskParticipant } from "../../../../db/ModelSceham/project/client";
import { TaskParticipantLog } from "../../../../db/ModelSceham/project/client";

import mongoose from "mongoose";

export const getClientWithProjectDetails = async (
  client_code: string,
  start_date?: string,
  end_date?: string,
  tenantId?: string,
  isPlatformAdmin: boolean = false
) => {
  if (!client_code) throw new Error("client_code is required");

  const clientFilter: any = { client_code };
  if (!isPlatformAdmin && tenantId) {
    clientFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
  }

  const client = await ClientModel.findOne(clientFilter).lean() as any;
  if (!client) {
    throw new Error("Client not found");
  }

  const projectFilter: any = { client_code };
  if (!isPlatformAdmin && tenantId) {
    projectFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
  }
  if (start_date && end_date) {
    projectFilter.start_date = { $lte: end_date };
    projectFilter.end_date = { $gte: start_date };
  }

  const projects = await Project.find(projectFilter).lean() as any[];
  const projectCodes = projects.map(p => p.project_code);

  if (projectCodes.length === 0) {
    return {
      ...client,
      id: client._id.toString(),
      project: []
    };
  }

  const getProjectSummaryByCode = async (projectCode: string) => {
    const p = await Project.findOne({ project_code: projectCode }).lean() as any;
    if (!p) return null;

    const milestones = await Milestone.find({ project_code: projectCode }).lean() as any[];
    const tasks = await Task.find({ project_code: projectCode }).lean() as any[];
    const taskParticipants = await TaskParticipant.find({ project_code: projectCode }).lean() as any[];
    const logs = await TaskParticipantLog.find({ project_code: projectCode }).lean() as any[];

    const totalmilestone_count = milestones.length;
    const archivedmilestone_count = milestones.filter(m => m.status === 'archived').length;
    const verifiedmilestone_count = milestones.filter(m => m.status === 'verified').length;

    const totaltask_count = tasks.length;
    const archivedtask_count = tasks.filter(t => t.status === 'archived').length;
    const verifiedtask_count = tasks.filter(t => t.status === 'verified-closed').length;
    const reworktask_count = tasks.filter(t => t.status === 'rework').length;

    const participant_idtotal = taskParticipants.length;
    const participantarchivedcount = taskParticipants.filter(tp => tp.status === 'archived').length;
    const participant_verified_closed_countts = taskParticipants.filter(tp => tp.status === 'verified-closed').length;

    const total_seconds = logs.reduce((acc, l) => acc + ((l.duration || 0) * 60), 0);

    const hh = Math.floor(total_seconds / 3600).toString().padStart(2, "0");
    const mm = Math.floor((total_seconds % 3600) / 60).toString().padStart(2, "0");
    const ss = (total_seconds % 60).toString().padStart(2, "0");

    return {
      ...p,
      id: p._id.toString(),
      totalmilestone_count,
      archivedmilestone_count,
      "verified-closedmilestone_count": verifiedmilestone_count,
      totaltask_count,
      archivedtask_count,
      "verified-closedtask_count": verifiedtask_count,
      reworktask_count,
      participant_idtotal,
      participantarchivedcount,
      "participant_id_verified-closed_countts": participant_verified_closed_countts,
      total_duration_seconds: total_seconds,
      totalprojectworkinghrsduration: `${hh}:${mm}:${ss}`
    };
  };

  const projectSummaries = await Promise.all(
    projectCodes.map(code => getProjectSummaryByCode(code))
  );

  return {
    ...client,
    id: client._id.toString(),
    project: projectSummaries.filter(Boolean)
  };
};