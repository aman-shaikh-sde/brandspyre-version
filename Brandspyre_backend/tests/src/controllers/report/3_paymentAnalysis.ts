import Express, {Request, Response, NextFunction } from "express";
import {TotalInvoices, TotalIncomeExpenses} from './subReport/paymentAnalysis'

export const paymentAnalysis = async(req: Request, res:Response):Promise<void> => {
    try {
        const invoice:any = await TotalInvoices()
        const incomeExpenses:any = await TotalIncomeExpenses()
        
        res.status(200).json({ message: "Payment Analysis Success" }); 
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`Payment Analysis Causes Error Message: ${message}`);
        res.status(500).json({ error: message });
    }
}