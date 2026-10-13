import { Request, Response } from "express";
import mongoose from "mongoose";
import { MetaLeadSyncLog } from "../../../db/ModelSceham/metaIntegrationSchema";

/**
 * Sync Logs Controller
 * Retrieves sync logs for monitoring and debugging
 */
export const getSyncLogs = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Sync Logs";
  
  try {
    const { formId, status, page = 1, limit = 50 } = req.query;
    
    // Get tenant info from auth context
    const tenantId = (req.user as any)?.tenantId;
    const branchcode = (req.user as any)?.brcode;
    
    if (!tenantId || !branchcode) {
      res.status(400).json({ 
        success: false, 
        message: "Tenant ID and branchcode are required from authentication context" 
      });
      return;
    }
    
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    
    // Build filter
    const filter: any = {
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode
    };
    
    if (formId) filter.meta_form_id = formId;
    if (status) filter.sync_status = status;
    
    // Get total count
    const totalDocuments = await MetaLeadSyncLog.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    
    // Fetch logs
    const logs = await MetaLeadSyncLog.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean();
    
    res.status(200).json({ 
      success: true, 
      message: `${msgField} Success`,
      data: logs,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ 
      success: false, 
      error: `${msgField} Causes Error Message: ${message}` 
    });
  }
};

/**
 * Get Sync Statistics
 */
export const getSyncStats = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Sync Stats";
  
  try {
    // Get tenant info from auth context
    const tenantId = (req.user as any)?.tenantId;
    const branchcode = (req.user as any)?.brcode;
    
    if (!tenantId || !branchcode) {
      res.status(400).json({ 
        success: false, 
        message: "Tenant ID and branchcode are required from authentication context" 
      });
      return;
    }
    
    // Get statistics
    const stats = await MetaLeadSyncLog.aggregate([
      {
        $match: {
          tenant_id: new mongoose.Types.ObjectId(tenantId as string),
          branchcode: branchcode
        }
      },
      {
        $group: {
          _id: "$sync_status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalLeads = await MetaLeadSyncLog.countDocuments({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode
    });
    
    const successCount = stats.find(s => s._id === 'success')?.count || 0;
    const failedCount = stats.find(s => s._id === 'failed')?.count || 0;
    const duplicateCount = stats.find(s => s._id === 'duplicate')?.count || 0;
    const processingCount = stats.find(s => s._id === 'processing')?.count || 0;
    
    res.status(200).json({ 
      success: true, 
      message: `${msgField} Success`,
      data: {
        total: totalLeads,
        success: successCount,
        failed: failedCount,
        duplicate: duplicateCount,
        processing: processingCount,
        success_rate: totalLeads > 0 ? ((successCount / totalLeads) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ 
      success: false, 
      error: `${msgField} Causes Error Message: ${message}` 
    });
  }
};
