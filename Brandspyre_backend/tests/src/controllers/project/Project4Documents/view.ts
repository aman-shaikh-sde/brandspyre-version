import mongoose from "mongoose";
import { Request, Response } from "express";
import { settingAccessControl } from "../../accountSetting/helperFunction";
import { ProjectMeeting, MeetingReminder, CommunicationParticipant, CustomTarget } from "../../../db/ModelSceham/project/client";

interface AuthenticatedUser {
    userId: number;
    userRole: string;
    brcode: string;
    tenantId?: string;
  }

//   export const viewMeetingOrDoc = async (req: Request, res: Response): Promise<void> => {
//     const msgField = `View Documents Info`;
//     const { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
  
//     let {
//       milestone_code,
//       project_code,
//       client_code,
//       staff_id,
//       team_id,
//       person_id,
//       role,
//       taskid,
//       type,
//       status,
//       search,
//       overdue,
//       comm_type, // <- REQUIRED FIELD NOW
//       dec,
//       page = "1",
//       limit = "25"
//     } = req.query;
  
//     const loginId = idObj;
  
//     try {
//       // ✅ Validate comm_type
//       if (!comm_type || !['doc', 'meeting'].includes(comm_type as string)) {
//          res.status(400).json({
//           error: `'comm_type' query param is required and must be either 'doc' or 'meeting'`
//         });
//         return
//       }
  
//       // Pagination
//       const pageNumber = parseInt(page as string, 10);
//       const pageLimit = parseInt(limit as string, 10);
//       const offset = (pageNumber - 1) * pageLimit;
  
//       const order = dec ? "DESC" : "ASC";
  
//       let whereClauses: string[] = [];
//       let values: any[] = [];
  
//       let filteredMeetIds: number[] = [];
  
//       // 🔍 Filter by person or team/staff
//       if (person_id && role) {
//         const partResult = await pool.query(
//           `SELECT DISTINCT meet_id FROM communication_participants WHERE person_id = $1 AND role = $2`,
//           [person_id, role]
//         );
//         filteredMeetIds = partResult.rows.map((row: any) => row.meet_id);
//       } else if (staff_id || team_id) {
//         let partQuery = `SELECT DISTINCT meet_id FROM communication_participants WHERE `;
//         let partConditions: string[] = [];
  
//         if (staff_id) {
//           values.push(staff_id);
//           partConditions.push(`person_id = $${values.length}`);
//         }
  
//         if (team_id) {
//           values.push(team_id);
//           partConditions.push(`team_id = $${values.length}`);
//         }
  
//         const partResult = await pool.query(partQuery + partConditions.join(" OR "), values);
//         filteredMeetIds = partResult.rows.map((row: any) => row.meet_id);
//       }
  
//       if (filteredMeetIds.length === 0 && (person_id || staff_id || team_id)) {
//          res.status(200).json({
//           message: `${msgField} Success`,
//           data: [],
//           pageNumber,
//           totalPages: 0,
//           pageLimit,
//           totalDocuments: 0,
//           balanceDocuments: 0,
//           target: { datas: [] },
//           participant: { data: [] }
//         });
//         return
//       }
  
//       if (filteredMeetIds.length > 0) {
//         const meetPlaceholders = filteredMeetIds.map((_, idx) => `$${values.length + idx + 1}`);
//         whereClauses.push(`meet_id IN (${meetPlaceholders.join(", ")})`);
//         values.push(...filteredMeetIds);
//       }
  
//       // Helper function to add condition
//       const addCondition = (condition: string, value: any) => {
//         values.push(value);
//         whereClauses.push(`${condition} $${values.length}`);
//       };
  
//       // ✅ Always filter by comm_type
//       addCondition("comm_type =", comm_type);
  
//       if (status) addCondition("status =", status);
//       if (taskid) addCondition("id =", taskid);
//       if (milestone_code) addCondition("milestone_code ILIKE", `%${milestone_code}%`);
//       if (project_code) addCondition("project_code ILIKE", `%${project_code}%`);
//       if (type) addCondition("task_priority ILIKE", `%${type}%`);
//       if (client_code) addCondition("client_code ILIKE", `%${client_code}%`);
  
//       if (search) {
//         const searchTerm = `%${search}%`;
//         values.push(searchTerm);
//         const searchIndex = values.length;
//         whereClauses.push(`(
//           title ILIKE $${searchIndex} OR
//           notes ILIKE $${searchIndex} OR
//           meet_link ILIKE $${searchIndex}
//         )`);
//       }

