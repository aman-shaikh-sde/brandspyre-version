import { Request, Response } from "express";
import { OllamaService, OllamaMessage } from "../../services/ollamaService";
import { Project, Client, Milestone, Task, ProjectInvoice, ProjectPayreq, TaskParticipant } from "../../db/ModelSceham/project/client";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { Team } from "../../db/ModelSceham/teams/team";
import { UserTenant } from "../../db/ModelSceham/saasSchema";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";

const ollamaService = new OllamaService(
  process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  process.env.OLLAMA_MODEL || "llama3"
);

// Define available functions for AI
const availableFunctions = [
  // Query functions for CRM data
  {
    name: "query_projects",
    description: "Query projects from the CRM database for the current branch",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by project status (optional)" },
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_employees",
    description: "Query employees from the CRM database for the current branch",
    parameters: {
      type: "object",
      properties: {
        department: { type: "string", description: "Filter by department (optional)" },
        role: { type: "string", description: "Filter by role (optional)" },
        status: { type: "string", description: "Filter by status (optional)" },
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_tasks",
    description: "Query tasks from the CRM database for the current branch",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by task status (optional)" },
        project_id: { type: "string", description: "Filter by project ID (optional)" },
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_milestones",
    description: "Query milestones from the CRM database for the current branch",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Filter by project ID (optional)" },
        status: { type: "string", description: "Filter by status (optional)" },
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_accounts",
    description: "Query accounts from the CRM database for the current branch",
    parameters: {
      type: "object",
      properties: {
        account_type: { type: "string", description: "Filter by account type (optional)" },
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_invoices",
    description: "Query invoices from the CRM database for the current branch",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by invoice status (optional)" },
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_branches",
    description: "Query branches from the CRM database",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_leads",
    description: "Query leads from the CRM database for the current branch",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by lead status (optional)" },
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_campaigns",
    description: "Query campaigns from the CRM database for the current branch",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by campaign status (optional)" },
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_clients",
    description: "Query clients from the CRM database for the current branch",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum number of results (default 20)" },
      },
    },
  },
  {
    name: "query_project_details",
    description: "Get comprehensive details about a specific project including milestones, tasks, invoices, payment requests, and team members",
    parameters: {
      type: "object",
      properties: {
        project_code: { type: "string", description: "Project code to get details for" },
      },
      required: ["project_code"],
    },
  },
  // Create functions
  {
    name: "create_project",
    description: "Create a new project in the CRM",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name" },
        description: { type: "string", description: "Project description" },
        start_date: { type: "string", description: "Project start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "Project end date (YYYY-MM-DD)" },
        budget: { type: "number", description: "Project budget" },
        client_id: { type: "string", description: "Client ID" },
        branchcode: { type: "string", description: "Branch code" },
      },
      required: ["name", "branchcode"],
    },
  },
  {
    name: "create_employee",
    description: "Create a new employee in the CRM",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Employee full name" },
        email: { type: "string", description: "Employee email" },
        phone: { type: "string", description: "Employee phone number" },
        designation: { type: "string", description: "Employee designation" },
        department: { type: "string", description: "Employee department" },
        role: { type: "string", description: "Employee role (e.g., employee, admin, manager)" },
        branchcode: { type: "string", description: "Branch code (MUST use the current user's branchcode from context)" },
      },
      required: ["name", "email", "branchcode"],
    },
  },
  {
    name: "create_account",
    description: "Create a new account in the CRM",
    parameters: {
      type: "object",
      properties: {
        account_name: { type: "string", description: "Account name" },
        account_type: { type: "string", description: "Account type" },
        balance: { type: "number", description: "Account balance" },
        branchcode: { type: "string", description: "Branch code" },
      },
      required: ["account_name", "branchcode"],
    },
  },
  {
    name: "create_campaign",
    description: "Create a new marketing campaign",
    parameters: {
      type: "object",
      properties: {
        campaign_name: { type: "string", description: "Campaign name" },
        description: { type: "string", description: "Campaign description" },
        start_date: { type: "string", description: "Campaign start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "Campaign end date (YYYY-MM-DD)" },
        budget: { type: "number", description: "Campaign budget" },
        branchcode: { type: "string", description: "Branch code" },
      },
      required: ["campaign_name", "branchcode"],
    },
  },
  {
    name: "create_team",
    description: "Create a new team",
    parameters: {
      type: "object",
      properties: {
        team_name: { type: "string", description: "Team name" },
        team_lead: { type: "string", description: "Team lead name or staff_id" },
        branchcode: { type: "string", description: "Branch code" },
      },
      required: ["team_name", "team_lead", "branchcode"],
    },
  },
  {
    name: "generate_report",
    description: "Generate a report based on company data",
    parameters: {
      type: "object",
      properties: {
        report_type: {
          type: "string",
          enum: ["project_summary", "employee_summary", "financial_summary", "campaign_performance"],
          description: "Type of report to generate",
        },
        date_range: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
            end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
          },
        },
        branchcode: { type: "string", description: "Branch code" },
      },
      required: ["report_type", "branchcode"],
    },
  },
  {
    name: "navigate_to",
    description: "Guide user to navigate to a specific page",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: ["dashboard", "projects", "employees", "accounts", "campaigns", "reports", "settings"],
          description: "Page to navigate to",
        },
      },
      required: ["page"],
    },
  },
];

