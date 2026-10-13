// import { Request, Response } from "express";
// import {pool} from '../../../db/index'
// import { settingAccessControl } from "../../accountSetting/helperFunction";

// interface AuthenticatedUser {
//     userId: number;
//     userRole: string;
//     brcode: string;
//   }

//   export const viewProjectCheckinOut = async (req: Request, res: Response): Promise<void> => {
//     const msgField = `View Project Task Check IN-OUT Info`;
//     const { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
  
//     let {
//       logid,
//       milestone_code,
//       branchcode,
//       task_id,
//       project_code,
//       team_id,
//       participants_id,
//       staff_id,
//       client_code,
//       type,
//       status,
//       search,
//       dec,
//       page = 1,
//       limit = 25,
//     } = req.query;
  
//     const loginId = idObj;
  
//     try {
//       // Pagination
//       const pageNumber = parseInt(page as string, 10);
//       const pageLimit = parseInt(limit as string, 10);
//       const offset = (pageNumber - 1) * pageLimit;
  
//       // Sorting
//       const order = dec ? "DESC" : "ASC";
  
//       // Filters
//       let whereClauses: string[] = [];
//       let values: any[] = [];
  
//       const addCondition = (condition: string, value: any) => {
//         values.push(value);
//         whereClauses.push(`${condition} $${values.length}`);
//       };
  
//       if (status) addCondition("log.status =", status);
//       if (milestone_code) addCondition("log.milestone_code =", milestone_code);
//       if (project_code) addCondition("log.project_code =", project_code);
//       if (branchcode) addCondition("log.branchcode =", branchcode);
//       if (client_code) addCondition("log.client_code =", client_code);
//       if (task_id) addCondition("log.task_id =", task_id);
//       if (team_id) addCondition("log.team_id =", team_id);
//       if (participants_id) addCondition("log.participants_id =", participants_id);
//       if (staff_id) addCondition("log.staff_id =", staff_id);
//       if (logid) addCondition("log.id =", logid);
  
//       // Main Query with joins
//       const query = `
//         SELECT DISTINCT ON (log.id)
//           log.*,
//           br.name AS branch_name,
//           c.client_name,
//           p.title AS project_title,
//           m.miles_title,
//           t.task_title,
//           team.team_name AS team_name,
//           lead.firstname || ' ' || lead.lastname AS lead_name,
//           tp.subtask_title,
//           staff.firstname || ' ' || staff.lastname AS staff_name
  
//         FROM task_participants_log log
  
//         LEFT JOIN branches br ON br.branchcode = log.branchcode
//         LEFT JOIN client c ON c.client_code = log.client_code
//         LEFT JOIN project p ON p.project_code = log.project_code
//         LEFT JOIN milestone m ON m.milestone_code = log.milestone_code
//         LEFT JOIN task t ON t.id = log.task_id
//         LEFT JOIN teams team ON team.team_id = log.team_id
//         LEFT JOIN userinfo lead ON lead.staff_id = log.lead_id
//         LEFT JOIN task_participants tp ON tp.participants_id = log.participants_id
//         LEFT JOIN userinfo staff ON staff.staff_id = log.staff_id
  
//         ${whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : ""}
//         ORDER BY log.id ${order}
//         LIMIT $${values.length + 1}
//         OFFSET $${values.length + 2};
//       `;
  
//       // Total count query
//       const countQuery = `
//         SELECT COUNT(*) FROM task_participants_log log
//         ${whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : ""}
//       `;
  
//       const countResult = await pool.query(countQuery, values);
//       const totalDocuments: number = parseInt(countResult.rows[0].count, 10);
//       const totalPages: number = Math.ceil(totalDocuments / pageLimit);
//       const balanceDocuments: number = Math.max(totalDocuments - (pageNumber * pageLimit), 0);
  
//       values.push(pageLimit, offset);
  
//       const result = await pool.query(query, values);
  
//       res.status(200).json({
//         message: `${msgField} Success`,
//         data: result.rows,
//         pageNumber,
//         totalPages,
//         pageLimit,
//         totalDocuments,
//         balanceDocuments
//       });
//     } catch (error) {
//       const message = error instanceof Error ? error.message : String(error);
//       console.log(`${msgField} Causes Error Message: ${message}`);
//       res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
//     }
//   };



import { Request, Response } from "express";
import { TaskParticipantLog, Client, Project, Milestone, Task, TaskParticipant } from '../../../db/ModelSceham/project/client';
import { Branch } from '../../../db/ModelSceham/branchSchema';
import { Team } from '../../../db/ModelSceham/teams/team';
import { UserInfo } from '../../../db/ModelSceham/userSchema';
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
}

export const viewProjectCheckinOut = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Project Task Check IN-OUT Info`;
  const { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;

  let {
    logid,
    milestone_code,
    branchcode,
    task_id,
    project_code,
    team_id,
    participants_id,
    staff_id,
    client_code,
    type,
    status,
    search,
    dec,
    page = 1,
    limit = 25,
    start_date,
    end_date
  } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    const filter: any = {};

    if (status) filter.status = status;
    if (milestone_code) filter.milestone_code = milestone_code;
    if (project_code) filter.project_code = project_code;
    if (branchcode) filter.branchcode = branchcode;
    if (client_code) filter.client_code = client_code;
    if (task_id) filter.task_id = task_id;
    if (team_id) filter.team_id = team_id;
    if (participants_id) filter.participants_id = participants_id;
    if (staff_id) filter.staff_id = staff_id;
    if (logid) filter._id = logid;

    if (start_date && end_date) {
      filter.check_out = {
        $gte: new Date(start_date as string),
        $lte: new Date(end_date as string)
      };
    } else if (start_date) {
      filter.check_out = { $gte: new Date(start_date as string) };
    } else if (end_date) {
      filter.check_out = { $lte: new Date(end_date as string) };
    }

    const totalDocuments = await TaskParticipantLog.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const logs = await TaskParticipantLog.find(filter)
      .sort({ _id: sortOrder })
      .skip(offset)
      .limit(pageLimit);

    const enrichedLogs = await Promise.all(logs.map(async (log) => {
      const branch = await Branch.findOne({ branchcode: log.branchcode });
      const client = await Client.findOne({ client_code: log.client_code });
      const project = await Project.findOne({ project_code: log.project_code });
      const milestone = await Milestone.findOne({ milestone_code: log.milestone_code });
      const task = await Task.findById(log.task_id);
      const team = await Team.findOne({ team_id: log.team_id });
      const lead = await UserInfo.findOne({ staff_id: log.lead_id });
      const participant = await TaskParticipant.findById(log.participants_id);
      const staff = await UserInfo.findOne({ staff_id: log.staff_id });

      return {
        ...log.toObject(),
        branch_name: branch?.name,
        client_name: client?.client_name,
        project_title: project?.title,
        miles_title: milestone?.miles_title,
        task_title: task?.task_title,
        team_name: team?.team_name,
        lead_name: lead ? `${lead.firstname} ${lead.lastname}` : null,
        subtask_title: participant?.subtask_title,
        staff_name: staff ? `${staff.firstname} ${staff.lastname}` : null
      };
    }));

    res.status(200).json({
      message: `${msgField} Success`,
      data: enrichedLogs,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};
