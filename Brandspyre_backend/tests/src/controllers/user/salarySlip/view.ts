import { Request, Response } from "express";

export const viewUserSalarySlipInfo = async (_req: Request, res: Response): Promise<void> => {
    const msgField = `View User Salary Slip Info`;
    try {
        res.status(201).json({ message: `${msgField} Success` }); 
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${msgField} Causes Error Message: ${message}`);
        res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
    }
};