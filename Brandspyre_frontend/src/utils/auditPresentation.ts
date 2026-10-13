/**
 * Central Audit Presentation Mapper for BRANDSPYRE Platform Administration Console
 * Formats raw security & audit log payloads into professional, human-readable UI elements.
 */

export interface AuditCategory {
  label: string;
  badgeClass: string;
  category: 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SECURITY' | 'BILLING' | 'SUPPORT';
}

export interface AuditActor {
  name: string;
  role: string;
  email: string;
}

export interface AuditEntity {
  displayName: string;
  entityType: string;
  entityId: string;
  truncatedId: string;
}

export interface AuditTimestamp {
  timeString: string;
  dateString: string;
  fullString: string;
}

/**
 * 1. Convert technical action/event codes into clean, professional title labels
 */
export function getAuditTitle(log: any): string {
  if (!log) return 'Platform Activity';

  const action = (log.action || '').toUpperCase();
  const details = log.details || {};

  // Specific event mappings
  if (action === 'USER_LOGIN') return 'User Login';
  if (action === 'ORGANIZATION_STATUS_UPDATE') return 'Organization Status Updated';
  if (action === 'MODULE_ENTITLEMENT_OVERRIDE' || action === 'MODULE_ENTITLEMENT_UPDATE') return 'Module Access Updated';
  if (action === 'SUBSCRIPTION_UPDATE' || action === 'COMMERCIAL_PLAN_UPDATE') return 'Subscription Updated';
  if (action === 'PRICING_UPDATE' || action === 'MODULE_PRICING_UPDATE') return 'Pricing Updated';
  if (action === 'PLAN_UPDATE') return 'Subscription Plan Updated';
  if (action === 'SUPPORT_TICKET_CREATED') return 'Support Ticket Created';
  if (action === 'SUPPORT_TICKET_UPDATED') return 'Support Ticket Updated';
  if (action === 'MIGRATED_ENTITLEMENTS') return 'System Entitlements Migrated';

  // HTTP Method + Route Mappings
  if (action.includes('PUT_ORGANIZATIONS') || (details.method === 'PUT' && details.path?.includes('organizations'))) {
    return 'Organization Updated';
  }
  if (action.includes('POST_ORGANIZATIONS') || (details.method === 'POST' && details.path?.includes('organizations'))) {
    return 'Organization Created';
  }
  if (action.includes('DELETE_ORGANIZATIONS') || (details.method === 'DELETE' && details.path?.includes('organizations'))) {
    return 'Organization Deleted';
  }
  if (action.includes('PUT_BUSINESS') || (details.method === 'PUT' && details.path?.includes('business-types'))) {
    return 'Business Type Matrix Updated';
  }

  // Fallback: Format UPPERCASE_UNDERSCORE to Title Case
  if (action && !action.includes('{') && !action.includes('/')) {
    return action
      .replace(/^PLATFORM_ADMIN_/, '')
      .split('_')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return 'Platform Activity Recorded';
}

/**
 * 2. Convert technical details/metadata into clean human-readable sentence descriptions
 */
export function getAuditDescription(log: any): string {
  if (!log) return 'Event logged successfully.';

  const action = (log.action || '').toUpperCase();
  const details = log.details || {};
  const orgName = getAuditEntity(log).displayName;

  if (action === 'USER_LOGIN') {
    const userEmail = details.email || log.user_id?.email || 'User';
    return `${userEmail} logged in successfully`;
  }

  if (action === 'ORGANIZATION_STATUS_UPDATE') {
    const status = details.status ? details.status.charAt(0).toUpperCase() + details.status.slice(1) : 'Updated';
    const reason = details.lock_reason ? ` (Reason: ${details.lock_reason})` : '';
    return `${orgName} status changed to ${status}${reason}`;
  }

  if (action === 'MODULE_ENTITLEMENT_OVERRIDE') {
    const count = Array.isArray(details.moduleCodes) ? details.moduleCodes.length : 0;
    return `Updated module entitlements for ${orgName} (${count} modules enabled)`;
  }

  if (action === 'SUBSCRIPTION_UPDATE' || action === 'COMMERCIAL_PLAN_UPDATE') {
    return `Subscription plan configuration updated for ${orgName}`;
  }

  if (action === 'PRICING_UPDATE') {
    return `Commercial module pricing catalog modified by Platform Admin`;
  }

  if (action === 'MIGRATED_ENTITLEMENTS') {
    return `System entitlements and feature matrices updated successfully`;
  }

  // Handle explicit message in details
  if (details.message && typeof details.message === 'string' && !details.message.startsWith('{')) {
    return details.message;
  }

  // Description string from backend
  if (log.description && typeof log.description === 'string' && !log.description.startsWith('{')) {
    return log.description;
  }

  // Format object key-values cleanly instead of JSON stringifying
  if (typeof details === 'object' && details !== null) {
    const filterKeys = ['method', 'path', 'headers', 'stack', 'ip'];
    const pairs = Object.entries(details)
      .filter(([k, v]) => !filterKeys.includes(k) && v !== undefined && v !== null && typeof v !== 'object')
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
    if (pairs.length > 0) {
      return `${orgName} — ${pairs.join(' • ')}`;
    }
  }

  return `${getAuditTitle(log)} executed successfully for ${orgName}`;
}

/**
 * 3. Extract semantic categories & light theme badges
 */
export function getAuditCategory(log: any): AuditCategory {
  const action = (log?.action || '').toUpperCase();
  const details = log?.details || {};

  if (action.includes('LOGIN') || action.includes('AUTH')) {
    return {
      label: 'LOGIN',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
      category: 'LOGIN'
    };
  }

  if (action.includes('POST') || action.includes('CREATE') || details.method === 'POST') {
    return {
      label: 'CREATE',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
      category: 'CREATE'
    };
  }

  if (action.includes('DELETE') || action.includes('SUSPEND') || details.method === 'DELETE') {
    return {
      label: 'DELETE',
      badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
      category: 'DELETE'
    };
  }

  if (action.includes('SECURITY') || action.includes('LOCK')) {
    return {
      label: 'SECURITY',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
      category: 'SECURITY'
    };
  }

  if (action.includes('BILLING') || action.includes('PAYMENT') || action.includes('SUBSCRIPTION')) {
    return {
      label: 'BILLING',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
      category: 'BILLING'
    };
  }

  if (action.includes('SUPPORT') || action.includes('TICKET')) {
    return {
      label: 'SUPPORT',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800',
      category: 'SUPPORT'
    };
  }

  return {
    label: 'UPDATE',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    category: 'UPDATE'
  };
}

/**
 * 4. Extract Performed By Actor
 */
export function getAuditActor(log: any): AuditActor {
  if (!log) return { name: 'Superadmin', role: 'PLATFORM_ADMIN', email: 'platformadmin@gmail.com' };

  let name = 'Superadmin';
  let email = log.details?.user_email || 'platformadmin@gmail.com';
  let role = 'PLATFORM_ADMIN';

  if (log.user_id && typeof log.user_id === 'object') {
    const u = log.user_id;
    name = `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.email || 'Superadmin';
    email = u.email || email;
    role = u.role ? u.role.toUpperCase() : 'PLATFORM_ADMIN';
  } else if (log.performed_by_name) {
    name = log.performed_by_name;
  }

  return { name, role, email };
}

/**
 * 5. Extract Organization & Entity Information (No raw ObjectIds in UI)
 */
export function getAuditEntity(log: any): AuditEntity {
  let displayName = 'Platform System';
  let entityType = log?.entity || 'Organization';
  let rawId = log?.entity_id || log?.tenant_id?._id || log?.tenant_id || '';

  if (typeof rawId === 'object') {
    rawId = rawId._id || rawId.toString();
  } else {
    rawId = String(rawId || '');
  }

  if (log?.tenant_id && typeof log.tenant_id === 'object') {
    displayName = log.tenant_id.company_name || log.tenant_id.name || displayName;
  } else if (log?.details?.company_name) {
    displayName = log.details.company_name;
  } else if (log?.details?.organization_name) {
    displayName = log.details.organization_name;
  }

  const truncatedId = rawId.length > 12 ? `${rawId.slice(0, 6)}...${rawId.slice(-6)}` : rawId || 'N/A';

  return {
    displayName,
    entityType,
    entityId: rawId || 'N/A',
    truncatedId
  };
}

/**
 * 6. Format Timestamps
 */
export function getAuditTimestamp(log: any): AuditTimestamp {
  const dateVal = log?.created_at || log?.timestamp || Date.now();
  const d = new Date(dateVal);

  const timeString = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateString = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return {
    timeString,
    dateString,
    fullString: `${dateString}, ${timeString}`
  };
}

/**
 * 7. Extract API Technical Endpoint details for Drawer display only
 */
export function getAuditMethodAndRoute(log: any): { method: string; path: string } {
  const details = log?.details || {};
  let method = details.method || 'PUT';
  let path = details.path || '';

  if (!path && log?.action) {
    const act = log.action;
    if (act.includes('PUT_ORGANIZATIONS')) {
      method = 'PUT';
      path = '/api/v1/platform-admin/organizations/:id';
    } else if (act.includes('POST_ORGANIZATIONS')) {
      method = 'POST';
      path = '/api/v1/platform-admin/organizations';
    } else if (act.includes('STATUS')) {
      method = 'PUT';
      path = '/api/v1/platform-admin/organizations/:id/status';
    }
  }

  return { method, path: path || '/api/v1/platform-admin/events' };
}
