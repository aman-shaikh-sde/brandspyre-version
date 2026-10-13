import express from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { authorizePermission } from '../middleware/authorize';
import { upload } from '../middleware/upload';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  publishTemplate,
  archiveTemplate,
  restoreTemplate,
  setDefaultTemplate,
  getVersions,
  restoreVersion,
  renderTemplate,
  previewTemplate,
  getVariables,
  getMetadata,
  uploadAsset,
  listAssets,
  seedTemplates,
} from '../controllers/documentTemplate/documentTemplateController';

const router = express.Router();

// Metadata & Variables (put above parameterized routes to avoid /:id conflicts)
router.get('/metadata', authMiddleware, tenantAuth(), getMetadata);
router.post('/seed', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.create'), seedTemplates);
router.get('/variables/:documentType', authMiddleware, tenantAuth(), getVariables);

// Asset management
router.post('/assets/upload', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.create'), upload.single('file'), uploadAsset);
router.get('/assets', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.read'), listAssets);

// CRUD
router.get('/', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.read'), listTemplates);
router.post('/', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.create'), createTemplate);
router.get('/:id', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.read'), getTemplate);
router.put('/:id', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.update'), updateTemplate);
router.delete('/:id', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.delete'), deleteTemplate);

// Template actions
router.post('/:id/duplicate', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.create'), duplicateTemplate);
router.post('/:id/publish', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.publish'), publishTemplate);
router.post('/:id/archive', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.update'), archiveTemplate);
router.post('/:id/restore', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.update'), restoreTemplate);
router.post('/:id/set-default', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.manage'), setDefaultTemplate);

// Version control
router.get('/:id/versions', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.read'), getVersions);
router.post('/:id/versions/:versionNumber/restore', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.manage'), restoreVersion);

// Rendering
router.post('/:id/render', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.read'), renderTemplate);
router.post('/:id/preview', authMiddleware, tenantAuth(), authorizePermission('setting.documentTemplate.read'), previewTemplate);

export default router;
