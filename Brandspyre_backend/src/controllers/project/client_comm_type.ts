import { ClientModel } from "../../db/ModelSceham/project/client";
"use strict";
import { Request, Response } from "express";


export const getindTypes = async (req: Request, res: Response) => {
  try {
    const commTypes = await ClientModel.distinct("comm_type", { comm_type: { $nin: [null, ""] } });
    const indTypes = await ClientModel.distinct("industry_type", { industry_type: { $nin: [null, ""] } });

    res.json({
      comm_types: commTypes.filter(Boolean),
      ind_types: indTypes.filter(Boolean),
    });
  } catch (error) {
    console.error("Error fetching lead meta", error);
    res.status(500).json({ error: "Failed to fetch lead meta" });
  }
};
