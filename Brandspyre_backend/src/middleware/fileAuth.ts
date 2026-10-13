import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { UserDocument } from '../db/ModelSceham/userDocumentsSchema';
import { ClientDocument, Project } from '../db/ModelSceham/project/client';
import { TemplateAsset } from '../db/ModelSceham/documentTemplateSchema';
import { UserInfo } from '../db/ModelSceham/userSchema';
import { MeetingRecording } from '../db/ModelSceham/meetingSchema';
import { TenantRelationship } from '../db/ModelSceham/tenantRelationshipSchema';
import { isPlatformAdminRole } from './securityContext';

/**
 * Middleware ensuring file requests are authenticated and scoped to the user's tenant
 * or authorized inter-company relationship.
 */
export const fileAuthMiddleware = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Guard against path traversal attacks
    if ((req.path && req.path.includes('..')) || (req.url && req.url.includes('..'))) {
      res.status(400).json({ success: false, message: 'Invalid path: directory traversal attempt detected.' });
      return;
    }
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to access files.' });
      return;
    }

    const userRole = req.user.userRole || req.user.role;
    if (isPlatformAdminRole(userRole)) {
      return next();
    }

    const userTenantId = (req.tenant?.id || req.user?.tenantId)?.toString();
    if (!userTenantId) {
      res.status(403).json({ success: false, message: 'Tenant context required.' });
      return;
    }

    // Extract filename from request URL
    const filename = path.basename(req.path || req.url || '');
    if (!filename) {
      return next();
    }

    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Check UserDocument
    const doc: any = await UserDocument.findOne({
      $or: [
        { file_path: { $regex: escapedFilename, $options: 'i' } },
        { document_title: { $regex: escapedFilename, $options: 'i' } }
      ]
    }).lean();

    if (doc) {
      if (doc.tenant_id) {
        const docTenantId = doc.tenant_id.toString();
        if (docTenantId === userTenantId) {
          return next();
        }
        // Check active inter-company sharing relationship
        const hasRelationship = await TenantRelationship.findOne({
          $or: [
            { tenant_a_id: userTenantId, tenant_b_id: docTenantId, status: 'active' },
            { tenant_a_id: docTenantId, tenant_b_id: userTenantId, status: 'active' }
          ]
        }).lean();

        if (hasRelationship) {
          return next();
        }
      }
      res.status(403).json({ success: false, message: 'Access denied to cross-tenant document.' });
      return;
    }

    // 2. Check ClientDocument
    const clientDoc: any = await ClientDocument.findOne({
      $or: [
        { file_path: { $regex: escapedFilename, $options: 'i' } },
        { file_name: { $regex: escapedFilename, $options: 'i' } }
      ]
    }).lean();

    if (clientDoc) {
      const project: any = await Project.findOne({ project_id: clientDoc.project_id }).lean();
      if (project && project.tenant_id) {
        const projectTenantId = project.tenant_id.toString();
        if (projectTenantId === userTenantId) {
          return next();
        }
      }
      res.status(403).json({ success: false, message: 'Access denied to cross-tenant client document.' });
      return;
    }

    // 3. Check TemplateAsset
    const assetDoc: any = await TemplateAsset.findOne({
      $or: [
        { filename: { $regex: escapedFilename, $options: 'i' } },
        { file_path: { $regex: escapedFilename, $options: 'i' } }
      ]
    }).lean();

    if (assetDoc) {
      if (assetDoc.tenant_id && assetDoc.tenant_id.toString() === userTenantId) {
        return next();
      }
      res.status(403).json({ success: false, message: 'Access denied to cross-tenant template asset.' });
      return;
    }

    // 4. Check UserInfo (profile picture)
    const userProfile: any = await UserInfo.findOne({
      profileurl: { $regex: escapedFilename, $options: 'i' }
    }).lean();

    if (userProfile) {
      if (userProfile.tenant_id && userProfile.tenant_id.toString() === userTenantId) {
        return next();
      }
      res.status(403).json({ success: false, message: 'Access denied to user profile asset.' });
      return;
    }

    // 5. Check MeetingRecording
    const recordingDoc: any = await MeetingRecording.findOne({
      $or: [
        { file_url: { $regex: escapedFilename, $options: 'i' } },
        { recording_url: { $regex: escapedFilename, $options: 'i' } },
        { file_name: { $regex: escapedFilename, $options: 'i' } }
      ]
    }).lean();

    if (recordingDoc) {
      if (recordingDoc.tenant_id && recordingDoc.tenant_id.toString() === userTenantId) {
        return next();
      }
      res.status(403).json({ success: false, message: 'Access denied to cross-tenant meeting recording.' });
      return;
    }

    // File metadata not found in any tenant records — deny unauthorized access
    res.status(403).json({ success: false, message: 'Access denied: document not found or unauthorized.' });
    return;
  } catch (err) {
    console.error('File authorization error:', err);
    res.status(500).json({ success: false, message: 'Internal error checking file authorization.' });
  }
};
