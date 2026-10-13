import { ProjectMeeting } from "../../../db/ModelSceham/project/client";
import { CommunicationParticipant } from "../../../db/ModelSceham/project/client";
import { Request, Response } from "express";


interface AuthenticatedUser {
    userId: number;
    userRole: string;
    brcode: string;
  }
  
  interface Doc {
    url: string;
    type: string;
  }
  
  interface EditDocInput {
    index: number;
    doc: Doc;
  }

  interface data {
    meet_id: number;
    title?: string;
    notes?: string;
    meet_link?: string;
    start_date_time?: string;
    end_date_time?: string;
    status?: string;
    doc_status?: string;
    field?: string;
    add_docs?: Doc[];
    remove_indexes?: number[];
    edit_docs?: EditDocInput[];
    [key: string]: string | number | undefined | Doc[] | number[] | EditDocInput[];
  }
  
  export const editMeetingOrDoc = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Edit Meeting/Document Communication`;
  
    const { userId: idObj } = req.user as AuthenticatedUser;
    const loginId = String(idObj);
  
    const {
      meet_id,
      title,
      notes,
      meet_link,
      start_date_time,
      end_date_time,
      status,
      doc_status,
      field,
      add_docs = [],
      remove_indexes = [],
      edit_docs = []
    } = req.body as data;
  
    try {
      if (!meet_id) {
        res.status(400).json({ error: "Missing 'meet_id' in request body." });
        return;
      }
  
      // Fetch current document array
      const fetchResult = await (async () => {
    const meetId = meet_id;
    const m = await ProjectMeeting.findOne({ meet_id: meetId }).session(session).lean() as any;
    if (!m) return { rows: [], rowCount: 0 };
    const row = {
      ...m,
      id: m._id.toString(),
      start_date_time: m.start_date_time ? new Date(m.start_date_time).toISOString().replace('T', ' ').substring(0, 19) : null,
      end_date_time: m.end_date_time ? new Date(m.end_date_time).toISOString().replace('T', ' ').substring(0, 19) : null
    };
    return { rows: [row], rowCount: 1 };
  })();
  
      if (fetchResult.rowCount === 0) {
        res.status(404).json({ error: `Meeting with id ${meet_id} not found.` });
        return;
      }
  
      let currentDocs: Doc[] = fetchResult.rows[0].doc || [];
  
      // Remove documents by index
      if (Array.isArray(remove_indexes) && remove_indexes.length > 0) {
        currentDocs = currentDocs.filter((_, index) => !remove_indexes.includes(index));
      }
  
      // Edit specific documents by index
      if (Array.isArray(edit_docs) && edit_docs.length > 0) {
        for (const { index, doc } of edit_docs) {
          if (index >= 0 && index < currentDocs.length) {
            currentDocs[index] = doc;
          }
        }
      }
  
      // Add new documents
      if (Array.isArray(add_docs) && add_docs.length > 0) {
        currentDocs.push(...add_docs);
      }
  
      const updateQuery = `
        UPDATE project_meeting SET
          title = COALESCE($1, title),
          notes = COALESCE($2, notes),
          meet_link = COALESCE($3, meet_link),
          start_date_time = COALESCE($4, start_date_time),
          end_date_time = COALESCE($5, end_date_time),
          field = COALESCE($6, field),
          doc = $7,
          status = COALESCE($8, status),
          doc_status = COALESCE($9, doc_status),
          updated_on = NOW() AT TIME ZONE 'Asia/Kolkata'
        WHERE meet_id = $10
        RETURNING *;
      `;
  
      const updateValues = [
        title,
        notes,
        meet_link,
        start_date_time,
        end_date_time,
        field,
        JSON.stringify(currentDocs),
        status,
        doc_status,
        meet_id,
      ];
  
      const result = await (async () => {
      const updateRes = await ProjectMeeting.updateMany(
        { meet_id: undefined },
        { $set: { title: updateValues !== undefined && updateValues !== null ? updateValues : undefined, notes: undefined !== undefined && undefined !== null ? undefined : undefined, meet_link: undefined !== undefined && undefined !== null ? undefined : undefined, start_date_time: undefined !== undefined && undefined !== null ? undefined : undefined, end_date_time: undefined !== undefined && undefined !== null ? undefined : undefined, field: undefined !== undefined && undefined !== null ? undefined : undefined, doc: undefined, status: undefined !== undefined && undefined !== null ? undefined : undefined, doc_status: undefined !== undefined && undefined !== null ? undefined : undefined, updated_on: new Date() } }
      );
      return { rows: [], rowCount: updateRes.modifiedCount };
    })();
  
      res.status(200).json({
        message: `${msgField} Success`,
        data: result.rows[0],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`${msgField} Causes Error Message: ${message}`);
      res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
    }
  };


  export const editParticipant = async (req: Request, res: Response): Promise<void> => {
    const { id, role, isdocvisible, status } = req.body;
  
    if (!id) {
      res.status(400).json({ error: "Participant ID is required for editing." });
      return;
    }
  
    try {
      const result = await (async () => {
      const updateRes = await CommunicationParticipant.updateMany(
        { id: id },
        { $set: { role: role !== undefined && role !== null ? role : undefined, isdocvisible: isdocvisible !== undefined && isdocvisible !== null ? isdocvisible : undefined, status: status !== undefined && status !== null ? status : undefined, responded_at: new Date() } }
      );
      return { rows: [], rowCount: updateRes.modifiedCount };
    })();
  
      if (result.rowCount === 0) {
        res.status(404).json({ error: "Participant not found." });
      } else {
        res.status(200).json({ message: "Participant updated.", data: result.rows[0] });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: `Edit failed: ${message}` });
    }
  };

  




