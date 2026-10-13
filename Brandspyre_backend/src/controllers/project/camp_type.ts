import { Campaign } from "../../db/ModelSceham/project/campagin";
// "use strict";
// import { Request, Response } from "express";
// 

// export const getCommTypes = async (req: Request, res: Response) => {
//   try {
//     // Fetch distinct comm_type values (ignores null/empty)
//     const result = await pool.query(
//       `SELECT DISTINCT comm_type 
//        FROM leads 
//        WHERE comm_type IS NOT NULL AND comm_type <> '' 
//        ORDER BY comm_type ASC`
//     );

//     // If no comm_type found
//     if (result.rowCount === 0) {
//       res.status(404).json({ error: "No comm_type found" });
//       return;
//     }

//     // Return as list
//     const commTypes = result.rows.map((row) => row.comm_type);
//     res.json({ comm_types: commTypes });
//   } catch (error) {
//     console.error("Error fetching comm_types", error);
//     res.status(500).json({ error: "Failed to fetch comm_types" });
//   }
// };


"use strict";
import { Request, Response } from "express";


export const getCampTypes = async (req: Request, res: Response) => {
  try {
    // Fetch distinct comm_type
    const commResult = await (async () => {
        const rows = await Campaign.find({ campaigntype: { $ne: null } }, 'distinct campaigntype').lean() as any[];
        return {
          rows: rows.map(r => ({
            ...r,
            id: r._id.toString(),
            
          })),
          rowCount: rows.length
        };
      })();

    
    res.json({
      camp_types: commResult.rows.map((row) => row.campaigntype),
    
    });
  } catch (error) {
    console.error("Error fetching lead meta", error);
    res.status(500).json({ error: "Failed to fetch lead meta" });
  }
};
