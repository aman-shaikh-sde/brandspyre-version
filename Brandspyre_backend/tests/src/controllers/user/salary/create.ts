import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserSalary, PerformanceReview } from "../../../db/ModelSceham/user/9_salary";
import { Team } from "../../../db/ModelSceham/teams/team";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const createUserSalaryInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create User's Salary Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { userDatas } = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      await session.abortTransaction();
      return;
    }

    const createdUsers = [];
    const failedUsers = [];
    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw };
      try {
        if (userData.basicsalary) {
          userData.basicsalary = Number(userData.basicsalary);
        }
        if (userData.hra) {
          userData.hra = Number(userData.hra);
        }
        let idParam = userData.staff_id;
        let loginId = idParam ? idParam : idObj;

        const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
        if (!existingUser) {
          res.status(409).json({ error: `User not found` });
          await session.abortTransaction();
          return;
        }

        const requiredFields = ['staff_id', 'processondate'];
        const missingFields = requiredFields.filter(
          field => !(userData as Record<string, any>)[field]
        );
        if (missingFields.length > 0) {
          res.status(400).json({ error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}` });
          await session.abortTransaction();
          return;
        }

        if (userData.status === "active") {
          const newStartDate = new Date(userData.processondate);
          const endDate = new Date(newStartDate);
          endDate.setDate(endDate.getDate() - 1);
          const endDateStr = endDate.toISOString().split("T")[0];

          await UserSalary.updateMany(
            { staff_id: userData.staff_id, status: 'active' },
            { $set: { status: 'inactive', processtilldate: endDateStr } }
          ).session(session);
        }

        if (!userData.status) {
          userData.status = "active";
        }
        if (!userData.processtilldate) {
          userData.processtilldate = null;
        }

        const [createdDoc] = await UserSalary.create([userData], { session });
        const obj = createdDoc.toObject() as any;
        obj.id = obj._id.toString();
        createdUsers.push(obj);

      } catch (err) {
        failedUsers.push({
          user: userDataRaw,
          error: (err instanceof Error ? err.message : String(err))
        });
      }
    }

    if (createdUsers.length > 0) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
    }
    res.status(201).json({
      message: `Bulk ${msgField} result`,
      successCount: createdUsers.length,
      failedCount: failedUsers.length,
      createdUsers,
      failedUsers
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

export const generateCustomId = async (prefix: string, count: number): Promise<string> => {
  const nextNumber = count + 1;
  const digitCount = nextNumber.toString().length;
  const paddedNumber = String(nextNumber).padStart(Math.max(digitCount, 3), '0');
  return `${prefix}_${paddedNumber}`;
};

export const createPerformanceReview = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    if (!req.body || !req.body.reviewData) {
      res.status(400).json({ error: "Request body must contain reviewData" });
      return;
    }

    const { reviewData } = req.body;

    if (!reviewData.staff_id || !reviewData.team_id || !reviewData.review_year) {
      res.status(400).json({
        error: "Missing required fields",
        required: ["staff_id", "team_id", "review_year"]
      });
      return;
    }

    session.startTransaction();

    const existingReview = await PerformanceReview.findOne({
      staff_id: reviewData.staff_id,
      review_year: reviewData.review_year
    }).session(session).lean();

    if (existingReview) {
      await session.abortTransaction();
      res.status(409).json({
        error: `Performance review already exists for staff ${reviewData.staff_id} and year ${reviewData.review_year}`
      });
      return;
    }

    const existingSalaryRecord = await UserSalary.findOne({ staff_id: reviewData.staff_id }).session(session).lean();
    if (!existingSalaryRecord) {
      await session.abortTransaction();
      res.status(409).json({
        error: `Performance review cannot be created because staff ${reviewData.staff_id} has no salary record yet.`
      });
      return;
    }

    const [staff, team] = await Promise.all([
      UserInfo.findOne({ staff_id: reviewData.staff_id }).session(session).lean() as any,
      Team.findOne({ team_id: reviewData.team_id }).session(session).lean() as any
    ]);

    if (!staff) {
      await session.abortTransaction();
      res.status(404).json({ error: "User Not Found" });
      return;
    }

    if (!team) {
      await session.abortTransaction();
      res.status(404).json({ error: "Team Not Found" });
      return;
    }

    const lead = team.team_lead ? await UserInfo.findOne({ staff_id: team.team_lead }).session(session).lean() as any : null;
    if (!lead) {
      await session.abortTransaction();
      res.status(404).json({ error: "Team Lead Not Found" });
      return;
    }

    const count = await PerformanceReview.countDocuments({}).session(session);
    const performance_id = await generateCustomId("PERF", count);

    const baseData = {
      performance_id,
      branchcode: staff.branchcode,
      staff_id: reviewData.staff_id,
      name: `${staff.firstname || ''} ${staff.lastname || ''}`.trim(),
      designation: staff.desigantion || staff.designation || '',
      department: staff.department || '',
      reporting_to: reviewData.reporting_to || null,
      team_id: reviewData.team_id,
      team_name: team.team_name,
      lead_id: team.team_lead,
      lead_name: `${lead.firstname || ''} ${lead.lastname || ''}`.trim(),
      dateofjoining: staff.dateofjoining,
      created_on: new Date()
    };

    const allData = { ...baseData, ...reviewData };
    const [createdDoc] = await PerformanceReview.create([allData], { session });
    const obj = createdDoc.toObject() as any;
    obj.id = obj._id.toString();

    await session.commitTransaction();
    res.status(201).json(obj);

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating performance review:', error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    session.endSession();
  }
};