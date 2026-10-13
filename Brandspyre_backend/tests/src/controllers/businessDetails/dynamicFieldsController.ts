// import { Request, Response } from "express";
// import { pool } from "../../db/index";

// export const createDynamicField = async (req: Request, res: Response): Promise<void> => {
//   const msgField = "Create Dynamic Field";
//   const client = await pool.connect();
  
//   try {
//     const { userId, userRole, brcode } = req.user as any;
//     const { 
//       tenant_id,
//       field_name,
//       field_label,
//       field_type,
//       field_options,
//       is_required,
//       category,
//       validation_rules,
//       display_order
//     } = req.body;

//     const query = `
//       INSERT INTO dynamic_field_definitions (
//         tenant_id, field_name, field_label, field_type, field_options,
//         is_required, category, validation_rules, display_order
//       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//       RETURNING *;
//     `;

//     const result = await client.query(query, [
//       tenant_id,
//       field_name,
//       field_label,
//       field_type,
//       JSON.stringify(field_options || []),
//       is_required || false,
//       category,
//       JSON.stringify(validation_rules || {}),
//       display_order || 0
//     ]);

//     res.status(201).json({ 
//       message: `${msgField} Success`,
//       data: result.rows[0]
//     });

//   } catch (error) { 
//     const message = error instanceof Error ? error.message : String(error);
//     console.log(`${msgField} Causes Error Message: ${message}`);
//     res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
//   } finally {
//     client.release();
//   }
// };

// export const getDynamicFields = async (req: Request, res: Response): Promise<void> => {
//   const msgField = "Get Dynamic Fields";
//   const client = await pool.connect();
  
//   try {
//     const { userId, userRole, brcode } = req.user as any;
//     const { tenant_id, category } = req.query;

//     let query = `
//       SELECT * FROM dynamic_field_definitions 
//       WHERE tenant_id = $1 AND is_active = true
//     `;
//     const params = [tenant_id];

//     if (category) {
//       query += ` AND category = $2`;
//       params.push(category as string);
//     }

//     query += ` ORDER BY display_order ASC, created_at ASC`;

//     const result = await client.query(query, params);

//     res.status(200).json({ 
//       message: `${msgField} Success`,
//       data: result.rows
//     });

//   } catch (error) { 
//     const message = error instanceof Error ? error.message : String(error);
//     console.log(`${msgField} Causes Error Message: ${message}`);
//     res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
//   } finally {
//     client.release();
//   }
// };

// export const updateDynamicField = async (req: Request, res: Response): Promise<void> => {
//   const msgField = "Update Dynamic Field";
//   const client = await pool.connect();
  
//   try {
//     const { userId, userRole, brcode } = req.user as any;
//     const { field_id } = req.params;
//     const { 
//       field_label,
//       field_type,
//       field_options,
//       is_required,
//       category,
//       validation_rules,
//       display_order,
//       is_active
//     } = req.body;

//     const query = `
//       UPDATE dynamic_field_definitions 
//       SET field_label = $1, field_type = $2, field_options = $3,
//           is_required = $4, category = $5, validation_rules = $6,
//           display_order = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
//       WHERE id = $9 AND tenant_id = $10
//       RETURNING *;
//     `;

//     const result = await client.query(query, [
//       field_label,
//       field_type,
//       JSON.stringify(field_options || []),
//       is_required,
//       category,
//       JSON.stringify(validation_rules || {}),
//       display_order,
//       is_active !== undefined ? is_active : true,
//       field_id,
//       req.body.tenant_id
//     ]);

//     if (result.rows.length === 0) {
//       res.status(404).json({ error: "Field not found" });
//       return;
//     }

//     res.status(200).json({ 
//       message: `${msgField} Success`,
//       data: result.rows[0]
//     });

//   } catch (error) { 
//     const message = error instanceof Error ? error.message : String(error);
//     console.log(`${msgField} Causes Error Message: ${message}`);
//     res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
//   } finally {
//     client.release();
//   }
// };

// export const deleteDynamicField = async (req: Request, res: Response): Promise<void> => {
//   const msgField = "Delete Dynamic Field";
//   const client = await pool.connect();
  
