import {
  BadgeDollarSign,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  FileText,
  Landmark,
  MessageSquareText,
  Settings,
  ShieldCheck,
  SquareCheckBig,
  UsersRound,
  WalletCards
} from "lucide-react";
import type { DashboardItem, ServiceSlug } from "@/lib/types";

export const brand = {
  name: "KAL ACCOUNTING & TAX",
  tagline: "A Division of Kal Service Alliance Inc.",
  headline: "Accounting & Tax Services",
  subheadline: "Professional support for bookkeeping, payroll, GST/HST, and personal and corporate tax."
};

export const publicNav = [
  { labelKey: "nav.home", href: "/" }
];

export const defaultExpenseTypes = [
  { value: "Materials", labelKey: "type.materials" },
  { value: "Fuel", labelKey: "type.fuel" },
  { value: "Vehicle", labelKey: "type.vehicle" },
  { value: "Tools", labelKey: "type.tools" },
  { value: "Rent", labelKey: "type.rent" },
  { value: "Phone", labelKey: "type.phone" },
  { value: "Payroll", labelKey: "type.payroll" },
  { value: "Insurance", labelKey: "type.insurance" },
  { value: "WCB", labelKey: "type.wcb" },
  { value: "Meals", labelKey: "type.meals" },
  { value: "Supplies", labelKey: "type.supplies" },
  { value: "Office", labelKey: "type.office" },
  { value: "Other", labelKey: "type.other" }
];

export const expenseCategories = defaultExpenseTypes.map((type) => type.value);

export const paidToDefaults = [
  "Home Depot",
  "Shell",
  "Costco",
  "Canadian Tire",
  "ABC Roofing Supply"
];

export const exportButtons = [
  { labelKey: "export.yearEndPackage", fallback: "Generate Year-End Package" },
  { labelKey: "export.excel", fallback: "Excel Export" },
  { labelKey: "export.csv", fallback: "CSV Export" },
  { labelKey: "export.trialBalance", fallback: "Trial Balance" },
  { labelKey: "export.generalLedger", fallback: "General Ledger" },
  { labelKey: "export.gstSummary", fallback: "GST Summary" },
  { labelKey: "export.payrollSummary", fallback: "Payroll Summary" },
  { labelKey: "export.t2WorkingPapers", fallback: "T2 Working Papers" }
];

export const futureReadyItems = [
  "future.aiReceipts",
  "future.sms",
  "future.email",
  "future.t4",
  "future.t2"
];

export const services: Record<
  ServiceSlug,
  {
    title: string;
    eyebrow: string;
    summary: string;
    bullets: string[];
    outcomes: string[];
  }
> = {
  "accounting-tax": {
    title: "Accounting & Tax",
    eyebrow: "Personal, corporate, and year-end support",
    summary:
      "Organized tax preparation, corporate filings, year-end packages, GST/HST support, and advisory workflows built around clean documentation.",
    bullets: [
      "T1 personal tax and sole proprietor support",
      "T2 corporate tax working paper preparation",
      "GST/HST filing summaries and document checklists",
      "Notice review, CRA correspondence tracking, and deadline reminders"
    ],
    outcomes: [
      "Cleaner year-end packages",
      "Better tax document readiness",
      "Clear client responsibility tracking"
    ]
  },
  bookkeeping: {
    title: "Bookkeeping",
    eyebrow: "Monthly bookkeeping for practical business owners",
    summary:
      "A simple portal flow for income, expense, receipt, bank statement, asset, and review items so small business books stay current.",
    bullets: [
      "Receipt and invoice upload workflows",
      "Expense category tracking for contractors and trades",
      "Bank statement intake and reconciliation review",
      "Bookkeeping review queues for staff"
    ],
    outcomes: [
      "Fewer missing receipts",
      "Better monthly visibility",
      "Faster accountant review"
    ]
  },
  payroll: {
    title: "Payroll",
    eyebrow: "Payroll records and reporting",
    summary:
      "Structured payroll records for employees, contractors, pay periods, deductions, source remittances, summaries, and review notes.",
    bullets: [
      "Payroll period tracking",
      "Employee and contractor document collection",
      "Payroll summary export placeholders",
      "Task reminders for remittance and year-end slips"
    ],
    outcomes: [
      "Clear payroll status",
      "Organized supporting documents",
      "Better deadline control"
    ]
  }
};

export const clientDashboardItems: DashboardItem[] = [
  { title: "My Documents", description: "Securely scan and upload documents for your accounting team.", href: "/portal/documents", metric: "Upload" },
  { title: "Messages", description: "Send a secure message to the KAL Accounting & Tax team.", href: "/portal/messages", metric: "Open" }
];

