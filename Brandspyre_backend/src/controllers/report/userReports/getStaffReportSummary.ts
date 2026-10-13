import mongoose from 'mongoose';
import { Project, TaskParticipant, TaskParticipantLog, Milestone, Task } from "../../../db/ModelSceham/project/client";
import { UserInfo } from "../../../db/ModelSceham/userSchema";

export async function getStaffReportSummary(staff_id: string, start_date: string, end_date: string) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const start = new Date(start_date);
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999);

    const result = {
      staff_id,
      start_date,
      end_date,
      total_projects_worked: 0,
      total_tasks: 0,
      total_duration_minutes: 0,
      total_working_hours: 0,
      overallstaffrating: "0.00",
      projectsummary: [] as any[]
    };

    // 1. Get distinct project codes staff worked on in the date range
    const participations = await TaskParticipant.find({
      staff_id: staff_id,
      created_on: { $gte: start, $lte: end }
    }).session(session).lean() as any[];

    const projectCodes = [...new Set(participations.map(p => p.project_code))];
    result.total_projects_worked = projectCodes.length;

    let totalRatingSum = 0;
    let ratingCount = 0;

    for (const projectCode of projectCodes) {
      // Get project info
      const proj = await Project.findOne({ project_code: projectCode }).session(session).lean() as any;
      if (!proj) continue;

      const milestones = await Milestone.find({ project_code: projectCode }).session(session).lean() as any[];
      const milestones_summary = [];

      let projectRatingSum = 0;
      let projectRatingCount = 0;

      for (const ms of milestones) {
        const milestoneCode = ms.milestone_code;

        // Fetch milestone tasks
        const milestoneTasks = await Task.find({ milestone_code: milestoneCode }).session(session).lean() as any[];
        const milestoneParticipants = await TaskParticipant.find({ milestone_code: milestoneCode }).session(session).lean() as any[];

        // Fetch milestone logs
        const milestoneLogs = await TaskParticipantLog.find({ milestone_code: milestoneCode }).session(session).lean() as any[];
        const milestoneWorkingMinutes = milestoneLogs.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
        const milestoneWorkingHours = Math.round((milestoneWorkingMinutes / 60) * 100) / 100;

        // Milestone ratings average
        const ratings = milestoneParticipants.map(p => Number(p.rating)).filter(r => !isNaN(r) && r > 0);
        const milestoneRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + r, 0) / ratings.length) : 0;
        
        projectRatingSum += milestoneRating;
        projectRatingCount++;

        // Filter participants for this staff under the milestone
        const staffParts = milestoneParticipants.filter(p => p.staff_id === staff_id);

        const taskparticipantsummary = [];
        if (staffParts.length > 0) {
          const user = await UserInfo.findOne({ staff_id }).session(session).lean() as any;
          const firstname = user ? user.firstname : "";
          const lastname = user ? user.lastname : "";

          const staffRatings = staffParts.map(p => Number(p.rating)).filter(r => !isNaN(r) && r > 0);
          const avg_rating = staffRatings.length > 0 ? (staffRatings.reduce((s, r) => s + r, 0) / staffRatings.length) : 0;

          taskparticipantsummary.push({
            staff_id,
            firstname,
            lastname,
            total_tasks: staffParts.length,
            total_draft: staffParts.filter(p => p.status === 'draft').length,
            total_inprogress: staffParts.filter(p => ['inprocess', 'inprogress', 'ongoing'].includes(p.status)).length,
            total_archived: staffParts.filter(p => p.status === 'archived').length,
            total_drop: staffParts.filter(p => p.status === 'drop' || p.status === 'dropped').length,
            total_verified_closed: staffParts.filter(p => ['verified', 'closed', 'completed'].includes(p.status)).length,
            total_duration_minutes: staffParts.reduce((sum, p) => sum + (Number(p.task_duration) || 0), 0),
            total_avgrating: avg_rating.toFixed(2)
          });
        }

        const overall_task_duration = staffParts.reduce((sum, p) => sum + (Number(p.task_duration) || 0), 0);
        const overall_working_hours = Math.round((staffParts.reduce((sum, p) => sum + (Number(p.task_duration) || 0), 0) / 60) * 100) / 100;

        const milestone = {
          milestone_code: milestoneCode,
          total_tasks: milestoneTasks.length,
          total_draft: milestoneTasks.filter(t => t.status === 'draft').length,
          total_inprogress: milestoneTasks.filter(t => ['inprocess', 'inprogress', 'ongoing'].includes(t.status)).length,
          total_verified_closed: milestoneTasks.filter(t => ['verified', 'closed', 'completed'].includes(t.status)).length,
          total_archived: milestoneTasks.filter(t => t.status === 'archived').length,
          overall_task_duration,
          overall_working_hours: milestoneWorkingHours,
          overall_milestone_rating: milestoneRating.toFixed(2),
          taskparticipantsummary
        };

        result.total_tasks += milestone.total_tasks;
        result.total_duration_minutes += milestone.overall_task_duration;
        result.total_working_hours += milestone.overall_working_hours;

        milestones_summary.push(milestone);
      }

      const projectRating = projectRatingCount > 0 ? (projectRatingSum / projectRatingCount) : 0;
      totalRatingSum += projectRating;
      ratingCount++;

      result.projectsummary.push({
        project_code: projectCode,
        start_date: proj.start_date,
        end_date: proj.end_date,
        status: proj.status,
        overallprojectrating: projectRating.toFixed(2),
        milestones_summary
      });
    }

    result.overallstaffrating = ratingCount > 0 ? (totalRatingSum / ratingCount).toFixed(2) : "0.00";

    await session.commitTransaction();
    return result;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
