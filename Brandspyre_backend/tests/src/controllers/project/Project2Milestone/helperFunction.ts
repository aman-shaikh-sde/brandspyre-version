import { Milestone, Project, Client } from '../../../db/ModelSceham/project/client';
import mongoose from 'mongoose';

// Utility function to calculate duration
export const calculateDurationDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Utility function to update project revision fields
  export const updateProjectRevision = async (project_code: string): Promise<void> => {
    await Project.findOneAndUpdate(
      { project_code },
      { $inc: { revised_count: 1 } }
    );
  };
  
  // Validate and build single milestone
  export const processMilestone = async (userData: any, loginId: string) => {
    const existingProject = await Project.findOne({ project_code: userData.project_code });
      
    if (!existingProject) {
      throw new Error("Given Project Id not in our Project database");
    }

    userData.branchcode = existingProject.branchcode;
    userData.client_code = existingProject.client_code;
    userData.campaign_code = existingProject.campaign_code || undefined;

    const requiredFields = [
      'branchcode', 'client_code', 'project_code', 'milestone_code',
      'milestone_type', 'miles_title', 'start_date', 'end_date',
       'handler_by', 'status'
    ];
  
    const missingFields = requiredFields.filter(field => !(userData as Record<string, string | undefined>)[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  
    const client = await Client.findOne({ client_code: userData.client_code });
    if (!client) throw new Error("Client not found");
  
    userData.milestone_code = `${userData.project_code}-${userData.milestone_code}`;
    userData.createby = loginId;

    if (userData.approved_staff_id) {
      // Note: Would need to check if user exists in UserInfo model
    }

    const count = (existingProject.milestone_count || 0) + 1;
    await Project.findOneAndUpdate(
      { project_code: userData.project_code },
      { milestone_count: count },
      { new: true }
    );

    userData.duration_days = calculateDurationDays(userData.start_date, userData.end_date);
    await updateProjectRevision(userData.project_code);
  
    const newMilestone = await Milestone.create({
      milestone_code: userData.milestone_code,
      branchcode: userData.branchcode,
      campaign_code: userData.campaign_code,
      project_code: userData.project_code,
      client_code: userData.client_code,
      milestone_type: userData.milestone_type,
      miles_title: userData.miles_title,
      start_date: new Date(userData.start_date),
      end_date: new Date(userData.end_date),
      duration_days: userData.duration_days,
      base_amount: userData.base_amount || 0,
      additional_amount: userData.additional_amount || 0,
      total_amount: userData.total_amount || 0,
      paystatus: userData.paystatus || 'none',
      revision_reason: userData.revision_reason,
      status: userData.status,
      handler_by: userData.handler_by,
      createby: userData.createby,
      approved_staff_id: userData.approved_staff_id,
      isrevised: userData.isrevised || false,
      created_on: new Date(),
      updated_on: new Date()
    });

    return newMilestone;
  };

  