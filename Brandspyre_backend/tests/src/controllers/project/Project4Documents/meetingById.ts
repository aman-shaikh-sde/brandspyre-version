import { Request, Response } from "express";
import { ProjectMeeting, CommunicationParticipant, ClientModel, CustomTarget } from "../../../db/ModelSceham/project/client";
import { UserInfo } from "../../../db/ModelSceham/userSchema";import mongoose from "mongoose";

export const getMeetingById = async (req: Request, res: Response): Promise<void> => {
  const id = req.query.id as string;
  const numericId = Number(id);

  if (!id) {
    res.status(400).json({ success: false, message: "Invalid meeting ID" });
    return;
  }

  try {
    const queryConditions: any[] = [];
    if (!isNaN(numericId)) {
      queryConditions.push({ meet_id: numericId });
    }
    if (mongoose.Types.ObjectId.isValid(id)) {
      queryConditions.push({ _id: id });
    }

    if (queryConditions.length === 0) {
      res.status(404).json({ success: false, message: "Meeting not found" });
      return;
    }

    const meeting = await ProjectMeeting.findOne({
      $or: queryConditions
    }).lean() as any;

    if (!meeting) {
      res.status(404).json({ success: false, message: "Meeting not found" });
      return;
    }

    const meetingData = {
      ...meeting,
      id: meeting._id.toString(),
      start_date_time: meeting.start_date_time ? new Date(meeting.start_date_time).toISOString().replace('T', ' ').substring(0, 19) : null,
      end_date_time: meeting.end_date_time ? new Date(meeting.end_date_time).toISOString().replace('T', ' ').substring(0, 19) : null
    };

    const meetId = meeting.meet_id || meeting._id;
    const cps = await CommunicationParticipant.find({ meet_id: meetId }).lean() as any[];

    const participants = await Promise.all(cps.map(async (cp: any) => {
      const u = await UserInfo.findOne({ staff_id: cp.person_id }).lean() as any;
      const c = await ClientModel.findOne({ client_code: cp.person_id }).lean() as any;
      return {
        id: cp._id.toString(),
        role: cp.role,
        isdocvisible: cp.isdocvisible,
        status: cp.status,
        responded_at: cp.responded_at,
        staff_id: u ? u.staff_id : null,
        firstname: u ? u.firstname : null,
        lastname: u ? u.lastname : null,
        email: u ? u.email : null,
        phonenumber: u ? u.phonenumber : null,
        client_code: c ? c.client_code : null,
        client_name: c ? c.client_name : null,
        client_email: c ? c.email : null,
        primary_phone: c ? c.primary_phone : null
      };
    }));

    const targets = await CustomTarget.find({ meet_id: meetId }).lean();

    res.json({
      success: true,
      data: {
        ...meetingData,
        participants,
        custom_targets: targets.map((t: any) => ({ ...t, id: t._id.toString() })),
      },
    });
  } catch (err: any) {
    console.error("Error in getMeetingById:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
