import {
  House,
  Users,
  Settings,
  UserLock,
  CalendarCheck,
  CalendarX2,
  Contact,
  BellRing,
  MessageCircleWarning,
  CalendarClock,
  FileClock,
  SquareKanban,
  UserSearch,
  Briefcase,
  HouseWifi,
  UserPen,
  Calculator,
  UsersRound,
  CalendarSync,
  Split,
  FileUser ,
  CircleCheckBig,
  MailCheck,
  Video
} from "lucide-react";

export const navbarLinks = [
  {
    links: [
      {
        label: "Dashboard",
        icon: House,
        path: "/",
      },
    ],
  },
  {
    title: "Branch Management",
    links: [
      {
        label: "Branches",
        icon: Split,
        path: "/branch",
      },
    ],
  },
  {
    title: "User Management",
    links: [
      {
        label: "Employee",
        icon: UserLock,
        path: "/employee",
      },
      {
        label: "Leave",
        icon: CalendarX2,
        path: "/leave",
      },
      {
        label: "Employee Report",
        icon: Contact,
        path: "/employee_report",
      },
      {
        label: "Attandance",
        icon: CalendarCheck,
        path: "/attandance",
      },
   
    ],
  },
    {
    title: "Sales Management",
    links: [
          {
        label: "Campaign",
        icon: HouseWifi,
        path: "/campaign",
      },
      {
        label: "Leads",
        icon: UserSearch,
        path: "/leads",
      },
      {
        label: "Client",
        icon: Briefcase,
        path: "/clients",
      },
  
    ],
  },
  {
    title: "Commercial Operations",
    links: [
      {
        label: "Commercial Dashboard",
        icon: Calculator,
        path: "/billing/dashboard",
      },
      {
        label: "Master Contracts",
        icon: Briefcase,
        path: "/billing/contracts",
      },
      {
        label: "Commercial Agreements",
        icon: Briefcase,
        path: "/billing/agreements",
      },
      {
        label: "Billable Ledger",
        icon: CircleCheckBig,
        path: "/billing/transactions",
      },
      {
        label: "Disputes & Credit Notes",
        icon: MessageCircleWarning,
        path: "/billing/disputes",
      },
    ],
  },
  {
    title: "Lead Exchange & B2B",
    links: [
      {
        label: "Org Relationships",
        icon: Split,
        path: "/lead-exchange/relationships",
      },
      {
        label: "Shared Leads Workspace",
        icon: UserSearch,
        path: "/lead-exchange/shared-leads",
      },
      {
        label: "B2B Settlement Ledger",
        icon: Calculator,
        path: "/lead-exchange/settlements",
      },
    ],
  },
  {
    title: "Team Management",
    links: [
      {
        label: "Teams",
        icon: UsersRound,
        path: "/team",
      },

      {
        label: "Team Members",
        icon: UsersRound,
        path: "/team",
      },
    ],
  },
  {
    title: "Project Management",
    links: [
      {
        label: "Project",
        icon: SquareKanban,
        path: "/project",
      },
          {
        label: "Task",
        icon: CircleCheckBig,
        path: "/project_tasklist",
      },
             {
        label: "Time Sheet",
        icon: CalendarClock,
        path: "/time_sheet",
      },
    ],
  },

  {
    title: "Account Profile",
    links: [
      {
        label: "Profile",
        icon: UserPen,
        path: "/account_profile",
      },
    ],
  },

  {
    title: "Account Management",
    links: [
      {
        label: "Accounts",
        icon: Calculator,
        path: "/account",
      },
    ],
  },
  {
    title: "Report Analysis",
    links: [
      {
        label: "Report & Management",
        icon: MessageCircleWarning,
        path: "/reportAnaysis",
      },
    ],
  },
  {
    title: "Notification",
    links: [
      {
        label: "reminder",
        icon: BellRing,
        path: "/notification",
      },
      {
        label: "Calendar",
        icon: CalendarSync,
        path: "/calendar",
      },
      {
        label: "Meetings",
        icon: Video,
        path: "/meetings",
      },
      {
        label: "MOM Report",
        icon: MailCheck ,
        path: "/mom_report",
      },
    ],
  },
  {
    title: "User Logs",
    links: [
      {
        label: "Activity Log",
        icon: FileClock,
        path: "/active_log",
      },
    ],
  },
  {
    title: "Settings",
    links: [
      {
        label: "Settings",
        icon: Settings,
        path: "/settings",
      },
    ],
  },
];
