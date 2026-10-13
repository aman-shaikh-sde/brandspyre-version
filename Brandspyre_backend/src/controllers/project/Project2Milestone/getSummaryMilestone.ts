import { Milestone, Task, TaskParticipant, TaskParticipantLog } from '../../../db/ModelSceham/project/client';

export const getMilestoneSummaryByCode = async (milestone_code: string) => {
    if (!milestone_code) {
      throw new Error("milestone_code is required");
    }
  
    const milestone = await Milestone.findOne({ milestone_code });
    if (!milestone) {
      return null;
    }

    const taskStats = await Task.aggregate([
      { $match: { milestone_code } },
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
      { $match: { milestone_code } },
      {
        $group: {
          _id: "$milestone_code",
          participant_idtotal: { $sum: 1 },
          participantarchivedcount: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
          participantverifiedclosedcount: { $sum: { $cond: [{ $eq: ["$status", "verified-closed"] }, 1, 0] } }
        }
      }
    ]);

    const durationStats = await TaskParticipantLog.aggregate([
      { $match: { milestone_code, duration: { $ne: null } } },
      {
        $group: {
          _id: "$milestone_code",
          total_seconds: { $sum: { $multiply: ["$duration", 60] } }
        }
      }
    ]);

    const taskData = taskStats[0] || { totaltask_count: 0, archivedtask_count: 0, verifiedtask_count: 0, reworktask_count: 0 };
    const participantData = participantStats[0] || { participant_idtotal: 0, participantarchivedcount: 0, participantverifiedclosedcount: 0 };
    const durationData = durationStats[0] || { total_seconds: 0 };

    const totalSeconds = Number(durationData.total_seconds) || 0;
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");

    return {
      ...milestone.toObject(),
      totaltask_count: taskData.totaltask_count,
      archivedtask_count: taskData.archivedtask_count,
      "verified-closedtask_count": taskData.verifiedtask_count,
      reworktask_count: taskData.reworktask_count,
      participant_idtotal: participantData.participant_idtotal,
      participantarchivedcount: participantData.participantarchivedcount,
      "participant_id_verified-closed_countts": participantData.participantverifiedclosedcount,
      total_duration_seconds: durationData.total_seconds,
      totalprojectworkinghrsduration: `${hours}:${minutes}:${seconds}`,
    };
  };