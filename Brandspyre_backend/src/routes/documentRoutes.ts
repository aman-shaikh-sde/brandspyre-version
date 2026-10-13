import express from 'express';
import { upload } from '../middleware/upload'; // multer middleware in .ts
import { validateUploadMagicBytes } from '../middleware/secureUpload';
import { uploadDocument } from '../controllers/project/clientdocument/create';
import { getClientDocuments } from '../controllers/project/clientdocument/view';
import { deleteClientDocument } from '../controllers/project/clientdocument/delete';

import { uploadFinalDocument } from '../controllers/project/finaldocument/create';
import { getFinalDocuments } from '../controllers/project/finaldocument/view';
import { deleteFinalDocument } from '../controllers/project/finaldocument/delete';

import { uploadDraftDocument } from '../controllers/project/draftdocument/create';
import { getDraftDocuments } from '../controllers/project/draftdocument/view';
import { deleteDraftDocument } from '../controllers/project/draftdocument/delete';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Route to handle file upload
router.post('/upload', uploadLimiter, authMiddleware, tenantAuth(), upload.single('file'), validateUploadMagicBytes, uploadDocument);
router.get('/client-documents/:project_id', authMiddleware, tenantAuth(), getClientDocuments);
router.delete('/client-documents/:id', authMiddleware, tenantAuth(), deleteClientDocument);

router.post('/uploadfinal', uploadLimiter, authMiddleware, tenantAuth(), upload.single('file'), validateUploadMagicBytes, uploadFinalDocument);
router.get('/final-documents/:project_id', authMiddleware, tenantAuth(), getFinalDocuments);
router.delete('/final-documents/:id', authMiddleware, tenantAuth(), deleteFinalDocument);

router.post('/uploaddraft', uploadLimiter, authMiddleware, tenantAuth(), upload.single('file'), validateUploadMagicBytes, uploadDraftDocument);
router.get('/draft-documents/:project_id', authMiddleware, tenantAuth(), getDraftDocuments);
router.delete('/draft-documents/:id', authMiddleware, tenantAuth(), deleteDraftDocument);

export default router;
