import { Milestone, Task, TaskParticipant, TaskParticipantLog, Client, Project } from '../../../db/ModelSceham/project/client';
import { Team } from '../../../db/ModelSceham/teams/team';
import { UserInfo } from '../../../db/ModelSceham/userSchema';
import { Branch } from '../../../db/ModelSceham/branchSchema';
import { Campaign } from '../../../db/ModelSceham/project/campagin';

export const getMilestoneDetailsWithTasks = async (milestone_code: string, project_code: string) => {
    if (!milestone_code) throw new Error("milestone_code is required");
    if (!project_code) throw new Error("project_code is required");
  
    const milestone = await Milestone.findOne({ milestone_code, project_code });
    if (!milestone) return null;

    const tasks = await Task.find({ milestone_code });

    const taskIds = tasks.map(t => t._id);

    const participantStats = await TaskParticipant.aggregate([
      { $match: { task_id: { $in: taskIds } } },
      {
        $group: {
          _id: "$task_id",
          total: { $sum: 1 },
          archived: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
          verified: { $sum: { $cond: [{ $eq: ["$status", "verified-closed"] }, 1, 0] } }
        }
      }
    ]);

    const durationStats = await TaskParticipantLog.aggregate([
      { $match: { task_id: { $in: taskIds } } },
      {
        $group: {
          _id: "$task_id",
          total_seconds: { $sum: { $multiply: ["$duration", 60] } }
        }
      }
    ]);

    const participantStatsMap = new Map(participantStats.map(s => [String(s._id), s]));
    const durationStatsMap = new Map(durationStats.map(s => [String(s._id), s]));

    const enrichedTasks = await Promise.all(tasks.map(async (task) => {
      const participantData = participantStatsMap.get(String(task._id)) || { total: 0, archived: 0, verified: 0 };
      const durationData = durationStatsMap.get(String(task._id)) || { total_seconds: 0 };

      const secs = Number(durationData.total_seconds) || 0;
      const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
      const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
      const ss = String(secs % 60).padStart(2, "0");

      const client = await Client.findOne({ client_code: task.client_code });
      const project = await Project.findOne({ project_code: task.project_code });
      const milestone = await Milestone.findOne({ milestone_code: task.milestone_code });
      const team = await Team.findOne({ team_id: task.team_id });
      const handler = await UserInfo.findOne({ staff_id: task.handler_by });
      const branch = await Branch.findOne({ branchcode: task.branchcode });
      const campaign = await Campaign.findOne({ campaign_code: task.campaign_code });

      return {
        ...task.toObject(),
        client_name: client?.client_name,
        projecttitle: project?.title,
        milestonetitle: milestone?.miles_title,
        teamname: team?.team_name,
        handlername: handler ? `${handler.firstname} ${handler.lastname}` : null,
        branchname: branch?.branchname,
        campaignname: campaign?.title,
        participant_idtotal: participantData.total,
        participantarchivedcount: participantData.archived,
        "participant_id_verified-closed_countts": participantData.verified,
        total_duration_seconds: durationData.total_seconds,
        totalprojectworkinghrsduration: `${hh}:${mm}:${ss}`,
      };
    }));

    return {
      ...milestone.toObject(),
      task: enrichedTasks,
    };
  };