// Query functions for CRM data
async function queryProjects(args: any, tenantId: string, branchcode: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) filter.branchcode = branchcode;
    if (args.status) filter.status = args.status;
    
    const limit = args.limit || 20;
    const projects = await Project.find(filter)
      .select('project_code title status start_date end_date budget branchcode')
      .limit(limit);
    
    return { success: true, data: projects, count: projects.length };
  } catch (error: any) {
    console.error("Error querying projects:", error);
    return { success: false, message: error.message };
  }
}

async function queryEmployees(args: any, tenantId: string, branchcode: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) filter.branchcode = branchcode;
    if (args.department) filter.department = args.department;
    if (args.role) filter.role = args.role;
    if (args.status) filter.status = args.status;
    
    const limit = args.limit || 20;
    const employees = await UserInfo.find(filter)
      .select('staff_id firstname lastname email role department branchcode status')
      .limit(limit);
    
    return { success: true, data: employees, count: employees.length };
  } catch (error: any) {
    console.error("Error querying employees:", error);
    return { success: false, message: error.message };
  }
}

async function queryTasks(args: any, tenantId: string, branchcode: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) filter.branchcode = branchcode;
    if (args.status) filter.status = args.status;
    if (args.project_id) filter.project_code = args.project_id;
    
    const limit = args.limit || 20;
    const tasks = await Task.find(filter)
      .select('task_title status start_date end_date branchcode project_code')
      .limit(limit);
    
    return { success: true, data: tasks, count: tasks.length };
  } catch (error: any) {
    console.error("Error querying tasks:", error);
    return { success: false, message: error.message };
  }
}

async function queryMilestones(args: any, tenantId: string, branchcode: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) filter.branchcode = branchcode;
    if (args.status) filter.status = args.status;
    if (args.project_id) filter.project_code = args.project_id;
    
    const limit = args.limit || 20;
    const milestones = await Milestone.find(filter)
      .select('milestone_code miles_title status start_date end_date branchcode project_code')
      .limit(limit);
    
    return { success: true, data: milestones, count: milestones.length };
  } catch (error: any) {
    console.error("Error querying milestones:", error);
    return { success: false, message: error.message };
  }
}

async function queryAccounts(args: any, tenantId: string, branchcode: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) filter.branchcode = branchcode;
    if (args.account_type) filter.account_type = args.account_type;
    
    const limit = args.limit || 20;
    const accounts = await Client.find(filter)
      .select('client_name company_name overallcost balance branchcode')
      .limit(limit);
    
    return { success: true, data: accounts, count: accounts.length };
  } catch (error: any) {
    console.error("Error querying accounts:", error);
    return { success: false, message: error.message };
  }
}

