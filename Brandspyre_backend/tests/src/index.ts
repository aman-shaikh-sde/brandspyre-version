import dotenv from "dotenv";
dotenv.config();
import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) { }
import mongoose from "mongoose";

/// <reference path="./types/globals.d.ts" />
/// <reference path="./types/pg.d.ts" />
/// <reference path="./types/nodemailer.d.ts" />




import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupMeetingSockets } from "./sockets/meetingSocket";
import userRoutes from "./routes/usersRoutes";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import cors from 'cors';

import { initializeBranches } from "./db/ModelSceham/branchSchema";
import { initializeRoleAccess } from "./db/ModelSceham/roleAccessSchema";
import { initializeUserInfo } from './db/ModelSceham/userSchema';
import { initializeTables } from "./db/InitializeTables";
import { InitializeAllUserTables, InitializeAllProjectTables } from './userTables';
import { InitializeAllAdminTables } from "./adminTables";
import { ensureDatabaseExists } from './db/index';

import { initializeUserDocuments } from "./db/ModelSceham/userDocumentsSchema";
import { initializeSessionSchema } from "./db/ModelSceham/sessionSchema";
import { initializeSaasSchema } from "./db/ModelSceham/saasSchema";
import { initializeSubscriptionSystemSchema } from "./db/ModelSceham/subscriptionSystemSchema";
import { initializeAccountingSchema } from "./db/ModelSceham/accountingSchema";
import { initializeBusinessDetailsSchema } from "./db/ModelSceham/businessDetailsSchema";
import { initializeMeetingSchema } from "./db/ModelSceham/meetingSchema";
import { initializeMarketingSchema } from "./db/ModelSceham/marketingSchema";
import { initializeWebsiteSchema } from "./db/ModelSceham/websiteSchema";
import { initializeMetaIntegrationSchema } from "./db/ModelSceham/metaIntegrationSchema";
import { initializeDocumentTemplateSchema } from "./db/ModelSceham/documentTemplateSchema";
import { initializeBillingSchema } from "./db/ModelSceham/billingSchema";
import { initializePublicContentSchema } from "./db/ModelSceham/publicContentSchema";
import { seedPublicContentData } from "./db/seedPublicContent";
import { publicContentPublicRouter, publicContentAdminRouter } from "./routes/publicContentRoutes";

import branchRoute from './routes/branchRoutes';
import roleAccessRoute from './routes/settingRoutes';
import userRoute from './routes/usersRoutes';
import masterRoute from './routes/masterRoutes';
import usersRoute from './routes/usersRoutes';
import projectRoute from './routes/projectRoutes';
import reportRoutes from './routes/reportRoutes';
import momRoutes from './routes/momRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import documentRoutes from './routes/documentRoutes';
import accountingRoutes from './routes/accountingRoutes';
import saasRoutes from './routes/saasRoutes';
import userDocumentsRoutes from './routes/userDocumentsRoutes';
import tenantRegistrationRoutes from "./routes/tenantRegistrationRoutes";
import businessDetailsRoutes from './routes/businessDetailsRoutes';
import meetingRoutes from './routes/meetingRoutes';
import marketingRoutes from './routes/marketingRoutes';
import websiteRoutes from './routes/websiteRoutes';
import metaRoutes from './routes/metaRoutes';
import aiRoutes from './routes/aiRoutes';
import saasRBACRoutes from './routes/saasRBACRoutes';
import documentTemplateRoutes from './routes/documentTemplateRoutes';
import masterDataRoutes from './routes/masterDataRoutes';
import billingRoutes from './routes/billingRoutes';
import leadExchangeRoutes from './routes/leadExchangeRoutes';
import referralRoutes from './routes/referralRoutes';
import razorpayRoutes from './routes/razorpayRoutes';
import EmailService from './services/email/EmailService';
import organizationConfigRoutes from './routes/organizationConfigRoutes';
import industryRoutes from './routes/industryRoutes';
import productRoutes from './routes/productRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import posRoutes from './routes/posRoutes';
import salesRoutes from './routes/salesRoutes';
import salesCommerceRoutes from './routes/salesCommerceRoutes';
import commerceReportRoutes from './routes/commerceReportRoutes';
import productionRoutes from './routes/productionRoutes';
import dynamicConfigRoutes from './routes/dynamicConfigRoutes';
import { initializeCommerceSchema } from './db/ModelSceham/commerceSchema';
import { initializeDynamicConfigSchema } from './db/ModelSceham/dynamicConfigSchema';
import seedDynamicConfigData from './db/seedDynamicConfigData';
import { migrateExistingOrganizations } from './db/migrateExistingOrganizations';