export const adminDashboardItems: DashboardItem[] = [
  { title: "Clients", titleKey: "nav.clients", description: "All client records and assignments.", href: "/admin/clients", metric: "Real records" },
  { title: "Accounting Clients", titleKey: "nav.accountingClients", description: "Accounting client year folders.", href: "/admin/accounting-clients", metric: "Select client" },
  { title: "Tax Years", titleKey: "nav.taxYears", description: "Client and year records.", href: "/admin/tax-years", metric: "Select year" },
  { title: "Tax Files", titleKey: "nav.taxFiles", description: "T4 slips and tax document review.", href: "/admin/tax-files", metric: "Review" },
  { title: "Personal Tax", titleKey: "nav.personalTax", description: "Personal slips, extraction review, and tax-prep readiness.", href: "/admin/personal-tax", metric: "Slips" },
  { title: "Self-Employed", titleKey: "nav.selfEmployed", description: "Self-employed income, expenses, GST, and receipts.", href: "/admin/self-employed", metric: "Summary" },
  { title: "Workers & Payments", titleKey: "nav.workersPayments", description: "Worker payments, payroll review, and slip preparation reports.", href: "/admin/workers-payroll-review", metric: "Review" },
  { title: "Documents", titleKey: "nav.documents", description: "Receipts, bank statements, payroll, and tax files.", href: "/admin/documents", metric: "Files" },
  { title: "Messages", titleKey: "nav.messages", description: "Client and employee messages.", href: "/admin/messages", metric: "Open" },
  { title: "Tasks", titleKey: "nav.tasks", description: "Assigned staff work.", href: "/admin/tasks", metric: "Tasks" },
  { title: "Follow-Ups", titleKey: "nav.followUps", description: "Client follow-up dates.", href: "/admin/follow-ups", metric: "Follow up" },
  { title: "Reports", titleKey: "nav.reports", description: "Export reports and working papers.", href: "/admin/reports", metric: "Exports" },
  { title: "Public Posts", titleKey: "nav.publicPosts", description: "Published service explanations for the public homepage.", href: "/admin/public-posts", metric: "Publish" },
  { title: "Employees", titleKey: "nav.employees", description: "Staff access and assignments.", href: "/admin/employees", metric: "Staff" },
  { title: "Audit Logs", titleKey: "nav.auditLogs", description: "Security and case history.", href: "/admin/audit-logs", metric: "Live" },
  { title: "Settings", titleKey: "nav.settings", description: "Portal settings and future workflow controls.", href: "/admin/settings", metric: "Setup" }
];

export const employeeDashboardItems: DashboardItem[] = [
  { title: "Clients", titleKey: "nav.clients", description: "Clients assigned to you.", href: "/employee/clients", metric: "Assigned" },
  { title: "Documents", titleKey: "nav.documents", description: "Files for assigned clients.", href: "/employee/documents", metric: "Review" },
  { title: "Messages", titleKey: "nav.messages", description: "Messages for assigned clients.", href: "/employee/messages", metric: "Open" },
  { title: "Appointments", titleKey: "nav.appointments", description: "Upcoming assigned-client calls.", href: "/employee/appointments", metric: "Today" },
  { title: "Reports", titleKey: "nav.reports", description: "Assigned-client report tasks.", href: "/employee/reports", metric: "Tasks" }
];

export const clientNav = [
  { labelKey: "nav.documents", href: "/portal/documents", icon: FileText },
  { labelKey: "nav.messages", href: "/portal/messages", icon: MessageSquareText }
];

export const adminNav = [
  { labelKey: "nav.dashboard", href: "/admin", icon: ShieldCheck },
  { labelKey: "nav.clients", href: "/admin/clients", icon: UsersRound },
  { labelKey: "nav.accountingClients", href: "/admin/accounting-clients", icon: BadgeDollarSign },
  { labelKey: "nav.taxYears", href: "/admin/tax-years", icon: Landmark },
  { labelKey: "nav.taxFiles", href: "/admin/tax-files", icon: FileText },
  { labelKey: "nav.personalTax", href: "/admin/personal-tax", icon: FileText },
  { labelKey: "nav.selfEmployed", href: "/admin/self-employed", icon: WalletCards },
  { labelKey: "nav.workersPayments", href: "/admin/workers-payroll-review", icon: UsersRound },
  { labelKey: "nav.documents", href: "/admin/documents", icon: FileText },
  { labelKey: "nav.messages", href: "/admin/messages", icon: MessageSquareText },
  { labelKey: "nav.tasks", href: "/admin/tasks", icon: SquareCheckBig },
  { labelKey: "nav.followUps", href: "/admin/follow-ups", icon: CalendarClock },
  { labelKey: "nav.reports", href: "/admin/reports", icon: Banknote },
  { labelKey: "nav.publicPosts", href: "/admin/public-posts", icon: FileText },
  { labelKey: "nav.employees", href: "/admin/employees", icon: UsersRound },
  { labelKey: "nav.auditLogs", href: "/admin/audit-logs", icon: ShieldCheck },
  { labelKey: "nav.settings", href: "/admin/settings", icon: Settings }
];

export const employeeNav = [
  { labelKey: "nav.home", href: "/employee", icon: ShieldCheck },
  { labelKey: "nav.clients", href: "/employee/clients", icon: UsersRound },
  { labelKey: "nav.documents", href: "/employee/documents", icon: FileText },
  { labelKey: "nav.messages", href: "/employee/messages", icon: MessageSquareText },
  { labelKey: "nav.appointments", href: "/employee/appointments", icon: CalendarClock },
  { labelKey: "nav.reports", href: "/employee/reports", icon: SquareCheckBig }
];

export const trustItems = [
  { icon: ShieldCheck, label: "Supabase Auth and Row Level Security" },
  { icon: Building2, label: "Canadian tax, payroll, and business workflows" },
  { icon: BriefcaseBusiness, label: "Built for contractors and small business owners" }
];