//       if (overdue) {
//         const end_date_time = `${overdue}T23:59:59Z`;
//         whereClauses.push(`end_date_time <= $${values.length + 1}`);
//         whereClauses.push(`status ='active'`);
//         values.push(end_date_time);
//       }
  
//       const countQuery = `
//         SELECT COUNT(*) FROM project_meeting
//         ${whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : ""}
//       `;
//       const countResult = await pool.query(countQuery, values);
//       const totalDocuments = parseInt(countResult.rows[0].count, 10);
//       const totalPages = Math.ceil(totalDocuments / pageLimit);
//       const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);
      
//       // values.push(pageLimit, offset);
  
//       // const mainQuery = `
//       //   SELECT * FROM project_meeting
        
//       // `;
//       // const result = await pool.query(mainQuery);

//     const countValues = [...values]; // copy before adding pagination
// values.push(pageLimit);
// values.push(offset);

// const mainQuery = `
//   SELECT * FROM project_meeting
//   ${whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : ""}
//   ORDER BY created_on ${order}
//   LIMIT $${values.length - 1} OFFSET $${values.length}
// `;

// const result = await pool.query(mainQuery, values);

  
//       const participantResult = await pool.query(`SELECT * FROM communication_participants`);
  
//       res.status(200).json({
//         message: `${msgField} Success`,
//         data: result.rows,
//         pageNumber,
//         totalPages,
//         pageLimit,
//         totalDocuments,
//         balanceDocuments,
//         target: { datas: result.rows },
//         participant: { data: participantResult.rows }
//       });
export const viewMeetingOrDoc = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Documents Info`;
  const { userId: idObj, userRole, tenantId, brcode } = req.user as AuthenticatedUser;

  let {
    milestone_code,
    project_code,
    client_code,
    staff_id,
    team_id,
    person_id,
    role,
    taskid,
    type,
    status,
    search,
    overdue,
    comm_type, // REQUIRED
    dec,
    start_date,
    end_date,
    page = "1",
    limit = "25"
  } = req.query;

  const loginId = String(idObj);

  try {
    // Validate comm_type
    if (!comm_type || !['doc', 'meeting'].includes(comm_type as string)) {
      res.status(400).json({
        error: `'comm_type' query param is required and must be either 'doc' or 'meeting'`
      });
      return;
    }

    // Pagination
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageLimit;

    // Build filter
    const filter: any = { comm_type };

    // Superadmin and master_super_admin can see all documents
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see documents from their specific branch
    else if (userRole === 'admin' && tenantId) {
      filter.branchcode = brcode;
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } }
      ];
    }
    // Other roles can only see their own branch
    else if (tenantId) {
      filter.branchcode = brcode;
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } }
      ];
    }

    // Participant Filter Pre-check
    let hasParticipantFilter = false;
    let filteredMeetIds: number[] = [];

    if (person_id && role) {
      hasParticipantFilter = true;
      const cpDocs = await CommunicationParticipant.find({ person_id, role }).lean();
      filteredMeetIds = cpDocs.map(c => c.meet_id).filter((id): id is number => typeof id === 'number');
    } else if (staff_id || team_id) {
      hasParticipantFilter = true;
      const orConditions: any[] = [];
      if (staff_id) orConditions.push({ person_id: staff_id });
      if (team_id) orConditions.push({ team_id });
      const cpDocs = await CommunicationParticipant.find({ $or: orConditions }).lean();
      filteredMeetIds = cpDocs.map(c => c.meet_id).filter((id): id is number => typeof id === 'number');
    }

    if (hasParticipantFilter && filteredMeetIds.length === 0) {
      res.status(200).json({
        message: `${msgField} Success`,
        data: [],
        pageNumber,
        totalPages: 0,
        pageLimit,
        totalDocuments: 0,
        balanceDocuments: 0,
        target: { datas: [] }
      });
      return;
    }

    if (hasParticipantFilter) {
      filter.meet_id = { $in: filteredMeetIds };
    }

    // Standard filters
    if (status) filter.status = status;
    if (taskid) {
      const parsedTaskId = parseInt(taskid as string, 10);
      if (!isNaN(parsedTaskId)) {
        filter.task_id = parsedTaskId;
      }
    }
    if (milestone_code) filter.milestone_code = { $regex: milestone_code, $options: 'i' };
    if (project_code) filter.project_code = { $regex: project_code, $options: 'i' };
    if (type) filter.category = { $regex: type, $options: 'i' };
    if (client_code) filter.client_code = { $regex: client_code, $options: 'i' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { meet_link: { $regex: search, $options: 'i' } }
      ];
    }

    // Start & End date filters on start_date_time
    if (start_date || end_date) {
      filter.start_date_time = {};
      if (start_date) {
        filter.start_date_time.$gte = new Date(`${start_date}T00:00:00Z`);
      }
      if (end_date) {
        filter.start_date_time.$lte = new Date(`${end_date}T23:59:59Z`);
      }
    }

    if (overdue) {
      filter.end_date_time = { $lte: new Date(`${overdue}T23:59:59Z`) };
      filter.status = 'active';
    }

    // Count matching documents
    const totalDocuments = await ProjectMeeting.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    // Fetch matching documents
    const meetings = await ProjectMeeting.find(filter)
      .sort({ created_on: dec ? -1 : 1 })
      .skip(offset)
      .limit(pageLimit)
      .lean() as any[];

    // Fetch participants for these meetings
    const meetIds = meetings.map(m => m.meet_id).filter((id): id is number => typeof id === 'number');
    const participants = meetIds.length > 0
      ? await CommunicationParticipant.find({ meet_id: { $in: meetIds } }).lean()
      : [];

    // Map participants back to meetings
    const data = meetings.map(m => {
      const meetingParts = participants
        .filter(p => p.meet_id === m.meet_id)
        .map(p => ({
          person_id: p.person_id,
          team_id: p.team_id,
          role: p.role
        }));
      return {
        ...m,
        id: m._id.toString(),
        participants: meetingParts
      };
    });

    // Filter by logged-in user if not superadmin
    let filteredRows = data;
    if (userRole !== "superadmin") {
      filteredRows = data.filter((row: any) =>
        row.createdby === loginId ||
        row.participants.some((p: any) =>
          p.person_id === loginId || p.team_id === loginId
        )
      );
    }

    res.status(200).json({
      message: `${msgField} Success`,
      data: filteredRows,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments,
      target: { datas: filteredRows }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};


export const viewParticipants = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Participants Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  let { meet_id, id, search, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageLimit;

    const filter: any = {};
    if (meet_id) filter.meet_id = parseInt(meet_id as string, 10);
    if (id) {
      if (mongoose.Types.ObjectId.isValid(id as string)) {
        filter._id = id;
      }
    }

    if (search) {
      filter.$or = [
        { person_id: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }

    const totalDocuments = await CommunicationParticipant.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const docs = await CommunicationParticipant.find(filter)
      .sort({ created_at: dec ? -1 : 1 })
      .skip(offset)
      .limit(pageLimit)
      .lean() as any[];

    const data = docs.map(d => ({
      ...d,
      id: d._id.toString()
    }));

    res.status(201).json({
      message: `${msgField} Success`,
      data,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};


export const viewcustomTarget = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View custom Meet Target Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  let { target_id, meet_id, search, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageLimit;

    const filter: any = {};
    if (target_id) filter.target_id = target_id;
    if (meet_id) filter.meet_id = parseInt(meet_id as string, 10);

    if (search) {
      filter.type = { $regex: search, $options: 'i' };
    }

    const totalDocuments = await CustomTarget.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const docs = await CustomTarget.find(filter)
      .sort({ created_at: dec ? -1 : 1 })
      .skip(offset)
      .limit(pageLimit)
      .lean() as any[];

    const data = docs.map(d => ({
      ...d,
      id: d._id.toString()
    }));

    res.status(201).json({
      message: `${msgField} Success`,
      data,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};


export const viewMeetReminder = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Meet Reminder Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  let { meet_id, reminder_id, search, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageLimit;

    const filter: any = {};
    if (meet_id) filter.meet_id = parseInt(meet_id as string, 10);
    if (reminder_id) {
      if (mongoose.Types.ObjectId.isValid(reminder_id as string)) {
        filter._id = reminder_id;
      }
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const totalDocuments = await MeetingReminder.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const docs = await MeetingReminder.find(filter)
      .sort({ created_at: dec ? -1 : 1 })
      .skip(offset)
      .limit(pageLimit)
      .lean() as any[];

    const data = docs.map(d => ({
      ...d,
      id: d._id.toString()
    }));

    res.status(201).json({
      message: `${msgField} Success`,
      data,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};