//   try {
//     const { userId, userRole, brcode } = req.user as any;
//     const { field_id } = req.params;
//     const { tenant_id } = req.body;

//     const query = `
//       UPDATE dynamic_field_definitions 
//       SET is_active = false, updated_at = CURRENT_TIMESTAMP
//       WHERE id = $1 AND tenant_id = $2
//       RETURNING *;
//     `;

//     const result = await client.query(query, [field_id, tenant_id]);

//     if (result.rows.length === 0) {
//       res.status(404).json({ error: "Field not found" });
//       return;
//     }

//     res.status(200).json({ 
//       message: `${msgField} Success`,
//       data: result.rows[0]
//     });

//   } catch (error) { 
//     const message = error instanceof Error ? error.message : String(error);
//     console.log(`${msgField} Causes Error Message: ${message}`);
//     res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
//   } finally {
//     client.release();
//   }
// };

// export const saveDynamicFieldValue = async (req: Request, res: Response): Promise<void> => {
//   const msgField = "Save Dynamic Field Value";
//   const client = await pool.connect();
  
//   try {
//     const { userId, userRole, brcode } = req.user as any;
//     const { 
//       tenant_id,
//       field_definition_id,
//       entity_type,
//       entity_id,
//       field_value
//     } = req.body;

//     const query = `
//       INSERT INTO dynamic_field_values (
//         tenant_id, field_definition_id, entity_type, entity_id, field_value
//       ) VALUES ($1, $2, $3, $4, $5)
//       ON CONFLICT (entity_type, entity_id, field_definition_id)
//       DO UPDATE SET field_value = $5, updated_at = CURRENT_TIMESTAMP
//       RETURNING *;
//     `;

//     const result = await client.query(query, [
//       tenant_id,
//       field_definition_id,
//       entity_type,
//       entity_id,
//       field_value
//     ]);

//     res.status(200).json({ 
//       message: `${msgField} Success`,
//       data: result.rows[0]
//     });

//   } catch (error) { 
//     const message = error instanceof Error ? error.message : String(error);
//     console.log(`${msgField} Causes Error Message: ${message}`);
//     res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
//   } finally {
//     client.release();
//   }
// };

// export const getDynamicFieldValues = async (req: Request, res: Response): Promise<void> => {
//   const msgField = "Get Dynamic Field Values";
//   const client = await pool.connect();
  
//   try {
//     const { userId, userRole, brcode } = req.user as any;
//     const { entity_type, entity_id } = req.query;

//     const query = `
//       SELECT dfv.*, dfd.field_label, dfd.field_type, dfd.field_options
//       FROM dynamic_field_values dfv
//       JOIN dynamic_field_definitions dfd ON dfv.field_definition_id = dfd.id
//       WHERE dfv.entity_type = $1 AND dfv.entity_id = $2
//       ORDER BY dfd.display_order ASC
//     `;

//     const result = await client.query(query, [entity_type, entity_id]);

//     res.status(200).json({ 
//       message: `${msgField} Success`,
//       data: result.rows
//     });

//   } catch (error) { 
//     const message = error instanceof Error ? error.message : String(error);
//     console.log(`${msgField} Causes Error Message: ${message}`);
//     res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
//   } finally {
//     client.release();
//   }
// };

// mongodb version

import { Request, Response } from "express";
import {
  DynamicFieldDefinition,
  DynamicFieldValue,
} from "../../db/ModelSceham/businessDetailsSchema";

