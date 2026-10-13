import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { apiClient } from "src/services/apiClient";
import { useAuthStore } from "src/stores/authStore";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  LayoutDashboard,
  Loader2,
  Rocket,
  Building2,
  Users,
  Briefcase,
  Zap,
} from "lucide-react";

import { BASE_URL } from "~/constants/api";

const ONBOARDING_URL = `/saas/onboarding`;

interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  category: string;
}

const STEP_CATEGORIES: Record<string, { icon: React.ElementType; steps: OnboardingStep[] }> = {
  "Foundation": {
    icon: Building2,
    steps: [
      { key: "email_verified",    label: "Email Verified",               description: "Verify your admin email address",                     actionLabel: "Re-send Email",    actionPath: "/verify-email",                           category: "Foundation" },
      { key: "company_setup",     label: "Company Setup",                description: "Configure your company profile and settings",          actionLabel: "Go to Settings",   actionPath: "/settings",                               category: "Foundation" },
      { key: "branch_created",    label: "Branch Created",               description: "Your headquarters branch is set up",                   actionLabel: "Manage Branches",  actionPath: "/branch",                                 category: "Foundation" },
    ],
  },
  "Team & Permissions": {
    icon: Users,
    steps: [
      { key: "departments_set",   label: "Configure Departments",        description: "Create departments to organise your team",             actionLabel: "Add Departments",  actionPath: "/settings/access-permission/departments", category: "Team & Permissions" },
      { key: "designations_set",  label: "Configure Designations",       description: "Define job titles and designations",                   actionLabel: "Add Designations", actionPath: "/settings/access-permission/designations",category: "Team & Permissions" },
      { key: "roles_configured",  label: "Configure Roles",              description: "Set up roles and permissions for your team",           actionLabel: "Configure Roles",  actionPath: "/settings/access-permission/roles",       category: "Team & Permissions" },
      { key: "team_invited",      label: "Invite Team Members",          description: "Invite your team to join the workspace",              actionLabel: "Add Employees",    actionPath: "/employee?create=true",                      category: "Team & Permissions" },
    ],
  },
  "Business Setup": {
    icon: Briefcase,
    steps: [
      { key: "taxes_set",         label: "Configure Taxes",              description: "Set up tax rates for invoices and billing",            actionLabel: "Configure Taxes",  actionPath: "/settings",                               category: "Business Setup" },
      { key: "first_customer",    label: "Add First Customer",           description: "Add your first client or customer",                   actionLabel: "Add Customer",     actionPath: "/client_add",                             category: "Business Setup" },
    ],
  },
  "Go Live": {
    icon: Zap,
    steps: [
      { key: "first_lead",        label: "Add First Lead",               description: "Create your first sales lead",                        actionLabel: "Add Lead",         actionPath: "/leads",                                  category: "Go Live" },
      { key: "first_project",     label: "Create First Project",         description: "Kick off your first project",                         actionLabel: "Create Project",   actionPath: "/project",                                category: "Go Live" },
      { key: "first_invoice",     label: "Create First Invoice",         description: "Generate your first invoice",                         actionLabel: "Create Invoice",   actionPath: "/invoice_create",                         category: "Go Live" },
    ],
  },
};