import organizationPaymentRoutes from './routes/organizationPaymentRoutes';
import renderRoutes from "./routes/render";
import templateRoutes from './routes/templateRoutes';
import { activityLogger } from './middleware/activityLogger';
import { Template } from './db/ModelSceham/templateSchema';
import PermissionRegistry from './services/saas/PermissionRegistry';

(global as any).client = {
  query: async () => ({ rows: [], rowCount: 0 }),
  release: () => { }
};
(global as any).session = undefined;

import { normalApiLimiter, loginLimiter, passwordResetLimiter, otpLimiter, uploadLimiter } from "./middleware/rateLimiter";
import { requestIdMiddleware } from "./middleware/requestId";
import { structuredLogger } from "./middleware/structuredLogger";

// Production CORS allowlist configuration
const allowedOriginsEnv = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(s => s.trim()).filter(Boolean)
  : [];
const devOrigins = ['http://brandspyre.in', 'http://www.brandspyre.in', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
const isDev = process.env.NODE_ENV !== 'production';

const corsOriginDelegate = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);
  const allowed = allowedOriginsEnv.includes(origin) || (isDev && devOrigins.includes(origin));
  if (allowed) {
    callback(null, true);
  } else {
    callback(new Error(`CORS error: Origin '${origin}' not allowed by security policy.`));
  }
};

import helmet from "helmet";
import authMiddleware from "./middleware/auth";
import { tenantAuth } from "./middleware/tenantAuth";
import { fileAuthMiddleware } from "./middleware/fileAuth";

const app = express();
app.set("trust proxy", 1);

// Liveness and Readiness Probes for Production Health Monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/ready", (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  if (isDbReady) {
    res.status(200).json({ status: "ready", database: "connected", timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({ status: "unready", database: "disconnected", timestamp: new Date().toISOString() });
  }
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOriginDelegate,
    methods: ["GET", "POST"]
  }
});
setupMeetingSockets(io);

// Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Socket.io / inline frontend compatibility
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(requestIdMiddleware);
app.use(structuredLogger);
app.use(cors({ origin: corsOriginDelegate, credentials: true }));
app.use(express.json({
  verify: (req, res, buf) => {
    (req as any).rawBody = buf;
  }
}));
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    (req as any).rawBody = buf;
  }
}));
app.use(bodyParser.urlencoded({ extended: true }));
// Native cookie parser middleware
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    (req as any).cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, pair: string) => {
      const [key, ...vals] = pair.trim().split("=");
      if (key) acc[key] = decodeURIComponent(vals.join("="));
      return acc;
    }, {});
  } else {
    (req as any).cookies = {};
  }
  next();
});
app.use(activityLogger);

// Global API Rate Limiter
app.use("/api/", normalApiLimiter);

// Unauthenticated Public Static File Routes (for Public Marketing CMS Media)
app.use("/uploads/public-content", express.static(path.join(__dirname, "../uploads/public-content"), { maxAge: "7d" }));
app.use("/uploads/public-content", express.static(path.join(__dirname, "../../uploads/public-content"), { maxAge: "7d" }));

