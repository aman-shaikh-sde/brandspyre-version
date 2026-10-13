import { UserInfo } from "../../db/ModelSceham/userSchema";

"use strict";
import { Request, Response } from "express";


export const getBloodTypes = async (req: Request, res: Response) => {
  try {
    const bloodGroups = await UserInfo.distinct("bloodgroup", { bloodgroup: { $ne: null } });

    res.json({
      blood_types: bloodGroups.filter(Boolean)
    });
  } catch (error) {
    console.error("Error fetching blood meta", error);
    res.status(500).json({ error: "Failed to fetch blood meta" });
  }
};
