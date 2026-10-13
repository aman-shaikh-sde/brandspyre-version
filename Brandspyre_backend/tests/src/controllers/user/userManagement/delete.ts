import mongoose from "mongoose";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserTenant } from "../../../db/ModelSceham/saasSchema";
import { Request, Response } from "express";
import { getTenantFilter } from "../../../utils/tenantScope";

export const deleteUsers = async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.securityContext?.userId || req.user?.userId;
  let { type, status, staff_id } = req.body;

  const targetId = staff_id || currentUserId;

  const deleteType = type as string;
  const newStatus = status as string;

  const validStatus = ["active", "inactive", "relive", "pending", "abscond", "resigned", "terminated"];
  const session = await mongoose.startSession();

  try {
    if (deleteType !== "permanent" && deleteType !== "temp") {
      res.status(400).json({ error: "Invalid type. Must be 'permanent' or 'temp'" });
      return;
    }

    if (deleteType === "temp") {
      if (!newStatus || !validStatus.includes(newStatus)) {
        res.status(400).json({
          error: `Invalid status. Allowed: ${validStatus.join(", ")}`
        });
        return;
      }
    }

    session.startTransaction();

    const tenantFilter = getTenantFilter(req);
    const userFilter: any = {
      ...tenantFilter,
      $or: [
        { staff_id: String(targetId) },
        ...(mongoose.Types.ObjectId.isValid(String(targetId)) ? [{ _id: new mongoose.Types.ObjectId(String(targetId)) }] : [])
      ]
    };

    const existingUsers = await UserInfo.find(userFilter).session(session).lean();

    if (!existingUsers || existingUsers.length === 0) {
      await session.abortTransaction();
      res.status(404).json({ error: "User not found within your organization." });
      return;
    }

    const matchedUserIds = existingUsers.map((u: any) => u._id);

    if (deleteType === "permanent") {
      await UserInfo.deleteMany({ _id: { $in: matchedUserIds }, ...tenantFilter }).session(session);

      // Clean up tenant membership if tenantFilter has tenant_id
      if (tenantFilter.tenant_id) {
        await UserTenant.deleteMany({
          user_id: { $in: matchedUserIds },
          tenant_id: tenantFilter.tenant_id
        }).session(session);
      }
    } else {
      await UserInfo.updateMany(
        { _id: { $in: matchedUserIds }, ...tenantFilter },
        { $set: { status: newStatus } }
      ).session(session);

      if (tenantFilter.tenant_id && ["inactive", "resigned", "terminated"].includes(newStatus)) {
        await UserTenant.updateMany(
          { user_id: { $in: matchedUserIds }, tenant_id: tenantFilter.tenant_id },
          { $set: { is_active: false, status: newStatus } }
        ).session(session);
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message:
        deleteType === "permanent"
          ? "User permanently deleted."
          : `User status changed to '${newStatus}'.`
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`deleteUsers Error: ${message}`);
    res.status(500).json({ error: message });
  } finally {
    session.endSession();
  }
};

export default deleteUsers;