import { TaskParticipant } from '../../db/ModelSceham/project/client';

export const getCompletedTaskParticipants = async (
    tableName: string,
    fieldName: string,
    fieldValue: string | number
  ) => {
    try {
      const allowedTables = ["task_participants"];
      const allowedFields = ["task_id", "project_code", "milestone_code", "client_code"];
  
      if (!allowedTables.includes(tableName) || !allowedFields.includes(fieldName)) {
        throw new Error("Invalid table name or field name");
      }
  
      const filter: any = {};
      filter[fieldName] = fieldValue;

      const totalCount = await TaskParticipant.countDocuments(filter);
      const completedOrArchivedCount = await TaskParticipant.countDocuments({
        ...filter,
        status: { $in: ['completed', 'archived'] }
      });

      const percentage = totalCount === 0 ? 0 : parseFloat(((completedOrArchivedCount / totalCount) * 100).toFixed(2));
  
      return {
        success: true,
        total_participants: totalCount,
        completed_or_archived: completedOrArchivedCount,
        progress_percentage: percentage,
      };
    } catch (error:any) {
      console.error("Error in getProgressStats:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  };