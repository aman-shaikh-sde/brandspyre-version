import { Project, Milestone, Task, TaskParticipant } from '../../db/ModelSceham/project/client';

const MODEL_MAP: Record<string, any> = {
  project: Project,
  milestone: Milestone,
  task: Task,
  task_participants: TaskParticipant
};

export const getProject = async (
    tableName: string,
    fieldName: string,
    fieldValue: string | number
  ) => {
    try {
      const allowedTables = ["project", "milestone", "task", "task_participants"];
      const allowedFields = ["client_code", "project_code", "milestone_code", "task_id"];
  
      if (!allowedTables.includes(tableName) || !allowedFields.includes(fieldName)) {
        throw new Error("Invalid table or field name");
      }

      const model = MODEL_MAP[tableName];
      const filter: any = {};
      filter[fieldName] = fieldValue;

      const totalCount = await model.countDocuments(filter);
      const completedOrArchivedCount = await model.countDocuments({
        ...filter,
        status: { $in: ['completed', 'archived'] }
      });

      const percentage = totalCount === 0 ? 0 : parseFloat(((completedOrArchivedCount / totalCount) * 100).toFixed(2));
  
      return {
        success: true,
        table: tableName,
        filter_field: fieldName,
        filter_value: fieldValue,
        total_count: totalCount,
        completed_or_archived_count: completedOrArchivedCount,
        completion_percentage: percentage
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
};