interface ProgressData {
  email_verified?: boolean;
  company_setup?: boolean;
  branch_created?: boolean;
  team_invited?: boolean;
  payment_completed?: boolean;
  completion_percentage?: number;
  [key: string]: any;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { accessToken, setOnboardingComplete } = useAuthStore();
  const [progress, setProgress] = useState<ProgressData>({});
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }
    loadProgress();
  }, [accessToken]);

  const loadProgress = async () => {
    try {
      const res = await apiClient.get(`${ONBOARDING_URL}/status`);
      const data = res.data?.data || {};
      setProgress(data);
      const completed: Record<string, boolean> = {
        email_verified:   data.email_verified   ?? false,
        company_setup:    data.company_setup    ?? false,
        branch_created:   data.branch_created   ?? false,
        team_invited:     data.team_invited     ?? false,
        payment_completed:data.payment_completed ?? false,
        departments_set:  data.departments_set  ?? false,
        designations_set: data.designations_set ?? false,
        roles_configured: data.roles_configured ?? false,
        taxes_set:        data.taxes_set        ?? false,
        first_customer:   data.first_customer   ?? false,
        first_lead:       data.first_lead       ?? false,
        first_project:    data.first_project    ?? false,
        first_invoice:    data.first_invoice    ?? false,
      };
      setCompletedSteps(completed);
      if (data.completion_percentage >= 100) {
        setOnboardingComplete(true);
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.warn("Onboarding status load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const completionPct   = progress.completion_percentage ?? 0;
  const completedCount  = Object.values(completedSteps).filter(Boolean).length;
  const totalCount      = Object.values(completedSteps).length;

  const handleGoToDashboard = () => {
    setOnboardingComplete(true);
    navigate("/dashboard", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={28} style={{ color: '#64748b' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto' }}>
      {/* ─── Page Header ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Rocket size={20} style={{ color: '#6366f1' }} />
            Organisation Setup
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0 0' }}>
            Complete the steps below to get your workspace ready
          </p>
        </div>
        <button
          onClick={handleGoToDashboard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: '#0f172a',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
        >
          <LayoutDashboard size={15} />
          Go to Dashboard
        </button>
      </div>

      {/* ─── Progress Card ─── */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        padding: '20px 24px',
        marginBottom: 20,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: 0 }}>
            Setup Progress
          </h2>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#6366f1', margin: 0 }}>
            {completionPct}%
          </span>
        </div>
        <div style={{
          width: '100%',
          height: 6,
          background: '#f1f5f9',
          borderRadius: 99,
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${completionPct}%`,
              background: completionPct >= 100
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, #6366f1, #818cf8)',
              borderRadius: 99,
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0 0' }}>
          {completedCount} of {totalCount} steps completed
        </p>
      </div>

      {/* ─── Step Categories ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(STEP_CATEGORIES).map(([category, { icon: Icon, steps }]) => {
          const catCompleted = steps.filter(s => completedSteps[s.key]).length;
          const catDone = catCompleted === steps.length;

          return (
            <div
              key={category}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
              }}
            >
              {/* Category Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 24px',
                borderBottom: '1px solid #f1f5f9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={16} style={{ color: catDone ? '#22c55e' : '#6366f1' }} />
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                    {category}
                  </h3>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: catDone ? '#16a34a' : '#94a3b8',
                  background: catDone ? '#f0fdf4' : '#f8fafc',
                  padding: '2px 10px',
                  borderRadius: 99,
                  border: `1px solid ${catDone ? '#bbf7d0' : '#e2e8f0'}`,
                }}>
                  {catCompleted}/{steps.length} done
                </span>
              </div>

              {/* Step Rows */}
              <div>
                {steps.map((step, idx) => {
                  const done = !!completedSteps[step.key];
                  return (
                    <div
                      key={step.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 24px',
                        borderBottom: idx < steps.length - 1 ? '1px solid #f8fafc' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Status Icon */}
                      {done ? (
                        <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#22c55e' }} />
                      ) : (
                        <Circle size={18} style={{ flexShrink: 0, color: '#cbd5e1' }} />
                      )}

                      {/* Label & Description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13,
                          fontWeight: 600,
                          margin: 0,
                          color: done ? '#94a3b8' : '#1e293b',
                          textDecoration: done ? 'line-through' : 'none',
                        }}>
                          {step.label}
                        </p>
                        <p style={{
                          fontSize: 12,
                          color: '#94a3b8',
                          margin: '2px 0 0 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {step.description}
                        </p>
                      </div>

                      {/* Action */}
                      {done ? (
                        <span style={{
                          flexShrink: 0,
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#22c55e',
                        }}>
                          Completed
                        </span>
                      ) : (
                        <Link
                          to={step.actionPath}
                          style={{
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '5px 14px',
                            background: '#f1f5f9',
                            color: '#334155',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#6366f1';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.borderColor = '#6366f1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.color = '#334155';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          {step.actionLabel}
                          <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Bottom CTA ─── */}
      <div style={{
        marginTop: 20,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            Ready to start working?
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0 0' }}>
            You can always return to this page from your profile menu.
          </p>
        </div>
        <button
          onClick={handleGoToDashboard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 20px',
            background: '#6366f1',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#818cf8')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#6366f1')}
        >
          <LayoutDashboard size={15} />
          {completionPct >= 100 ? "Go to Dashboard" : "Skip & Go to Dashboard"}
        </button>
      </div>
    </div>
  );
}
