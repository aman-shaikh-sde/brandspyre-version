# Brandspyre — Enterprise Route Security Matrix

This document maps all backend API routes, their authentication requirements, tenant scoping mechanisms, RBAC authorization, and applied rate limits.

---

## 1. Authentication & Session Architecture

| Route Pattern | Method | Auth Required | Tenant Context | Rate Limit | Primary Middleware / Handler |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/saas/auth/register-wizard` | POST | No | Created during wizard | Normal API | `registerWizard` |
| `/api/saas/auth/verify-email` | GET | No | Token verified | Normal API | `verifyEmail` |
| `/api/saas/auth/login` | POST | No | Resolved via credentials | 10 req / 15 min | `loginLimiter`, `login` |
| `/api/saas/auth/forgot-password` | POST | No | Resolved via email | 5 req / 1 hr | `passwordResetLimiter`, `forgotPassword` |
| `/api/saas/auth/reset-password` | POST | No | Resolved via token | 5 req / 1 hr | `passwordResetLimiter`, `resetPassword` |
| `/api/saas/auth/refresh-token` | POST | HttpOnly Cookie / Body | Rotated in DB & Cookie | Normal API | `refreshToken` |
| `/api/saas/auth/logout` | POST | Yes | User session purged | Normal API | `authMiddleware`, `logout` |
| `/api/saas/auth/workspaces` | GET | Yes | Scoped to user ID | Normal API | `authMiddleware`, `getUserWorkspaces` |
| `/api/saas/auth/switch-workspace` | POST | Yes | Validated against UserTenant | Normal API | `authMiddleware`, `switchWorkspace` |
| `/api/users/user-management/login` | POST | No | Resolved via credentials | 10 req / 15 min | `loginLimiter`, `loginUsers` |

---

## 2. Platform Administration & Cross-Tenant Oversight

| Route Pattern | Method | Required Role | Tenant Context | Audit Logging | Middleware Chain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/platform-admin/*` | ALL | Platform Admin (`isPlatformAdminRole`) | Optional target query | Yes (`CROSS_TENANT_ACCESS`) | `authMiddleware`, `platformAdminAuth` |
| `/api/superadmin/*` | ALL | Platform Superadmin / Master | Cross-tenant | Yes (`CROSS_TENANT_ACCESS`) | `authMiddleware`, `isPlatformAdminRole` |
| `/api/support/*` | ALL | Platform Support / Admin | Ticket tenant context | Yes | `authMiddleware`, `supportAuth` |
| `/api/dynamic-config/*` | ALL | Platform Admin / System | Global system config | Yes | `authMiddleware`, `platformAdminAuth` |

---

## 3. Multi-Tenant Core CRM & Project Modules

| Route Pattern | Method | Auth Required | Tenant Scoping | Branch Scoping | Middleware Chain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/project/overview/view` | GET | Yes | Strict `tenant_id` | Enforced by role (`admin` or staff `brcode`) | `authMiddleware`, `tenantAuth()`, `viewProject` |
| `/api/project/overview/create` | POST | Yes | Injected from token | Validated against user branch | `authMiddleware`, `tenantAuth()`, `createProject` |
| `/api/project/overview/edit` | PUT | Yes | Filtered by `tenant_id` | Branch match enforced | `authMiddleware`, `tenantAuth()`, `editProject` |
| `/api/project/overview/delete` | DELETE | Yes | Filtered by `tenant_id` | Branch match enforced | `authMiddleware`, `tenantAuth()`, `deleteProject` |
| `/api/client/overview/view` | GET | Yes | Strict root `tenant_id` | Admin filter or staff `brcode` | `authMiddleware`, `tenantAuth()`, `viewClientInfo` |
| `/api/client/overview/create` | POST | Yes | Injected from token | Validated against branch | `authMiddleware`, `tenantAuth()`, `createClientInfo` |
| `/api/client/overview/edit` | PUT | Yes | Strict `tenant_id` query | Branch match enforced | `authMiddleware`, `tenantAuth()`, `editClientInfo` |
| `/api/client/overview/delete` | DELETE | Yes | Strict `tenant_id` query | Branch match enforced | `authMiddleware`, `tenantAuth()`, `deleteClientInfo` |
| `/api/branch/branch-staff/view` | GET | Yes | Strict `tenant_id` | Branch code scoped (no empty fallback) | `authMiddleware`, `tenantAuth()`, `viewBranchStaffInfo` |
| `/api/branch/department/view` | GET | Yes | Strict `tenant_id` | Branch code scoped (no empty fallback) | `authMiddleware`, `tenantAuth()`, `viewDepartmentInfo` |
| `/api/branch/designation/view` | GET | Yes | Strict `tenant_id` | Branch code scoped (no empty fallback) | `authMiddleware`, `tenantAuth()`, `viewDesignationInfo` |

---

## 4. File Upload & Download Security

| Route Pattern | Method | File Limit | MIME Whitelist | Tenant Sandboxing | Middleware Chain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/user-documents/upload` | POST | 15MB, 10 files | PDF, Office, CSV, Images | `/uploads/tenants/:tenantId/documents` | `authMiddleware`, `tenantAuth()`, `uploadLimiter`, `upload.single('file')` |
| `/api/user-documents/download/:id` | GET | N/A | Stream | Verified ownership & path traversal check | `authMiddleware`, `tenantAuth()`, `downloadDocument` |
| `/documents/*` | GET | N/A | Static | Verified via `UserDocument` / `ClientDocument` metadata | `authMiddleware`, `tenantAuth()`, `fileAuthMiddleware`, `express.static` |
| `/recordings/*` | GET | N/A | Static | Verified via `fileAuthMiddleware` | `authMiddleware`, `tenantAuth()`, `fileAuthMiddleware`, `express.static` |
| `/uploads/*` | GET | N/A | Static | Verified via `fileAuthMiddleware` | `authMiddleware`, `tenantAuth()`, `fileAuthMiddleware`, `express.static` |
| `/uploads/public-content/*` | GET | N/A | Public | Public marketing media only | `express.static` (Read-only, 7-day cache) |

---

## 5. AI Assistant & CRM Function Calling

| Route Pattern | Method | Auth Required | Tenant Scoping | Tool Scoping | RBAC Protection |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/ai/chat` | POST | Yes | User token `tenantId` & `branchcode` | `tenant_id` applied to all query/create functions | Creation tools restricted to admin/owner/manager |

---

## 6. Payments & Billing

| Route Pattern | Method | Signature Verification | Idempotency | State Machine Guard | Handler |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/razorpay/webhook` | POST | HMAC-SHA256 timing-safe | Mongo `WebhookEventLog` unique index & memory cache | Prevents overriding `completed` to `failed` | `handleRazorpayWebhook` |
| `/api/razorpay/verify-payment` | POST | HMAC-SHA256 timing-safe | Validates Razorpay captured status | Underpayment checks enforced | `verifyPayment` |
| `/api/razorpay/create-order` | POST | Session token | Authoritative server calculated amount | Starts in `pending` | `createPaymentOrder` |