async function queryInvoices(args: any, tenantId: string, branchcode: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) filter.branchcode = branchcode;
    if (args.status) filter.status = args.status;
    
    const limit = args.limit || 20;
    const invoices = await ProjectInvoice.find(filter)
      .select('invoice_id invoice_no invoice_date total_amount status branchcode')
      .limit(limit);
    
    return { success: true, data: invoices, count: invoices.length };
  } catch (error: any) {
    console.error("Error querying invoices:", error);
    return { success: false, message: error.message };
  }
}

async function queryBranches(args: any, tenantId: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    
    const limit = args.limit || 20;
    const branches = await UserInfo.find(filter)
      .select('branchcode')
      .distinct('branchcode')
      .limit(limit);
    
    return { success: true, data: branches, count: branches.length };
  } catch (error: any) {
    console.error("Error querying branches:", error);
    return { success: false, message: error.message };
  }
}

async function queryLeads(args: any, tenantId: string, branchcode: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) filter.branchcode = branchcode;
    if (args.status) filter.status = args.status;
    
    const limit = args.limit || 20;
    const leads = await Client.find(filter)
      .select('client_name company_name branchcode status')
      .limit(limit);
    
    return { success: true, data: leads, count: leads.length };
  } catch (error: any) {
    console.error("Error querying leads:", error);
    return { success: false, message: error.message };
  }
}

async function queryCampaigns(args: any, tenantId: string, branchcode: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) filter.branchcode = branchcode;
    if (args.status) filter.status = args.status;
    
    const limit = args.limit || 20;
    const campaigns = await Client.find(filter)
      .select('campaign_code campaign_name description start_date end_date budget status branchcode')
      .limit(limit);
    
    return { success: true, data: campaigns, count: campaigns.length };
  } catch (error: any) {
    console.error("Error querying campaigns:", error);
    return { success: false, message: error.message };
  }
}

async function queryClients(args: any, tenantId: string, branchcode: string) {
  try {
    const filter: any = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) filter.branchcode = branchcode;
    
    const limit = args.limit || 20;
    const clients = await Client.find(filter)
      .select('client_code client_name company_name email primary_phone branchcode')
      .limit(limit);
    
    return { success: true, data: clients, count: clients.length };
  } catch (error: any) {
    console.error("Error querying clients:", error);
    return { success: false, message: error.message };
  }
}

async function queryProjectDetails(args: any, tenantId: string, branchcode: string) {
  try {
    const projectFilter: any = { project_code: args.project_code };
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      projectFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    if (branchcode) projectFilter.branchcode = branchcode;

    // Get project details
    const project = await Project.findOne(projectFilter);
    
    if (!project) {
      return { success: false, message: `Project with code ${args.project_code} not found` };
    }
    
    console.log("Found project:", project.project_code);
    
    const subFilter: any = { project_code: args.project_code };
    if (project.tenant_id) {
      subFilter.tenant_id = project.tenant_id;
    }

    // Get milestones for this project
    const milestones = await Milestone.find(subFilter)
      .select('milestone_code miles_title status start_date end_date base_amount total_amount paystatus')
      .sort({ start_date: 1 });
    
    // Get tasks for this project
    const tasks = await Task.find(subFilter)
      .select('task_title status start_date end_date handler_by team_id')
      .sort({ start_date: 1 });
    
    // Get invoices for this project
    const invoices = await ProjectInvoice.find(subFilter)
      .select('invoice_id invoice_no invoice_date total_amount paid_amount balance_amount status')
      .sort({ invoice_date: -1 });
    
    // Get payment requests for this project
    const payreqs = await ProjectPayreq.find(subFilter)
      .select('request_id milestone_amount balance_amount status due_date')
      .sort({ created_on: -1 });
    
    // Get team members working on this project
    const teamMembers = await TaskParticipant.find({ project_code: args.project_code })
      .select('staff_id role status task_id')
      .populate('staff_id', 'firstname lastname email role department');
    
    // Get client info
    const clientFilter: any = { client_code: project.client_code };
    if (project.tenant_id) clientFilter.tenant_id = project.tenant_id;
    const client = await Client.findOne(clientFilter)
      .select('client_name company_name email primary_phone');
    
    // Analyze current status and potential issues
    const analysis = {
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.status === 'completed').length,
      pendingMilestones: milestones.filter(m => m.status === 'pending' || m.status === 'draft').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'draft').length,
      totalBudget: project.budget || 0,
      totalInvoiced: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      totalPaid: invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
      pendingPayments: payreqs.filter(p => p.status === 'pending').length,
      activeTeamMembers: teamMembers.length,
      overdueTasks: tasks.filter(t => t.end_date && new Date(t.end_date) < new Date() && t.status !== 'completed').length,
      upcomingMilestones: milestones.filter(m => m.start_date && new Date(m.start_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && m.status !== 'completed').length,
    };
    
    const result = {
      project: {
        project_code: project.project_code,
        title: project.title,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        budget: project.budget,
        handler_by: project.handler_by,
        priority: project.priority,
        type: project.type,
      },
      client: client,
      milestones: milestones,
      tasks: tasks,
      invoices: invoices,
      paymentRequests: payreqs,
      teamMembers: teamMembers,
      analysis: analysis,
    };
    
    console.log("Project details compiled successfully");
    console.log("Analysis:", JSON.stringify(analysis, null, 2));
    
    return { success: true, data: result, message: `Retrieved comprehensive details for project ${args.project_code}` };
  } catch (error: any) {
    console.error("Error querying project details:", error);
    return { success: false, message: error.message };
  }
}

