import mongoose from 'mongoose';
import { Request, Response, NextFunction } from "express";

import {clientwiseSummary} from './Client-wiseSummary Report'


interface AuthenticatedUser {
    userId: number;
    userRole: string;
    brcode:string;
  }


export const getBranchwiseSummaryAnalysis = async (req: Request, res: Response) => {
    const msgField = `Add Collaborators to Task`;
    const { userId } = req.user as AuthenticatedUser;
    let { branchcode, start_date,client_code, end_date ,sortField,  sortDirection} = req.query as { 
      branchcode?: string, client_code?:string, start_date:string, end_date:string ,sortField:string, sortDirection:string
    };
    const session = await mongoose.startSession();
    try {
      console.log("branchcode", branchcode)

      // Ensure sortDirection is either "ASC" or "DESC"
      const validSortDirection = (sortDirection === "ASC" || sortDirection === "DESC") ? sortDirection : "ASC";
      const result = await clientwiseSummary( 
        branchcode ?? null,
        client_code ?? null,
        start_date ?? null,
        end_date ?? null,
        sortField ?? "total_projects",
        validSortDirection
      );
          res.status(200).json({ message: `${msgField} successful`, data: result, });
        } catch (error) {
          await session.abortTransaction();
          const message = error instanceof Error ? error.message : String(error);
          console.error(`${msgField} failed: ${message}`);
          res.status(500).json({ error: `${msgField} failed: ${message}` });
        } finally {
          session.endSession();
        }
}

