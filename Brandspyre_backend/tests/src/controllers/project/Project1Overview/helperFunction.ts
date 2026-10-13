import { Project, Milestone, Task, TaskParticipant, TaskParticipantLog } from '../../../db/ModelSceham/project/client';

export const getProjectSummaryByCode = async (project_code: string) => {
  if (!project_code) {
    throw new Error("project_code is required");
  }

  const project = await Project.findOne({ project_code });
  if (!project) {
    return null;
  }

  const projectObj = project.toObject();

  // TODO: Get handler_department from UserInfo model when available
  // const user = await UserInfo.findOne({ staff_id: project.handler_by });
  // projectObj.handler_department = user?.department;

  // Milestone aggregates
  const milestoneStats = await Milestone.aggregate([
    { $match: { project_code } },
    {
      $group: {
        _id: "$project_code",
        totalmilestone_count: { $sum: 1 },
        draftmilestone_count: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
        inprocessmilestone_count: { $sum: { $cond: [{ $eq: ["$status", "inprocess"] }, 1, 0] } },
        archivedmilestone_count: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
        dropmilestone_count: { $sum: { $cond: [{ $eq: ["$status", "drop"] }, 1, 0] } },
        verifiedmilestone_count: { $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] } },
        first_milestone_created_on: { $min: "$created_on" }
      }
    }
  ]);

  // Task aggregates
  const taskStats = await Task.aggregate([
    { $match: { project_code } },
    {
      $group: {
        _id: "$project_code",
        totaltask_count: { $sum: 1 },
        archivedtask_count: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
        drafttask_count: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
        inprocesstask_count: { $sum: { $cond: [{ $eq: ["$status", "inprocess"] }, 1, 0] } },
        verifiedtask_count: { $sum: { $cond: [{ $eq: ["$status", "verified-closed"] }, 1, 0] } },
        droptask_count: { $sum: { $cond: [{ $eq: ["$status", "drop"] }, 1, 0] } }
      }
    }
  ]);

  // Participant aggregates
  const participantStats = await TaskParticipant.aggregate([
    { $match: { project_code } },
    {
      $group: {
        _id: "$project_code",
        participant_idtotal: { $sum: 1 },
        participantinprocesscount: { $sum: { $cond: [{ $eq: ["$status", "inprocess"] }, 1, 0] } },
        participantdropcount: { $sum: { $cond: [{ $eq: ["$status", "drop"] }, 1, 0] } },
        participantreworkcount: { $sum: { $cond: [{ $eq: ["$status", "rework"] }, 1, 0] } },
        participantarchivedcount: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
        participantverifiedclosedcount: { $sum: { $cond: [{ $eq: ["$status", "verified-closed"] }, 1, 0] } }
      }
    }
  ]);

  // Log duration
  const durationStats = await TaskParticipantLog.aggregate([
    { $match: { project_code, duration: { $ne: null } } },
    {
      $group: {
        _id: "$project_code",
        total_seconds: { $sum: { $multiply: ["$duration", 60] } }
      }
    }
  ]);

  const milestoneData = milestoneStats[0] || { totalmilestone_count: 0, archivedmilestone_count: 0, verifiedmilestone_count: 0, first_milestone_created_on: null };
  const taskData = taskStats[0] || { totaltask_count: 0, archivedtask_count: 0, verifiedtask_count: 0 };
  const participantData = participantStats[0] || { participant_idtotal: 0, participantarchivedcount: 0, participantverifiedclosedcount: 0 };
  const durationData = durationStats[0] || { total_seconds: 0 };

  // Calculate days since milestone started
  let days_since_milestone_started = 0;
  if (milestoneData.first_milestone_created_on) {
    const now = new Date();
    const firstMilestone = new Date(milestoneData.first_milestone_created_on);
    const diffTime = Math.abs(now.getTime() - firstMilestone.getTime());
    days_since_milestone_started = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // TODO: Calculate days_since_advance_paid when project_payreq table is migrated to MongoDB

  const totalSeconds = Number(durationData.total_seconds) || 0;
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return {
    ...projectObj,
    handler_department: null, // TODO: populate from UserInfo
    totalmilestone_count: milestoneData.totalmilestone_count,
    archivedmilestone_count: milestoneData.archivedmilestone_count,
    "verified-closedmilestone_count": milestoneData.verifiedmilestone_count,
    totaltask_count: taskData.totaltask_count,
    archivedtask_count: taskData.archivedtask_count,
    "verified-closedtask_count": taskData.verifiedtask_count,
    participant_idtotal: participantData.participant_idtotal,
    participantarchivedcount: participantData.participantarchivedcount,
    "participantverified-closed_counts": participantData.participantverifiedclosedcount,
    total_duration_seconds: durationData.total_seconds,
    days_since_milestone_started,
    days_since_advance_paid: 0, // TODO: calculate when project_payreq is migrated
    totalprojectworkinghrsduration: `${hours}:${minutes}:${seconds}`,
  };
};