// Authenticated & Tenant-Isolated Static File Routes
app.use("/documents", authMiddleware, tenantAuth(), fileAuthMiddleware, express.static(path.join(__dirname, "../uploads/documents")));
app.use("/recordings", authMiddleware, tenantAuth(), fileAuthMiddleware, express.static(path.join(__dirname, "../uploads/recordings")));
app.use("/uploads/documents", authMiddleware, tenantAuth(), fileAuthMiddleware, express.static(path.join(__dirname, "../../uploads/documents")));
app.use("/uploads", authMiddleware, tenantAuth(), fileAuthMiddleware, express.static(path.join(__dirname, "../../uploads")));
app.use('/Uploads', authMiddleware, tenantAuth(), fileAuthMiddleware, express.static(path.join(__dirname, 'Uploads')));


import platformAdminRoutes from './routes/platformAdminRoutes';
import supportRoutes from './routes/supportRoutes';
import { initializeBusinessTypeSchema } from './db/ModelSceham/businessTypeSchema';
import { initializePricingSchema } from './db/ModelSceham/pricingSchema';
import { initializeSupportTicketSchema } from './db/ModelSceham/supportTicketSchema';
import { seedExcelMatrixData } from './db/excelMatrixSeed';

// Standard API Routes (/api) & Enterprise Versioned Routes (/api/v1)
const mountRoutes = (prefix: string) => {
  // 🌐 1. Public Marketing Content & CMS Public Endpoints (Unauthenticated, Read-Only)
  app.use(`${prefix}/public`, publicContentPublicRouter);

  // 📝 2. Authenticated Content Management System (CMS) Endpoints
  app.use(`${prefix}/content`, publicContentAdminRouter);

  app.use(prefix, branchRoute);
  app.use(prefix, roleAccessRoute);
  app.use(prefix, userRoute);
  app.use(prefix, masterRoute);
  app.use(prefix, usersRoute);
  app.use(prefix, projectRoute);
  app.use(prefix, reportRoutes);
  app.use(prefix, momRoutes);
  app.use(prefix, invoiceRoutes);
  app.use(prefix, documentRoutes);
  app.use(`${prefix}/accounting`, accountingRoutes);
  app.use(`${prefix}/saas`, saasRoutes);
  app.use(`${prefix}/platform-admin`, platformAdminRoutes);
  app.use(`${prefix}/support`, supportRoutes);
  app.use(`${prefix}/documents`, userDocumentsRoutes);
  app.use(`${prefix}/tenant-registration`, tenantRegistrationRoutes);
  app.use(`${prefix}/business`, businessDetailsRoutes);
  app.use(`${prefix}/meetings`, meetingRoutes);
  app.use(`${prefix}/marketing`, marketingRoutes);
  app.use(`${prefix}/websites`, websiteRoutes);
  app.use(`${prefix}/meta`, metaRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}/templates`, templateRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/saas/rbac`, saasRBACRoutes);
  app.use(`${prefix}/document-templates`, documentTemplateRoutes);
  app.use(prefix, masterDataRoutes);
  app.use(`${prefix}/billing`, billingRoutes);
  app.use(`${prefix}/lead-exchange`, leadExchangeRoutes);
  app.use(`${prefix}/referrals`, referralRoutes);
  app.use(`${prefix}/razorpay`, razorpayRoutes);
  app.use(`${prefix}/organization/payments`, organizationPaymentRoutes);
  app.use(`${prefix}/organization/payment-account`, organizationPaymentRoutes);
  app.use(`${prefix}/organization-payments`, organizationPaymentRoutes);
  app.use(`${prefix}/organization`, organizationConfigRoutes);
  app.use(`${prefix}/config`, dynamicConfigRoutes);
  app.use(`${prefix}/industries`, industryRoutes);
  app.use(`${prefix}/products`, productRoutes);
  app.use(`${prefix}/suppliers`, supplierRoutes);
  app.use(`${prefix}/purchases`, purchaseRoutes);
  app.use(`${prefix}/inventory`, inventoryRoutes);

  // Commerce Route Aliases
  app.use(`${prefix}/commerce/products`, productRoutes);
  app.use(`${prefix}/commerce/suppliers`, supplierRoutes);
  app.use(`${prefix}/commerce/warehouses`, inventoryRoutes);
  app.use(`${prefix}/commerce/inventory`, inventoryRoutes);

  app.use(`${prefix}/pos`, posRoutes);
  app.use(`${prefix}/sales`, salesRoutes);
  app.use(`${prefix}/sales`, salesCommerceRoutes);
  app.use(`${prefix}/clients`, salesRoutes);
  app.use(`${prefix}/customers`, salesRoutes);
  app.use(`${prefix}/leads`, salesRoutes);
  app.use(prefix, salesRoutes);
  app.use(`${prefix}/reports/commerce`, commerceReportRoutes);
  app.use(`${prefix}/production`, productionRoutes);
};

