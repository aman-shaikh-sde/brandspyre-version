import { PerformanceReview } from "../../../db/ModelSceham/user/9_salary";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Team } from "../../../db/ModelSceham/teams/team";
import { Request, Response, NextFunction } from "express";

export const createSelfRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      branchcode,
      reporting_to,
      team_id,
      staff_id,
      review_year,
      self_timeliness_rating,
      self_timeliness_comments,
      self_quality_rating,
      self_quality_comments,
      self_communication_rating,
      self_communication_comments,
      self_initiative_rating,
      self_initiative_comments,
      self_interaction_rating,
      self_interaction_comments,
      self_attendance_rating,
      self_attendance_comments,
      what_went_well,
      challenges_faced,
      support_needed,
      improvement_suggestions,
      new_skills_learned,
      areas_to_improve,
      self_rating_overall,
      self_training_required,
      self_overall_feedback,
      self_trainings_attended,
      status,
      tasks_completed_ontime,
      total_daysabsent,
      total_daysleave,
      total_dayspresent,
      total_duration_minutes,
      total_project_worked,
      total_task,
      total_task_participantavgrating,
      total_tasks_handled,
      total_workingdays,
      year_of_experience,
    } = req.body;

    const count = await PerformanceReview.countDocuments();
    const newId = `REV_${count + 1}`;

    const staff = await UserInfo.findOne({ staff_id }).lean() as any;
    if (!staff) {
      res.status(400).json({ success: false, message: "Invalid staff_id" });
      return;
    }
    const staffName = `${staff.firstname || ''} ${staff.lastname || ''}`.trim();

    let teamName = '';
    let lead_id = '';
    let leadName = '';

    if (team_id) {
      const team = await Team.findOne({ team_id }).lean() as any;
      if (team) {
        teamName = team.team_name || '';
        lead_id = team.team_lead || '';
        if (lead_id) {
          const lead = await UserInfo.findOne({ staff_id: lead_id }).lean() as any;
          if (lead) leadName = `${lead.firstname || ''} ${lead.lastname || ''}`.trim();
        }
      }
    }

    const review = await PerformanceReview.create({
      performance_id: newId,
      staff_id,
      review_year,
      self_timeliness_rating,
      self_timeliness_comments,
      self_quality_rating,
      self_quality_comments,
      self_communication_rating,
      self_communication_comments,
      self_initiative_rating,
      self_initiative_comments,
      self_interaction_rating,
      self_interaction_comments,
      self_attendance_rating,
      self_attendance_comments,
      what_went_well,
      challenges_faced,
      support_needed,
      improvement_suggestions,
      new_skills_learned,
      areas_to_improve,
      self_rating_overall,
      self_training_required,
      self_overall_feedback,
      self_trainings_attended,
      branchcode,
      reporting_to,
      team_id,
      name: staffName,
      designation: staff.desigantion,
      department: staff.department,
      lead_id,
      lead_name: leadName,
      team_name: teamName,
      status,
      tasks_completed_ontime,
      total_daysabsent,
      total_daysleave,
      total_dayspresent,
      total_duration_minutes,
      total_project_worked,
      total_task,
      total_task_participantavgrating,
      total_tasks_handled,
      total_workingdays,
      year_of_experience,
    });

    res.status(201).json({
      success: true,
      message: "Self rating saved successfully",
      performance_id: (review as any).performance_id,
    });
  } catch (err) {
    console.error("Error saving self rating:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
