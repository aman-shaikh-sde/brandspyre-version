import mongoose from 'mongoose';
// import { Request, Response } from "express";
// 

// export const getBusinessTypes = async (req: Request, res: Response): Promise<void> => {
//   const msgField = "Get Business Types";
//   const session = await mongoose.startSession();
  
//   try {
//     const query = `
//       SELECT * FROM business_types 
//       WHERE is_active = true 
//       ORDER BY name ASC
//     `;

//     const result = await client.query(query);

//     res.status(200).json({ 
//       message: `${msgField} Success`,
//       data: result.rows
//     });

//   } catch (error) { 
//     const message = error instanceof Error ? error.message : String(error);
//     console.log(`${msgField} Causes Error Message: ${message}`);
//     res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
//   } finally {
//     session.endSession();
//   }
// };

// export const saveTenantBusinessDetails = async (req: Request, res: Response): Promise<void> => {
//   const msgField = "Save Tenant Business Details";
//   const session = await mongoose.startSession();
  
//   try {
//     const { userId, userRole, brcode } = req.user as any;
//     const { 
//       tenant_id,
//       business_type_id,
//       company_name,
//       industry,
//       company_size,
//       website,
//       phone,
//       address,
//       city,
//       state,
//       country,
//       postal_code,
//       tax_id,
//       registration_number,
//       custom_fields
//     } = req.body;

//     session.startTransaction();

//     // Check if business details already exist for tenant
//     const existingQuery = `
//       SELECT id FROM tenant_business_details WHERE tenant_id = $1
//     `;
//     const existingResult = await client.query(existingQuery, [tenant_id]);

//     let businessDetailsId;

//     if (existingResult.rows.length > 0) {
//       // Update existing
//       const updateQuery = `
//         UPDATE tenant_business_details 
//         SET business_type_id = $1, company_name = $2, industry = $3, company_size = $4,
//             website = $5, phone = $6, address = $7, city = $8, state = $9, country = $10,
//             postal_code = $11, tax_id = $12, registration_number = $13, custom_fields = $14,
//             updated_at = CURRENT_TIMESTAMP
//         WHERE tenant_id = $15
//         RETURNING *;
//       `;

//       const result = await client.query(updateQuery, [
//         business_type_id, company_name, industry, company_size, website, phone,
//         address, city, state, country, postal_code, tax_id, registration_number,
//         JSON.stringify(custom_fields || {}), tenant_id
//       ]);

//       businessDetailsId = result.rows[0].id;
//     } else {
//       // Insert new
//       const insertQuery = `
//         INSERT INTO tenant_business_details (
//           tenant_id, business_type_id, company_name, industry, company_size,
//           website, phone, address, city, state, country, postal_code,
//           tax_id, registration_number, custom_fields
//         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
//         RETURNING *;
//       `;

//       const result = await client.query(insertQuery, [
//         tenant_id, business_type_id, company_name, industry, company_size,
//         website, phone, address, city, state, country, postal_code,
//         tax_id, registration_number, JSON.stringify(custom_fields || {})
//       ]);

//       businessDetailsId = result.rows[0].id;
//     }

//     await session.commitTransaction();

//     res.status(200).json({ 
//       message: `${msgField} Success`,
//       data: { id: businessDetailsId }
//     });

//   } catch (error) { 
//     await session.abortTransaction();
//     const message = error instanceof Error ? error.message : String(error);
//     console.log(`${msgField} Causes Error Message: ${message}`);
//     res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
//   } finally {
//     session.endSession();
//   }
// };

// export const getTenantBusinessDetails = async (req: Request, res: Response): Promise<void> => {
//   const msgField = "Get Tenant Business Details";
//   const session = await mongoose.startSession();
  
//   try {
//     const { userId, userRole, brcode } = req.user as any;
//     const { tenant_id } = req.query;

//     const query = `
//       SELECT tbd.*, bt.name as business_type_name, bt.default_fields
//       FROM tenant_business_details tbd
//       LEFT JOIN business_types bt ON tbd.business_type_id = bt.id
//       WHERE tbd.tenant_id = $1
//     `;

//     const result = await client.query(query, [tenant_id]);

//     res.status(200).json({ 
//       message: `${msgField} Success`,
//       data: result.rows[0] || null
//     });

//   } catch (error) { 
//     const message = error instanceof Error ? error.message : String(error);
//     console.log(`${msgField} Causes Error Message: ${message}`);
//     res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
//   } finally {
//     session.endSession();
//   }
// };


//mongodb version 

import { Request, Response } from "express";
import {
  BusinessType,
  TenantBusinessDetails
} from "../../db/ModelSceham/businessDetailsSchema";

export const getBusinessTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Get Business Types";

  try {
    const businessTypes = await BusinessType.find({
      is_active: true,
    }).sort({ name: 1 });

    res.status(200).json({
      message: `${msgField} Success`,
      data: businessTypes,
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

export const saveTenantBusinessDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Save Tenant Business Details";

  try {
    const {
      tenant_id,
      business_type_id,
      company_name,
      industry,
      company_size,
      website,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      tax_id,
      registration_number,
      custom_fields,
    } = req.body;

    const businessDetails =
      await TenantBusinessDetails.findOneAndUpdate(
        { tenant_id },
        {
          tenant_id,
          business_type_id,
          company_name,
          industry,
          company_size,
          website,
          phone,
          address,
          city,
          state,
          country,
          postal_code,
          tax_id,
          registration_number,
          custom_fields: custom_fields || {},
        },
        {
          new: true,
          upsert: true,
        }
      );

    res.status(200).json({
      message: `${msgField} Success`,
      data: {
        id: businessDetails._id,
      },
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

export const getTenantBusinessDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Get Tenant Business Details";

  try {
    const { tenant_id } = req.query;

    const businessDetails =
      await TenantBusinessDetails.findOne({
        tenant_id,
      }).populate({
        path: "business_type_id",
        select: "name default_fields",
      });

    let data = null;

    if (businessDetails) {
      const businessType: any =
        businessDetails.business_type_id;

      data = {
        ...businessDetails.toObject(),
        business_type_name: businessType?.name || null,
        default_fields: businessType?.default_fields || [],
      };
    }

    res.status(200).json({
      message: `${msgField} Success`,
      data,
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

export const checkBusinessDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Check Business Details";
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).tenant?.id || req.query.tenant_id;
    if (!tenantId) {
      res.status(200).json({
        message: `${msgField} Success`,
        data: { isCompleted: true }
      });
      return;
    }

    const businessDetails = await TenantBusinessDetails.findOne({ tenant_id: tenantId });
    res.status(200).json({
      message: `${msgField} Success`,
      data: {
        isCompleted: !!businessDetails,
        details: businessDetails || null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(200).json({
      message: `${msgField} Success`,
      data: { isCompleted: true }
    });
  }
};