mountRoutes('/api');
mountRoutes('/api/v1');

// Reset database route

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: "healthy" });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get('/readiness', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected) {
    res.status(200).json({ success: true, status: "ready", database: "connected" });
  } else {
    res.status(503).json({ success: false, status: "unready", database: "disconnected" });
  }
});


//restart render


app.use("/api", renderRoutes);


//restart render end


// Database reset endpoint completely eliminated from production runtime.

// Global API Error Handler Middleware (Sanitizes errors in production)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = (req as any).id || (req as any).requestId || 'N/A';
  console.error(`[Global Error] RequestID: ${requestId} —`, err);
  const status = err.status || err.statusCode || 500;
  const errorCode = err.code || (status === 400 ? 'BAD_REQUEST' : status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');

  const errorMessage = process.env.NODE_ENV === 'production' && status === 500
    ? "An unexpected error occurred. Please contact support."
    : (err.message || "Internal server error");

  res.status(status).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      requestId
    },
    message: errorMessage,
    requestId
  });
});

export const PORT = process.env.PORT || 3000;

// Async server startup function
const startServer = async () => {
  try {
    // SECURITY: Validate mandatory JWT secrets before initializing DB or routes
    const { validateJwtSecrets } = require("./middleware/token");
    validateJwtSecrets();

    // Ensure DB exists and initialize all tables - Fail fast if DB connection fails
    await ensureDatabaseExists();
  } catch (fatalError) {
    console.error("❌ Fatal startup error during DB connection / secret validation:", fatalError);
    process.exit(1);
  }

  try {
    await initializeBranches();
    await initializeRoleAccess();
    await initializeUserInfo();
    await initializeUserDocuments();
    await initializeSaasSchema();
    await initializeSessionSchema();
    await initializeSubscriptionSystemSchema();
    await initializeAccountingSchema();
    await initializeBusinessDetailsSchema();
    await initializeMeetingSchema();
    await initializeMarketingSchema();
    await initializeWebsiteSchema();
    await initializeMetaIntegrationSchema();
    await initializeDocumentTemplateSchema();
    await initializeBillingSchema();
    await initializeCommerceSchema();
    await initializeDynamicConfigSchema();
    await seedDynamicConfigData();
    await initializeBusinessTypeSchema();
    await initializePricingSchema();
    await initializeSupportTicketSchema();
    await seedExcelMatrixData();
    const { seedCommercialPricingData } = require('./services/saas/commercialPricingSeed');
    await seedCommercialPricingData();

    // Migrate & seed multi-industry organization entitlements (background async)
    migrateExistingOrganizations().catch(err => console.error('Migration background warning:', err));

    // Sync Enterprise RBAC Permission Registry
    await PermissionRegistry.sync();

    // Start Subscription System Background Cron Worker
    const { SubscriptionCronService } = require('./services/saas/subscriptionCron');
    SubscriptionCronService.start();

    await InitializeAllAdminTables();
    await InitializeAllUserTables();
    await InitializeAllProjectTables();

    // Initialize default joining letter template if not exists
    const joiningLetterExists = await Template.findOne({ name: "joining_letter" });
    if (!joiningLetterExists) {
      await Template.create({
        name: "joining_letter",
        content: `<div class="relative z-10">
  <img src="{logo_url}" alt="Watermark" class="absolute opacity-10 z-0 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] pointer-events-none" />

  <div class="flex justify-between items-center mb-4 border-b border-gray-400 pb-4">
    <img src="{logo_url}" alt="Almino Logo" class="h-20" />
    <div class="text-right text-sm">
      <p class="font-bold text-lg">ALMINO STRUCTURAL CONSULTANCY PVT LTD</p>
      <p class="text-red-500 font-semibold">GST NO : 33AASCA3262R1Z2</p>
    </div>
  </div>

  <div class="text-center mb-4">
    <h2 class="text-xl font-bold underline">JOINING LETTER</h2>
    <p class="text-sm mt-1">GET NO: 330A562A0508172</p>
  </div>

  <p>To,</p>
  <p class="font-semibold">{firstname} {lastname}</p>
  <p>{presentaddress}</p>

  <p class="mt-6 font-semibold">Subject: Joining Letter for the Position of {designation}</p>

  <p class="mt-4">Dear {firstname},</p>
  <p class="mt-2 text-justify">
    We are pleased to confirm your appointment as <strong>{designation}</strong> at Almino Structural Consultancy Pvt Ltd, effective from <strong>{dateofjoining}</strong>.
  </p>

  <div class="mt-4">
    <p><strong>Employee ID:</strong> {staff_id}</p>
    <p><strong>Department:</strong> {department}</p>
    <p><strong>Designation:</strong> {designation}</p>
    <p><strong>Reporting To:</strong> {reporting_to_name}</p>
    <p><strong>Location:</strong> {branch_name}</p>
  </div>

  <div class="mt-4">
    <p class="underline font-semibold">Compensation Details:</p>
    <ul class="list-disc list-inside ml-4">
      <li><strong>Basic Salary:</strong> ₹{basicsalary}</li>
      <li><strong>HRA:</strong> ₹{hra}</li>
      <li><strong>Other Allowances:</strong> ₹{other_allowance}</li>
      <li><strong>Gross Salary:</strong> ₹{gross_salary}</li>
    </ul>
  </div>

  <p class="mt-4 text-justify">
    Your employment will be subject to the terms and conditions outlined in the company's HR policies. Please review the employee handbook for detailed information about your benefits, leave policies, and other employment terms.
  </p>

  <p class="mt-4 text-justify">
    We are excited to have you on board and look forward to a successful and productive association. If you have any questions, please feel free to contact the HR department.
  </p>

  <p class="mt-6">Sincerely,</p>
  <p class="mt-2 font-semibold">HR Manager</p>
  <p>Almino Structural Consultancy Pvt Ltd</p>

  <div class="mt-10 text-right">
    <img src="{seal_url}" alt="Company Seal" class="h-20 inline" />
  </div>

  <footer class="text-sm mt-10 border-t border-gray-300 pt-3">
    <div class="flex justify-between">
      <div>
        <p class="text-red-600">
          📞 +91 95977 46657<br />
          📞 +91 97865 81307
        </p>
      </div>
      <div class="text-right">
        <p>📍 Near King's Palace, Old Check Post,</p>
        <p>Pattinamkathan, Ramanathapuram - 623503</p>
        <p>📧 alminostructure@gmail.com</p>
      </div>
    </div>
  </footer>
</div>`,
        subject: "Joining Letter"
      });
      console.log("Default joining_letter template initialized in database.");
    }

    // Initialize Public Website CMS Schema & Seed Initial Marketing Content
    await initializePublicContentSchema();
    await seedPublicContentData();

    // Initialize Zoho SMTP Email Service
    await EmailService.init();

    console.log("✅ All schemas and dependencies initialized successfully!");

    // SECURITY: Start listening ONLY after all mandatory initialization completes
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log("📁 Available endpoints:");
      console.log("   - /health & /ready - Liveness & Readiness probes");
      console.log("   - /api/accounting/* - Accounting & Tally features");
      console.log("   - /api/saas/* - SaaS & Tenant management");
      console.log("   - /api/documents/* - Document management");
      console.log("   - /api/* - Existing CRM features");
    });
  } catch (error) {
    console.error("❌ Fatal startup failure during schema/service initialization:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
// Server restarted with security hardening