export const createDynamicField = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Create Dynamic Field";

  try {
    const {
      tenant_id,
      field_name,
      field_label,
      field_type,
      field_options,
      is_required,
      category,
      validation_rules,
      display_order,
    } = req.body;

    const field = await DynamicFieldDefinition.create({
      tenant_id,
      field_name,
      field_label,
      field_type,
      field_options: field_options || [],
      is_required: is_required || false,
      category,
      validation_rules: validation_rules || {},
      display_order: display_order || 0,
    });

    res.status(201).json({
      message: `${msgField} Success`,
      data: field,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.log(`${msgField} Causes Error Message: ${message}`);

    res.status(500).json({
      error: `${msgField} Causes Error Message: ${message}`,
    });
  }
};

export const getDynamicFields = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Get Dynamic Fields";

  try {
    const { tenant_id, category } = req.query;

    const filter: any = {
      tenant_id,
      is_active: true,
    };

    if (category) {
      filter.category = category;
    }

    const fields = await DynamicFieldDefinition.find(filter).sort({
      display_order: 1,
      created_at: 1,
    });

    res.status(200).json({
      message: `${msgField} Success`,
      data: fields,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.log(`${msgField} Causes Error Message: ${message}`);

    res.status(500).json({
      error: `${msgField} Causes Error Message: ${message}`,
    });
  }
};

export const updateDynamicField = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Update Dynamic Field";

  try {
    const { field_id } = req.params;

    const {
      tenant_id,
      field_label,
      field_type,
      field_options,
      is_required,
      category,
      validation_rules,
      display_order,
      is_active,
    } = req.body;

    const field = await DynamicFieldDefinition.findOneAndUpdate(
      {
        _id: field_id,
        tenant_id,
      },
      {
        field_label,
        field_type,
        field_options: field_options || [],
        is_required,
        category,
        validation_rules: validation_rules || {},
        display_order,
        is_active:
          is_active !== undefined ? is_active : true,
        updated_at: new Date(),
      },
      {
        new: true,
      }
    );

    if (!field) {
      res.status(404).json({
        error: "Field not found",
      });
      return;
    }

    res.status(200).json({
      message: `${msgField} Success`,
      data: field,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.log(`${msgField} Causes Error Message: ${message}`);

    res.status(500).json({
      error: `${msgField} Causes Error Message: ${message}`,
    });
  }
};

export const deleteDynamicField = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Delete Dynamic Field";

  try {
    const { field_id } = req.params;
    const { tenant_id } = req.body;

    const field = await DynamicFieldDefinition.findOneAndUpdate(
      {
        _id: field_id,
        tenant_id,
      },
      {
        is_active: false,
        updated_at: new Date(),
      },
      {
        new: true,
      }
    );

    if (!field) {
      res.status(404).json({
        error: "Field not found",
      });
      return;
    }

    res.status(200).json({
      message: `${msgField} Success`,
      data: field,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.log(`${msgField} Causes Error Message: ${message}`);

    res.status(500).json({
      error: `${msgField} Causes Error Message: ${message}`,
    });
  }
};

export const saveDynamicFieldValue = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Save Dynamic Field Value";

  try {
    const {
      tenant_id,
      field_definition_id,
      entity_type,
      entity_id,
      field_value,
    } = req.body;

    const value = await DynamicFieldValue.findOneAndUpdate(
      {
        entity_type,
        entity_id,
        field_definition_id,
      },
      {
        tenant_id,
        field_definition_id,
        entity_type,
        entity_id,
        field_value,
        updated_at: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.status(200).json({
      message: `${msgField} Success`,
      data: value,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.log(`${msgField} Causes Error Message: ${message}`);

    res.status(500).json({
      error: `${msgField} Causes Error Message: ${message}`,
    });
  }
};

export const getDynamicFieldValues = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Get Dynamic Field Values";

  try {
    const { entity_type, entity_id } = req.query;

    const values = await DynamicFieldValue.find({
      entity_type,
      entity_id,
    }).populate({
      path: "field_definition_id",
      select:
        "field_label field_type field_options display_order",
    });

    const formattedValues = values
      .map((item: any) => ({
        ...item.toObject(),
        field_label:
          item.field_definition_id?.field_label || "",
        field_type:
          item.field_definition_id?.field_type || "",
        field_options:
          item.field_definition_id?.field_options || [],
        display_order:
          item.field_definition_id?.display_order || 0,
      }))
      .sort(
        (a, b) =>
          (a.display_order || 0) -
          (b.display_order || 0)
      );

    res.status(200).json({
      message: `${msgField} Success`,
      data: formattedValues,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.log(`${msgField} Causes Error Message: ${message}`);

    res.status(500).json({
      error: `${msgField} Causes Error Message: ${message}`,
    });
  }
};