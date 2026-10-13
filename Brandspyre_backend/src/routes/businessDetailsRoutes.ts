import express from "express";
import {
  getBusinessTypes,
  saveTenantBusinessDetails,
  getTenantBusinessDetails,
  checkBusinessDetails
} from "../controllers/businessDetails/businessDetailsController";
import {
  createDynamicField,
  getDynamicFields,
  updateDynamicField,
  deleteDynamicField,
  saveDynamicFieldValue,
  getDynamicFieldValues
} from "../controllers/businessDetails/dynamicFieldsController";
import authenticateToken from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
// Apply tenant authentication middleware to all routes
router.use(tenantAuth());

// Business types routes
router.get("/business-types", getBusinessTypes);

// Business details routes
router.post("/business-details", saveTenantBusinessDetails);
router.get("/business-details", getTenantBusinessDetails);
router.get("/check", checkBusinessDetails);

// Dynamic field definitions routes
router.post("/dynamic-fields", createDynamicField);
router.get("/dynamic-fields", getDynamicFields);
router.put("/dynamic-fields/:field_id", updateDynamicField);
router.delete("/dynamic-fields/:field_id", deleteDynamicField);

// Dynamic field values routes
router.post("/dynamic-field-values", saveDynamicFieldValue);
router.get("/dynamic-field-values", getDynamicFieldValues);

export default router;
