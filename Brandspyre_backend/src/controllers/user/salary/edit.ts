import mongoose from 'mongoose';
import { Request, Response } from "express";
import { UserSalary, PerformanceReview } from "../../../db/ModelSceham/user/9_salary";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import {processSalaryIncrement} from './salaryIncrement'

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface UserData {
  staff_id: string,
  basicsalary?: string | number,
  hra?: string | number,
  lpa?: string | number,
  gross_salary?: string | number,
  net_salary?: string | number,
  bonus?: string | number,
  pf?: string | number,
  esi?: string | number,
  tds?: string | number,
  other_allowance?: string | number,
  deductions?: string | number,
  remarks?: string,
  processondate?: string,
  processtilldate?: string,
  status?: string,
  [key: string]: string | number | undefined;
}

export const editUserSalaryInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit User Salary Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { userData } = req.body as { userData: UserData };
  const id = userData.user_id;
  const loginId = id ? id : idObj;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!existingUser) {
      res.status(409).json({ error: `User not found` });
      await session.abortTransaction();
      return;
    }

    const requiredFields = ['staff_id'];
    const missingFields = requiredFields.filter(
      field => !(userData as Record<string, string | undefined>)[field]
    );
    if (missingFields.length > 0) {
      res.status(400).json({ error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}` });
      await session.abortTransaction();
      return;
    }

    const filter = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id, staff_id: loginId }
      : { id: Number(req.params.id), staff_id: loginId };

    const cleanUpdateObj = (obj: any) => {
      const resObj: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== "") {
          resObj[k] = v;
        }
      }
      return resObj;
    };

    const updateRes = await UserSalary.findOneAndUpdate(
      filter,
      { $set: cleanUpdateObj(userData) },
      { new: true, session }
    ).lean();

    if (!updateRes) {
      res.status(404).json({ message: 'given row ids is not found' });
      await session.abortTransaction();
      return;
    }

    await session.commitTransaction();
    res.status(201).json({ message: `${msgField} Success`, result: { ...updateRes, id: updateRes._id.toString() } });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};

export const teamLeadRating = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Team Lead FeedBack Rating Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { reviewData } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let loginId = reviewData.lead_id ? reviewData.lead_id : idObj;
    if (!reviewData.performance_id || !reviewData.lead_id) {
      throw new Error("Performance ID and Lead ID are required");
    }

    const existingReview = await PerformanceReview.findOne({
      performance_id: reviewData.performance_id,
      lead_id: loginId
    }).session(session).lean();

    if (!existingReview) {
      res.status(404).json({
        error: `Performance review not found for ID ${reviewData.performance_id}`
      });
      await session.abortTransaction();
      return;
    }

    const cleanUpdateObj = (obj: any) => {
      const resObj: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== "") {
          resObj[k] = v;
        }
      }
      return resObj;
    };

    const updatedReview = await PerformanceReview.findOneAndUpdate(
      { performance_id: reviewData.performance_id, lead_id: loginId },
      { $set: { ...cleanUpdateObj(reviewData), updated_on: new Date() } },
      { new: true, session }
    ).lean();

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} updated successfully`,
      data: updatedReview ? { ...updatedReview, id: updatedReview._id.toString() } : null
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};

export const managementRating = async (req: Request, res: Response): Promise<void> => {
  const msgField = `HR Managment FeedBack Rating Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { reviewData } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existingReview = await PerformanceReview.findOne({
      performance_id: reviewData.performance_id
    }).session(session).lean() as any;

    if (!existingReview) {
      res.status(404).json({
        error: `Performance review not found for ID ${reviewData.performance_id}`
      });
      await session.abortTransaction();
      return;
    }

    let closingDate = reviewData.closingDate;
    delete reviewData.closingDate;

    const cleanUpdateObj = (obj: any) => {
      const resObj: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== "") {
          resObj[k] = v;
        }
      }
      return resObj;
    };

    const updatedReview = await PerformanceReview.findOneAndUpdate(
      { performance_id: reviewData.performance_id },
      { $set: { ...cleanUpdateObj(reviewData), updated_on: new Date() } },
      { new: true, session }
    ).lean() as any;

    if (reviewData.increment_percentage && reviewData.increment_effective_date) {
      await processSalaryIncrement(
        session,
        existingReview.staff_id,
        reviewData.increment_percentage,
        reviewData.performance_id,
        reviewData.hr_rating,
        closingDate,
        reviewData.increment_effective_date,
        reviewData.status,
        reviewData.hr_comments || ''
      );
    }

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} updated successfully`,
      data: updatedReview ? { ...updatedReview, id: updatedReview._id.toString() } : null
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};