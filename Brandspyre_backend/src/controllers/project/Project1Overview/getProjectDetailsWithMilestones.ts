import { Project, Milestone, Task, TaskParticipant, TaskParticipantLog } from '../../../db/ModelSceham/project/client';

export const getProjectDetailsWithMilestones = async (project_code: string) => {
    if (!project_code) throw new Error("project_code is required");
  
    const project = await Project.findOne({ project_code });
    if (!project) return null;

    const milestones = await Milestone.find({ project_code });

    const milestoneCodes = milestones.map(m => m.milestone_code);

    const taskStats = await Task.aggregate([
      { $match: { milestone_code: { $in: milestoneCodes } } },
      {
        $group: {
          _id: "$milestone_code",
          totaltask_count: { $sum: 1 },
          archivedtask_count: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
          verifiedtask_count: { $sum: { $cond: [{ $eq: ["$status", "verified-closed"] }, 1, 0] } },
          reworktask_count: { $sum: { $cond: [{ $eq: ["$status", "rework"] }, 1, 0] } }
        }
      }
    ]);

    const participantStats = await TaskParticipant.aggregate([
      { $match: { milestone_code: { $in: milestoneCodes } } },
      {
        $group: {
          _id: "$milestone_code",
          participant_idtotal: { $sum: 1 },
          participantarchivedcount: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
          verified_count: { $sum: { $cond: [{ $eq: ["$status", "verified-closed"] }, 1, 0] } }
        }
      }
    ]);

    const durationStats = await TaskParticipantLog.aggregate([
      { $match: { milestone_code: { $in: milestoneCodes }, duration: { $ne: null } } },
      {
        $group: {
          _id: "$milestone_code",
          total_seconds: { $sum: { $multiply: ["$duration", 60] } }
        }
      }
    ]);

    const taskStatsMap = new Map(taskStats.map(s => [s._id, s]));
    const participantStatsMap = new Map(participantStats.map(s => [s._id, s]));
    const durationStatsMap = new Map(durationStats.map(s => [s._id, s]));

    const enrichedMilestones = milestones.map(m => {
      const taskData = taskStatsMap.get(m.milestone_code) || { totaltask_count: 0, archivedtask_count: 0, verifiedtask_count: 0, reworktask_count: 0 };
      const participantData = participantStatsMap.get(m.milestone_code) || { participant_idtotal: 0, participantarchivedcount: 0, verified_count: 0 };
      const durationData = durationStatsMap.get(m.milestone_code) || { total_seconds: 0 };

      const totalSeconds = Number(durationData.total_seconds) || 0;
      const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
      const min = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
      const sec = (totalSeconds % 60).toString().padStart(2, "0");

      return {
        ...m.toObject(),
        totaltask_count: taskData.totaltask_count,
        archivedtask_count: taskData.archivedtask_count,
        "verified-closedtask_count": taskData.verifiedtask_count,
        reworktask_count: taskData.reworktask_count,
        participant_idtotal: participantData.participant_idtotal,
        participantarchivedcount: participantData.participantarchivedcount,
        participant_id_verified_closed_countts: participantData.verified_count,
        total_duration_seconds: durationData.total_seconds,
        totalprojectworkinghrsduration: `${hrs}:${min}:${sec}`,
      };
    });

    const projectObj = project.toObject();
    projectObj.milestone = enrichedMilestones;
    projectObj.overallcost = project.overallcost !== undefined && project.overallcost !== 0 ? project.overallcost : (project.revised_cost || project.budget || 0);
    projectObj.balance_amount = project.balance_amount !== undefined && project.balance_amount !== 0 ? project.balance_amount : (project.balance || 0);

    return projectObj;
  };