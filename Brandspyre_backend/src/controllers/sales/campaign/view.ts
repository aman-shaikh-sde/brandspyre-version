import { Request, Response } from "express";

export const viewCampaign = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json({ message: "viewCampaign Success"});
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`viewCampaign Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}