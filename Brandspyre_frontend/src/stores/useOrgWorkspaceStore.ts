import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ActiveOrgWorkspace {
  tenantId: string;
  companyName: string;
  slug?: string;
  businessType?: string;
}

interface OrgWorkspaceState {
  activeOrg: ActiveOrgWorkspace | null;
  enterWorkspace: (org: ActiveOrgWorkspace) => void;
  exitWorkspace: () => void;
}

export const useOrgWorkspaceStore = create<OrgWorkspaceState>()(
  persist(
    (set) => ({
      activeOrg: null,
      enterWorkspace: (org) => {
        try {
          localStorage.setItem('x-tenant-id', org.tenantId);
          localStorage.setItem('tenantId', org.tenantId);
        } catch (e) {}
        set({ activeOrg: org });
      },
      exitWorkspace: () => {
        try {
          localStorage.removeItem('x-tenant-id');
          localStorage.removeItem('tenantId');
        } catch (e) {}
        set({ activeOrg: null });
      }
    }),
    {
      name: 'nxt_org_workspace_store'
    }
  )
);
