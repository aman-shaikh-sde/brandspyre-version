import { Task, TaskParticipant } from '../../db/ModelSceham/project/client';

const MODEL_MAP: Record<string, any> = {
  task: Task,
  task_participants: TaskParticipant
};

export const getCompletedTask = async (
    tableName: string,
    fieldName: string,
    fieldValue: string | number
  ) => {
    try {
      const allowedTables = ["task", "task_participants"];
      const allowedFields = ["task_id", "milestone_code", "project_code", "client_code"];
  
      if (!allowedTables.includes(tableName) || !allowedFields.includes(fieldName)) {
        throw new Error("Invalid table or field");
      }
  
      const model = MODEL_MAP[tableName];
      const filter: any = {};
      filter[fieldName] = fieldValue;

      const totalCount = await model.countDocuments(filter);
      const completedCount = await model.countDocuments({
        ...filter,
        status: 'completed'
      });

      const percentage = totalCount === 0 ? 0 : parseFloat(((completedCount / totalCount) * 100).toFixed(2));
  
      return {
        success: true,
        total_count: totalCount,
        completed_count: completedCount,
        completion_percentage: percentage,
      };
    } catch (error:any) {
      console.error("Error in getCompletionStats:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  };