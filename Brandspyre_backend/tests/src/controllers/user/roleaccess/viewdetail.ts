import { Request, Response } from "express";
import { RoleAccess } from "../../../db/ModelSceham/roleAccessSchema";

export const getRoleAccessDetail = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.params;

  if (!role) {
    res.status(400).json({ status: false, message: "Missing role parameter." });
    return;
  }

  try {
    const roleAccessDoc = await RoleAccess.findOne({ role: role.toLowerCase() }).lean();

    if (!roleAccessDoc) {
      res.status(404).json({ status: false, message: "Role not found." });
      return;
    }

    res.status(200).json({ status: true, access: roleAccessDoc });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`getRoleAccess Error: ${message}`);
    res.status(500).json({ status: false, error: message });
  }
};
