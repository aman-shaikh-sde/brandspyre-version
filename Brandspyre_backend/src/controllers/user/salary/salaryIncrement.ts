import { UserSalary, PerformanceReview } from "../../../db/ModelSceham/user/9_salary";

export const processSalaryIncrement = async (
  session: any,
  staffId: string,
  incrementPercentage: number,
  performanceReviewId: string | number,
  hr_rating: number,
  closingDate: string,
  effectiveDate: string,
  status: string,
  remarks: string = ''
): Promise<{ oldSalary: any, newSalary: any }> => {
  try {
    const currentSalary = await UserSalary.findOne({ staff_id: staffId, status: 'active' })
      .sort({ created_at: -1 })
      .session(session)
      .lean() as any;

    if (!currentSalary) {
      throw new Error(`No active salary record found for staff ${staffId}`);
    }

    if (incrementPercentage <= 0 || incrementPercentage > 100) {
      throw new Error(`Invalid increment percentage: ${incrementPercentage}. Must be between 0 and 100`);
    }

    const calculateNewValue = (value: number = 0) => {
      const newValue = value * (1 + incrementPercentage / 100);
      return parseFloat(newValue.toFixed(2));
    };

    const newSalaryData = {
      staff_id: staffId,
      branchcode: currentSalary.branchcode,
      basicsalary: calculateNewValue(currentSalary.basicsalary),
      hra: calculateNewValue(currentSalary.hra),
      lpa: calculateNewValue(currentSalary.lpa),
      gross_salary: calculateNewValue(currentSalary.gross_salary),
      net_salary: calculateNewValue(currentSalary.net_salary),
      bonus: calculateNewValue(currentSalary.bonus),
      pf: calculateNewValue(currentSalary.pf),
      esi: calculateNewValue(currentSalary.esi),
      tds: calculateNewValue(currentSalary.tds),
      other_allowance: calculateNewValue(currentSalary.other_allowance),
      deductions: calculateNewValue(currentSalary.deductions),
      processondate: effectiveDate,
      processtilldate: '',
      status: 'active',
      remarks: `Salary increment ${incrementPercentage}% approved. ${remarks}`
    };

    const closedSalary = await UserSalary.findOneAndUpdate(
      { _id: currentSalary._id },
      {
        $set: {
          status: 'inactive',
          processtilldate: closingDate,
          remarks: `${currentSalary.remarks || ''} | Replaced by increment on ${effectiveDate}`
        }
      },
      { new: true, session }
    ).lean() as any;

    const [newSalaryCreated] = await UserSalary.create([newSalaryData], { session });
    const newSalaryObj = newSalaryCreated.toObject() as any;

    if (performanceReviewId && status === "approved") {
      await PerformanceReview.updateMany(
        { performance_id: performanceReviewId },
        { $set: { status: 'completed', closing_date: closingDate, hr_rating: hr_rating, closing_remarks: remarks } },
        { session }
      );
    } else {
      await PerformanceReview.updateMany(
        { performance_id: performanceReviewId },
        { $set: { status: 'closed', closing_date: closingDate, hr_rating: hr_rating, closing_remarks: remarks } },
        { session }
      );
    }

    return {
      oldSalary: closedSalary,
      newSalary: newSalaryObj
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Salary increment failed for staff ${staffId}: ${message}`);
    throw new Error(`Salary increment failed: ${message}`);
  }
};