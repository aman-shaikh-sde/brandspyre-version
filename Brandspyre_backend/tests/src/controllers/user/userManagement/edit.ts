import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Request, Response } from "express";
import { encryptPassword } from "./helperFunction";

interface AuthenticatedUser {
  userId: string | number;
  userRole: string;
  brcode: string;
}

interface Profile {
  staff_id?: string;
  branchcode?: string;
  role?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;
  gender?: string;
  marital?: string;
  bloodgroup?: string;
  phonenumber?: string;
  alternumber?: string;
  email?: string;
  password?: string;
  permanentaddress?: string;
  presentaddress?: string;
  department?: string;
  designation?: string;
  profileurl?: string;
  dateofjoining?: string;
  relivingdate?: string;
  status?: string;
  notes?: string;
  [key: string]: any;
}

export const editUsers = async (req: Request, res: Response): Promise<void> => {
  const authUser = (req as any).user || {};
  const { profile: userData } = req.body as { profile: Profile };

  if (!userData) {
    res.status(400).json({ message: "No profile data provided" });
    return;
  }

  const staffId: string = userData.staff_id || (req.query && (req.query.staff_id as string)) || String(authUser.userId || "");

  try {
    for (const key in userData) {
      if (typeof userData[key] === "string") {
        userData[key] = userData[key]?.trim();
      }
    }

    if (userData.password) {
      userData.password = await encryptPassword(userData.password);
    }

    if (userData.role) {
      userData.role = userData.role.trim().toLowerCase();
    }

    if (userData.firstName && !userData.firstname) {
      userData.firstname = userData.firstName;
    }
    if (userData.lastName && !userData.lastname) {
      userData.lastname = userData.lastName;
    }
    if (userData.designation && !userData.desigantion) {
      userData.desigantion = userData.designation;
    }
    if (userData.permanentaddress && !userData.permantaddress) {
      userData.permantaddress = userData.permanentaddress;
    }

    const filterConditions: any[] = [];
    if (staffId) {
      filterConditions.push({ staff_id: staffId });
      if (mongoose.Types.ObjectId.isValid(staffId)) {
        filterConditions.push({ _id: new mongoose.Types.ObjectId(staffId) });
      }
    }
    if (authUser.userId) {
      filterConditions.push({ staff_id: authUser.userId });
      if (mongoose.Types.ObjectId.isValid(String(authUser.userId))) {
        filterConditions.push({ _id: new mongoose.Types.ObjectId(String(authUser.userId)) });
      }
    }

    const filter = filterConditions.length > 0 ? { $or: filterConditions } : {};

    const updatedUser = await UserInfo.findOneAndUpdate(
      filter,
      { $set: userData },
      { new: true }
    ).lean() as any;

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const userObj = {
      ...updatedUser,
      id: updatedUser._id.toString(),
      designation: updatedUser.desigantion || updatedUser.designation,
      permanentaddress: updatedUser.permantaddress || updatedUser.permanentaddress,
    };

    res.status(200).json({ message: "User updated successfully", result: userObj });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("editUsers error:", message);
    res.status(500).json({ error: message });
  }
};

