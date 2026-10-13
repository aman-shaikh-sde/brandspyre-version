import mongoose from 'mongoose';
import { Project, TaskParticipant, TaskParticipantLog, Milestone } from "../../../db/ModelSceham/project/client";
import { UserInfo } from "../../../db/ModelSceham/userSchema";

export async function getProjectOverview(projectCode: string) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Fetch Project details
    const project = await Project.findOne({ project_code: projectCode }).session(session).lean() as any;
    if (!project) {
      throw new Error(`Project '${projectCode}' not found`);
    }

    // 2. Fetch all participants for the project to calculate overall task duration
    const allParticipants = await TaskParticipant.find({ project_code: projectCode }).session(session).lean() as any[];
    const total_task_duration = allParticipants.reduce((sum, r) => sum + (Number(r.task_duration) || 0), 0);

    // Fetch all logs to calculate overall working hours
    const allLogs = await TaskParticipantLog.find({ project_code: projectCode }).session(session).lean() as any[];
    const total_working_minutes = allLogs.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
    const overall_working_hours = Math.round((total_working_minutes / 60) * 100) / 100;

    // 3. Fetch all milestones for the project
    const milestones = await Milestone.find({ project_code: projectCode }, 'milestone_code').session(session).lean() as any[];

    const milestoneSummaries = [];

    for (const ms of milestones) {
      const milestoneCode = ms.milestone_code;

      // 4. Fetch all task participations under this milestone
      const milestoneParticipants = await TaskParticipant.find({ milestone_code: milestoneCode }).session(session).lean() as any[];

      // Fetch all logs under this milestone
      const milestoneLogs = await TaskParticipantLog.find({ milestone_code: milestoneCode }).session(session).lean() as any[];
      const milestoneWorkingMinutes = milestoneLogs.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
      const milestoneWorkingHours = Math.round((milestoneWorkingMinutes / 60) * 100) / 100;

      // Milestone level task counts
      const total_tasks = milestoneParticipants.length;
      const total_draft = milestoneParticipants.filter(r => r.status === 'draft').length;
      const total_inprogress = milestoneParticipants.filter(r => ['inprocess', 'inprogress', 'ongoing'].includes(r.status)).length;
      const total_verified_closed = milestoneParticipants.filter(r => ['verified', 'closed', 'completed'].includes(r.status)).length;
      const total_archived = milestoneParticipants.filter(r => r.status === 'archived').length;
      const overall_task_duration = milestoneParticipants.reduce((sum, r) => sum + (Number(r.task_duration) || 0), 0);

      // Group participants by staff_id to aggregate participant-level stats
      const staffGroups: { [staff_id: string]: any[] } = {};
      for (const r of milestoneParticipants) {
        if (!r.staff_id) continue;
        if (!staffGroups[r.staff_id]) {
          staffGroups[r.staff_id] = [];
        }
        staffGroups[r.staff_id].push(r);
      }

      const taskparticipantsummary = [];
      for (const [staff_id, rList] of Object.entries(staffGroups)) {
        // Query user names from UserInfo
        const user = await UserInfo.findOne({ staff_id }).session(session).lean() as any;
        const firstname = user ? user.firstname : "";
        const lastname = user ? user.lastname : "";

        taskparticipantsummary.push({
          staff_id,
          firstname,
          lastname,
          total_tasks: rList.length,
          total_draft: rList.filter(r => r.status === 'draft').length,
          total_inprogress: rList.filter(r => ['inprocess', 'inprogress', 'ongoing'].includes(r.status)).length,
          total_archived: rList.filter(r => r.status === 'archived').length,
          total_drop: rList.filter(r => r.status === 'drop' || r.status === 'dropped').length,
          total_verified_closed: rList.filter(r => ['verified', 'closed', 'completed'].includes(r.status)).length,
          total_duration_minutes: rList.reduce((sum, r) => sum + (Number(r.task_duration) || 0), 0)
        });
      }

      milestoneSummaries.push({
        milestone_code: milestoneCode,
        total_tasks,
        total_draft,
        total_inprogress,
        total_verified_closed,
        total_archived,
        overall_task_duration,
        overall_working_hours: milestoneWorkingHours,
        taskparticipantsummary
      });
    }

    await session.commitTransaction();

    return {
      project_code: project.project_code,
      project_details: {
        title: project.title,
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status,
        total_task_duration,
        overall_working_hours
      },
      milestones_summary: milestoneSummaries
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}