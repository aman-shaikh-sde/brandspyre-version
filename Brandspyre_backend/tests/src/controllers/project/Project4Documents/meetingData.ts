import { Request, Response } from "express";
import { ProjectMeeting, CommunicationParticipant } from "../../../db/ModelSceham/project/client";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { ClientModel } from "../../../db/ModelSceham/project/client";

export const viewMeetingsWithParticipants = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = `View Meetings with Participants`;

  let {
    staff_id,
    client_code,
    comm_type,
    status,
    search,
    dec,
    page = "1",
    limit = "25",
  } = req.query;

  try {
    if (!comm_type || !["doc", "meeting"].includes(comm_type as string)) {
      res.status(400).json({ error: `'comm_type' query param is required and must be either 'doc' or 'meeting'` });
      return;
    }

    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;

    let filter: any = { comm_type };
    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(String(search), 'i');
      filter.$or = [
        { title: regex },
        { notes: regex },
        { meet_link: regex },
      ];
    }

    // If filtering by participant
    if (staff_id || client_code) {
      const personId = staff_id || client_code;
      const participantMeetIds = await CommunicationParticipant.find({ person_id: personId }).distinct('meet_id');
      filter.meet_id = { $in: participantMeetIds };
    }

    const totalDocuments = await ProjectMeeting.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const sortOrder = dec ? -1 : 1;
    const meetings = await ProjectMeeting.find(filter)
      .sort({ meet_id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean() as any[];

    // Enrich each meeting with organizer and participants
    const enriched = await Promise.all(meetings.map(async (pm: any) => {
      // Organizer
      const organizer = await UserInfo.findOne({ staff_id: pm.createdby }).lean() as any;

      // Participants
      const participants = await CommunicationParticipant.find({ meet_id: pm.meet_id }).lean() as any[];
      const enrichedParticipants = await Promise.all(participants.map(async (cp: any) => {
        let staffInfo: any = null;
        let clientInfo: any = null;
        if (cp.role === 'staff') {
          staffInfo = await UserInfo.findOne({ staff_id: cp.person_id }).lean() as any;
        } else if (cp.role === 'client') {
          clientInfo = await ClientModel.findOne({ client_code: cp.person_id }).lean() as any;
        }
        return {
          role: cp.role,
          person_id: cp.person_id,
          staff_firstname: staffInfo?.firstname || null,
          staff_lastname: staffInfo?.lastname || null,
          staff_email: staffInfo?.email || null,
          staff_phone: staffInfo?.phonenumber || null,
          client_name: clientInfo?.client_name || null,
          company_name: clientInfo?.company_name || null,
          client_email: clientInfo?.email || null,
          client_phone: clientInfo?.primary_phone || null,
          client_branch: clientInfo?.branchcode || null,
        };
      }));

      return {
        meet_id: pm.meet_id,
        comm_type: pm.comm_type,
        title: pm.title,
        notes: pm.notes,
        meet_link: pm.meet_link,
        status: pm.status,
        start_date_time: pm.start_date_time,
        end_date_time: pm.end_date_time,
        createdby: pm.createdby,
        organizer_firstname: organizer?.firstname || null,
        organizer_lastname: organizer?.lastname || null,
        organizer_email: organizer?.email || null,
        organizer_phone: organizer?.phonenumber || null,
        participants: enrichedParticipants,
      };
    }));

    res.status(200).json({
      message: `${msgField} Success`,
      data: enriched,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};
