import { Milestone } from '../../db/ModelSceham/project/client';

export const getMilestones = async (
    tableName: string,
    fieldName: string,
    fieldValue: string | number
  ) => {
    try {
      const allowedTables = ["milestone"];
      const allowedFields = ["project_code"];
  
      if (!allowedTables.includes(tableName) || !allowedFields.includes(fieldName)) {
        throw new Error("Invalid table or field name");
      }
  
      const filter: any = {};
      filter[fieldName] = fieldValue;

      const totalCount = await Milestone.countDocuments(filter);
      const completedOrArchivedCount = await Milestone.countDocuments({
        ...filter,
        status: { $in: ['completed', 'archived'] }
      });

      const percentage = totalCount === 0 ? 0 : parseFloat(((completedOrArchivedCount / totalCount) * 100).toFixed(2));
  
      return {
        success: true,
        total: totalCount,
        completed_or_archived: completedOrArchivedCount,
        percentage: percentage,
      };
    } catch (error:any) {
      console.error("Error in getCompletionStats:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  };