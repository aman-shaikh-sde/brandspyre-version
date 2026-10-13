// import { Request, Response } from "express";
// import { pool } from "../../../db/index";

// export const getRoleAccess = async (req: Request, res: Response): Promise<void> => {
//   const { role } = req.params;

//   if (!role) {
//     res.status(400).json({ status: false, message: "Missing role parameter." });
//     return;
//   }

//   try {
//     const query = `
//       SELECT *
//       FROM roleaccess
//       WHERE role = $1
//     `;

//     const { rows } = await pool.query(query, [role]);

//     if (rows.length === 0) {
//       res.status(404).json({ status: false, message: "No roleaccess found for this role." });
//       return;
//     }

//     res.status(200).json({ status: true, data: rows });

//   } catch (error) {
//     const message = error instanceof Error ? error.message : String(error);
//     console.error(`getRoleAccess Error: ${message}`);
//     res.status(500).json({ status: false, error: message });
//   }
// };



// import { Request, Response } from "express";
// import { pool } from "../../../db/index";

// export const getRoleAccess = async (req: Request, res: Response): Promise<void> => {
//   const { role } = req.params;

//   if (!role) {
//     res.status(400).json({ status: false, message: "Missing role parameter." });
//     return;
//   }

//   try {
//     // 1️⃣ Get all JSONB column names in roleaccess
//     const colQuery = `
//       SELECT column_name 
//       FROM information_schema.columns
//       WHERE table_name = 'roleaccess'
//       AND data_type = 'jsonb'
//     `;
//     const { rows: colRows } = await pool.query(colQuery);
//     const jsonbCols = colRows.map(r => r.column_name);

//     if (jsonbCols.length === 0) {
//       res.status(500).json({ status: false, message: "No JSONB columns found." });
//       return;
//     }

//     // 2️⃣ Build EXISTS checks dynamically
//     const existsClauses = jsonbCols.map(col => `
//       EXISTS (
//         SELECT 1 
//         FROM jsonb_each_text(${col})
//         WHERE value::boolean = true
//       ) AS ${col}
//     `).join(",\n");

//     // 3️⃣ Main query
//     const mainQuery = `
//       SELECT 
//         role,
//         ${existsClauses}
//       FROM roleaccess
//       WHERE role = $1
//       LIMIT 1
//     `;

//     const { rows } = await pool.query(mainQuery, [role]);

//     if (rows.length === 0) {
//       res.status(404).json({ status: false, message: "Role not found." });
//       return;
//     }

//     res.status(200).json({ status: true, access: rows[0] });

//   } catch (error) {
//     const message = error instanceof Error ? error.message : String(error);
//     console.error(`getRoleAccess Error: ${message}`);
//     res.status(500).json({ status: false, error: message });
//   }
// };



import { Request, Response } from "express";
import { RoleAccess } from "../../../db/ModelSceham/roleAccessSchema";

export const getRoleAccess = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.params;
  if (!role) {
    res.status(400).json({ status: false, message: "Missing role parameter." });
    return;
  }

  try {
    const roleAccessDoc = await RoleAccess.findOne({ role: role.toLowerCase() }).lean() as any;

    if (!roleAccessDoc) {
      res.status(404).json({ status: false, message: "Role not found." });
      return;
    }

    const accessObj: any = {
      role: roleAccessDoc.role
    };

    for (const [key, value] of Object.entries(roleAccessDoc)) {
      if (key === 'role' || key === '_id' || key === '__v' || key === 'create_datetime' || key === 'last_update_datetime') {
        continue;
      }
      if (value && typeof value === 'object') {
        // Check if any nested value is true
        const hasPermission = Object.values(value).some(val => val === true || val === 'true');
        accessObj[key] = hasPermission;
      } else {
        accessObj[key] = value === true || value === 'true';
      }
    }

    res.status(200).json({ status: true, access: accessObj });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`getRoleAccess Error: ${message}`);
    res.status(500).json({ status: false, error: message });
  }
};
