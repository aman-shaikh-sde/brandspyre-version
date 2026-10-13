import { RoleAccess } from "../../db/ModelSceham/roleAccessSchema";

export const checkavailableBranch = async (role: any, branchId: any) => {
  try {
    const existingBranch = await RoleAccess.findOne({
      role: String(role).toLowerCase(),
      branch_id: branchId
    }).lean();

    if (!existingBranch) {
      throw new Error("Branch with the same role does not exist.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`checkavailableBranch Error Message: ${message}`);
    throw message;
  }
};