// Function implementations
async function createProject(args: any, tenantId: string) {
  try {
    const projectData: any = {
      project_code: args.project_code || `PROJ/${Date.now()}`,
      branchcode: args.branchcode,
      title: args.name,
      priority: args.priority || "medium",
      type: args.type || "general",
      loc: args.location || "",
      start_date: args.start_date ? new Date(args.start_date) : new Date(),
      end_date: args.end_date ? new Date(args.end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budget: args.budget || 0,
      status: args.status || "active",
      handler_by: args.handler_by || "system",
      createby: "ai_assistant",
    };

    if (tenantId) {
      projectData.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }

    const project = await Project.create(projectData);
    return { success: true, message: `Project "${args.name}" created successfully`, data: project };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function createEmployee(args: any, tenantId: string) {
  try {
    const tempPassword = crypto.randomBytes(6).toString("hex") + "A1!";
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const employeeData: any = {
      staff_id: `EMP/${Date.now()}`,
      firstname: args.name.split(" ")[0] || args.name,
      lastname: args.name.split(" ").slice(1).join(" ") || "",
      email: args.email,
      phonenumber: args.phone || "",
      desigantion: args.designation || "Employee",
      department: args.department || "General",
      branchcode: args.branchcode,
      role: args.role || "employee",
      status: "active",
      password: hashedPassword,
      reset_password_token: resetToken,
      reset_password_expires: resetExpires,
    };

    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      employeeData.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }

    const employee = await UserInfo.create(employeeData);

    // Enroll employee in UserTenant for tenant isolation and login capability
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      await UserTenant.create({
        user_id: employee._id,
        tenant_id: new mongoose.Types.ObjectId(tenantId),
        role: employeeData.role,
        status: "active",
        is_active: true,
        default_branch_code: employeeData.branchcode,
        joined_at: new Date()
      });
    }

    return {
      success: true,
      message: `Employee "${args.name}" created successfully with role: ${employeeData.role} and branchcode: ${employeeData.branchcode}. An account setup invitation and secure password reset link have been provisioned for the user.`,
      data: {
        _id: employee._id,
        staff_id: employee.staff_id,
        email: employee.email,
        role: employee.role,
        branchcode: employee.branchcode
      }
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function createAccount(args: any, tenantId: string) {
  try {
    // Since there's no separate Account model, we'll return a placeholder response
    return { 
      success: true, 
      message: `Account "${args.account_name}" would be created (Account management not yet implemented in AI)`,
      data: { account_name: args.account_name, type: args.account_type }
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function createCampaign(args: any, tenantId: string) {
  try {
    const campaignData: any = {
      campaign_code: `CMP/${Date.now()}`,
      campaign_name: args.campaign_name,
      description: args.description || "",
      start_date: args.start_date ? new Date(args.start_date) : new Date(),
      end_date: args.end_date ? new Date(args.end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budget: args.budget || 0,
      branchcode: args.branchcode,
      status: "active",
    };

    if (tenantId) {
      campaignData.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }

    const campaign = await Client.create(campaignData);
    return { success: true, message: `Campaign "${args.campaign_name}" created successfully`, data: campaign };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function createTeam(args: any, tenantId: string) {
  try {
    const teamData: any = {
      team_id: `TEAM/${Date.now()}`,
      team_name: args.team_name,
      team_lead: args.team_lead,
      branchcode: args.branchcode,
      is_active: true,
      modified_count: 0,
    };

    if (tenantId) {
      teamData.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }

    const team = await Team.create(teamData);
    return { success: true, message: `Team "${args.team_name}" created successfully`, data: team };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function generateReport(args: any, tenantId: string) {
  try {
    console.log("Generating report with args:", args);
    console.log("Branchcode used:", args.branchcode);
    
    let data: any = {};
    const filter: any = {
      branchcode: args.branchcode,
    };

    if (tenantId) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }

    console.log("Filter applied:", filter);

    switch (args.report_type) {
      case "project_summary":
        data.summary = {
          total_projects: await Project.countDocuments(filter),
          active_projects: await Project.countDocuments({ ...filter, status: "active" }),
        };
        data.details = await Project.find(filter).select('project_id project_name status start_date end_date budget branchcode').limit(50);
        break;
      case "employee_summary":
        data.summary = {
          total_employees: await UserInfo.countDocuments(filter),
        };
        data.details = await UserInfo.find(filter).select('staff_id firstname lastname email role department branchcode status').limit(50);
        break;
      case "financial_summary":
        data.summary = {
          total_accounts: await Client.countDocuments(filter),
        };
        data.details = await Client.find(filter).select('account_name account_type balance branchcode').limit(50);
        break;
      case "campaign_performance":
        data.summary = {
          total_campaigns: await Client.countDocuments(filter),
        };
        data.details = await Client.find(filter).select('campaign_name description start_date end_date budget status branchcode').limit(50);
        break;
    }

    console.log("Report data generated:", data);
    return { success: true, message: "Report generated successfully", data };
  } catch (error: any) {
    console.error("Error generating report:", error);
    return { success: false, message: error.message };
  }
}

async function navigateTo(args: any) {
  return {
    success: true,
    message: `Navigating to ${args.page} page`,
    data: { route: `/${args.page}` },
  };
}

// Function dispatcher
const functionDispatcher: Record<string, (args: any, tenantId: string, branchcode: string) => Promise<any>> = {
  // Query functions
  query_projects: (args, tenantId, branchcode) => queryProjects(args, tenantId, branchcode),
  query_employees: (args, tenantId, branchcode) => queryEmployees(args, tenantId, branchcode),
  query_tasks: (args, tenantId, branchcode) => queryTasks(args, tenantId, branchcode),
  query_milestones: (args, tenantId, branchcode) => queryMilestones(args, tenantId, branchcode),
  query_accounts: (args, tenantId, branchcode) => queryAccounts(args, tenantId, branchcode),
  query_invoices: (args, tenantId, branchcode) => queryInvoices(args, tenantId, branchcode),
  query_branches: (args, tenantId, branchcode) => queryBranches(args, tenantId),
  query_leads: (args, tenantId, branchcode) => queryLeads(args, tenantId, branchcode),
  query_campaigns: (args, tenantId, branchcode) => queryCampaigns(args, tenantId, branchcode),
  query_clients: (args, tenantId, branchcode) => queryClients(args, tenantId, branchcode),
  query_project_details: (args, tenantId, branchcode) => queryProjectDetails(args, tenantId, branchcode),
  // Create functions
  create_project: (args, tenantId, branchcode) => createProject(args, tenantId),
  create_employee: (args, tenantId, branchcode) => createEmployee(args, tenantId),
  create_account: (args, tenantId, branchcode) => createAccount(args, tenantId),
  create_campaign: (args, tenantId, branchcode) => createCampaign(args, tenantId),
  create_team: (args, tenantId, branchcode) => createTeam(args, tenantId),
  generate_report: (args, tenantId, branchcode) => generateReport(args, tenantId),
  navigate_to: (args, tenantId, branchcode) => navigateTo(args),
};

const FUNCTION_PERMISSION_MAP: Record<string, string> = {
  create_employee: 'user.create',
  create_project: 'project.create',
  create_campaign: 'marketing.campaign.create',
  create_team: 'team.create',
  create_account: 'setting.account.create',
  query_projects: 'project.view',
  query_project_details: 'project.view',
  query_employees: 'user.view',
  query_tasks: 'project.task.view',
  query_milestones: 'project.milestone.view',
  query_accounts: 'setting.account.view',
  query_invoices: 'project.invoice.view',
  query_branches: 'setting.branch.view',
  query_leads: 'lead.view',
  query_campaigns: 'marketing.campaign.view',
  query_clients: 'project.client.view',
};

export const chatWithAI = async (req: Request, res: Response): Promise<void> => {
  const msgField = "AI Chat";

  try {
    const { message, conversationHistory } = req.body;
    const tenantId = (req as any).securityContext?.tenantId || (req.user as any)?.tenantId;
    const branchcode = (req as any).securityContext?.branchCode || (req.user as any)?.branchcode || (req.user as any)?.brcode || null;

    if (!tenantId) {
      res.status(401).json({ success: false, error: "Unauthorized: Tenant context required" });
      return;
    }

    // Check Ollama health
    const isHealthy = await ollamaService.checkHealth();
    if (!isHealthy) {
      res.status(503).json({
        success: false,
        error: "Ollama service is not available. Please ensure Ollama is running locally.",
      });
      return;
    }

    // Build messages
    const messages: OllamaMessage[] = [
      {
        role: "system",
        content: `You are an AI assistant for a CRM system. You help users manage projects, employees, accounts, campaigns, teams, and generate reports. 
        Current user context:
        - Tenant ID: ${tenantId}
        - Branch Code: ${branchcode || "ALL"}
        
        CRITICAL INSTRUCTIONS - MUST FOLLOW:
        
        1. When users ask about ANY CRM data (projects, employees, tasks, milestones, accounts, invoices, branches, leads, campaigns, clients), you MUST use the QUERY functions to retrieve actual data from the database. NEVER answer with generic information - always query the database first.
        
        2. Query functions are your PRIMARY tool for answering questions about existing data. Use them before giving any answer.
        
        3. Only use CREATE functions when the user explicitly asks to CREATE something (project, employee, account, campaign, team).
        
        4. Only use GENERATE_REPORT function when the user explicitly asks for a report.
        
        5. Only use NAVIGATE function when the user asks to navigate to a page.
        
        6. For general questions not related to CRM data (like "what is CRM?", "how do I use this?", etc.), answer directly without calling any functions.
        
        Available QUERY functions (MUST use these for ALL CRM-related questions):
        - query_projects: Use for questions about projects, active projects, project status, project counts, project dates
        - query_project_details: Use for detailed enquiries about a SPECIFIC project (by project_code). This fetches milestones, tasks, invoices, payment requests, team members, and analyzes current status, issues, and progress. Use this when user asks "tell me about project X", "what's happening with project X", "status of project X", etc.
        - query_employees: Use for questions about employees, staff, team members, employee counts, departments
        - query_tasks: Use for questions about tasks, task status, task assignments
        - query_milestones: Use for questions about milestones, project milestones, milestone status
        - query_accounts: Use for questions about accounts, financial accounts, account balances
        - query_invoices: Use for questions about invoices, billing, payments
        - query_branches: Use for questions about branches, locations
        - query_leads: Use for questions about leads, prospects, lead status
        - query_campaigns: Use for questions about campaigns, marketing campaigns
        - query_clients: Use for questions about clients, customers, client information
        
        Available CREATE functions (ONLY use when explicitly requested):
        - create_project: name, description, start_date, end_date, budget, branchcode (use "${branchcode || ''}")
        - create_employee: name, email, phone, designation, department, role, branchcode (use "${branchcode || ''}")
        - create_account: account_name, account_type, balance, branchcode (use "${branchcode || ''}")
        - create_campaign: campaign_name, description, start_date, end_date, budget, branchcode (use "${branchcode || ''}")
        - create_team: team_name, team_lead (name or staff_id), branchcode (use "${branchcode || ''}")
        
        Available REPORT function (ONLY use when explicitly requested):
        - generate_report: report_type (project_summary, employee_summary, financial_summary, campaign_performance), branchcode (use "${branchcode || ''}")
        
        Available NAVIGATE function (ONLY use when explicitly requested):
        - navigate_to: page (dashboard, projects, employees, accounts, campaigns, reports, settings)`,
      },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

    // Get AI response with function calling
    const { content, functionCall } = await ollamaService.chatWithFunctions(messages, availableFunctions);

    // If function call detected, execute it with RBAC authorization
    if (functionCall) {
      const func = functionDispatcher[functionCall.name];
      if (func) {
        // Enforce role authorization and granular permissions on AI actions
        const userRole = ((req as any).securityContext?.userRole || (req.user as any)?.userRole || "employee").toLowerCase();
        const isPlatformAdmin = (req as any).securityContext?.isPlatformAdmin || false;
        const userPermissions: string[] = (req as any).securityContext?.permissions || (req.user as any)?.permissions || [];
        const requiredPermission = FUNCTION_PERMISSION_MAP[functionCall.name];

        const hasPermission =
          isPlatformAdmin ||
          ["admin", "owner"].includes(userRole) ||
          userPermissions.includes("*") ||
          (requiredPermission && userPermissions.includes(requiredPermission)) ||
          (!requiredPermission && !functionCall.name.startsWith("create_"));

        if (!hasPermission) {
          res.json({
            success: false,
            response: `Access Denied: Your role (${userRole}) lacks the necessary permission (${requiredPermission || 'administrative'}) to execute AI action "${functionCall.name}".`,
          });
          return;
        }

        // Add branchcode if not provided
        const args = { ...functionCall.arguments, branchcode };
        const result = await func(args, tenantId, branchcode);
        
        // For query functions, send the data back to AI to formulate a response
        if (functionCall.name.startsWith('query_') && result.success && result.data) {
          const dataSummary = JSON.stringify(result.data, null, 2);
          const followUpMessages: OllamaMessage[] = [
            ...messages,
            { role: "assistant", content: JSON.stringify({ functionCall: functionCall.name, result: result }) },
            { role: "user", content: `Based on the query results for ${functionCall.name}, here is the data: ${dataSummary}. Please provide a natural language response to the user's question based on this data. Count: ${result.count}` }
          ];
          
          const { content: aiResponse } = await ollamaService.chatWithFunctions(followUpMessages, []);
          
          res.json({
            success: true,
            response: aiResponse,
            functionCall: {
              name: functionCall.name,
              result: result,
            },
          });
        } else {
          res.json({
            success: true,
            response: result.message,
            functionCall: {
              name: functionCall.name,
              result: result,
            },
          });
        }
      } else {
        res.json({
          success: true,
          response: `Function ${functionCall.name} is not implemented yet.`,
        });
      }
    } else {
      res.json({
        success: true,
        response: content,
      });
    }
  } catch (error: any) {
    console.error(`${msgField} Error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process AI chat",
    });
  }
};

export const checkOllamaHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const isHealthy = await ollamaService.checkHealth();
    const models = await ollamaService.getModels();
    
    res.json({
      success: true,
      isHealthy,
      models,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
