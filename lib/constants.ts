import {
  BadgeDollarSign,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  FolderKanban,
  Landmark,
  MessageSquareText,
  Plane,
  ReceiptText,
  ShieldCheck,
  SquareCheckBig,
  UserRound,
  UsersRound,
  WalletCards
} from "lucide-react";
import type { DashboardItem, ServiceSlug } from "@/lib/types";

export const brand = {
  name: "Exodus Pathways",
  tagline: "Accounting | Tax | Immigration | Business Services",
  headline: "Guiding Your Financial and Immigration Journey in Canada",
  subheadline:
    "Professional support for tax, bookkeeping, payroll, immigration, corporate filings, and business growth."
};

export const publicNav = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.accountingTax", href: "/accounting-tax" },
  { labelKey: "nav.bookkeeping", href: "/bookkeeping" },
  { labelKey: "nav.payroll", href: "/payroll" },
  { labelKey: "nav.immigration", href: "/immigration-services" },
  { labelKey: "nav.business", href: "/business-services" },
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.contact", href: "/contact" }
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
  "future.t2",
  "future.immigrationAutomation"
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
  },
  "immigration-services": {
    title: "Immigration Services",
    eyebrow: "Document-first immigration case support",
    summary:
      "Secure intake, immigration file uploads, case milestones, appointment tracking, and staff messaging for Canadian immigration service workflows.",
    bullets: [
      "Immigration document checklist and secure upload",
      "Case type, status, and milestone tracking",
      "Appointment scheduling and message history",
      "Admin and assigned employee review queues"
    ],
    outcomes: [
      "One secure file hub",
      "Clear next steps",
      "Less document confusion"
    ]
  },
  "business-services": {
    title: "Business Services",
    eyebrow: "Corporate filings and growth support",
    summary:
      "Business formation support, annual returns, corporate record organization, internal tasks, and client-facing status tracking.",
    bullets: [
      "Incorporation and corporate filing intake",
      "Annual return and registry document tracking",
      "Business advisory task lists",
      "Secure company profile and ownership details"
    ],
    outcomes: [
      "Organized corporate records",
      "Cleaner filings",
      "A practical growth support hub"
    ]
  }
};

export const clientDashboardItems: DashboardItem[] = [
  { title: "Income", titleKey: "nav.income", description: "Money customers paid you.", descriptionKey: "module.income.description", href: "/portal/income", metric: "Add income" },
  { title: "Expenses", titleKey: "nav.expenses", description: "What you paid for.", descriptionKey: "module.expenses.description", href: "/portal/expenses", metric: "Add expense" },
  { title: "Documents", titleKey: "nav.documents", description: "Files Exodus Pathways needs.", descriptionKey: "module.documents.description", href: "/portal/documents", metric: "Upload" },
  { title: "T4 Slips", titleKey: "nav.t4", description: "Upload T4s and confirm extracted boxes.", descriptionKey: "module.t4.description", href: "/portal/t4", metric: "Confirm" },
  { title: "Personal Tax", titleKey: "nav.personalTax", description: "Upload personal tax slips by year.", descriptionKey: "module.personalTax.description", href: "/portal/personal-tax", metric: "Tax slips" },
  { title: "Self-Employed", titleKey: "nav.selfEmployed", description: "Income, expenses, and GST for self-employed work.", descriptionKey: "module.selfEmployed.description", href: "/portal/self-employed", metric: "Year summary" },
  { title: "GST", titleKey: "nav.gst", description: "GST collected and paid.", descriptionKey: "module.gst.description", href: "/portal/gst", metric: "Summary" },
  { title: "Payroll", titleKey: "nav.payroll", description: "Wages, hours, and payroll notes.", descriptionKey: "module.payroll.description", href: "/portal/payroll", metric: "Records" },
  { title: "Assets", titleKey: "nav.assets", description: "Equipment, vehicle, tool, and asset purchases.", href: "/portal/assets", metric: "Purchases" },
  { title: "Immigration", titleKey: "nav.immigration", description: "Immigration files and next steps.", descriptionKey: "module.immigration.description", href: "/portal/immigration-files", metric: "Active" },
  { title: "Messages", titleKey: "nav.messages", description: "Ask a question securely.", descriptionKey: "module.messages.description", href: "/portal/messages", metric: "Open" },
  { title: "Appointments", titleKey: "nav.appointments", description: "Book or review appointments.", descriptionKey: "module.appointments.description", href: "/portal/appointments", metric: "Book" },
  { title: "Profile", titleKey: "nav.profile", description: "Your contact and business details.", descriptionKey: "module.profile.description", href: "/portal/profile", metric: "Update" }
];

export const adminDashboardItems: DashboardItem[] = [
  { title: "Clients", titleKey: "nav.clients", description: "All client records and assignments.", href: "/admin/clients", metric: "Real records" },
  { title: "Immigration Cases", titleKey: "nav.immigrationCases", description: "All immigration case files.", href: "/admin/immigration", metric: "Cases" },
  { title: "Accounting Clients", titleKey: "nav.accountingClients", description: "Accounting client year folders.", href: "/admin/accounting-clients", metric: "Select client" },
  { title: "Tax Years", titleKey: "nav.taxYears", description: "Client and year records.", href: "/admin/tax-years", metric: "Select year" },
  { title: "Tax Files", titleKey: "nav.taxFiles", description: "T4 slips and tax document review.", href: "/admin/tax-files", metric: "Review" },
  { title: "Personal Tax", titleKey: "nav.personalTax", description: "Personal slips, extraction review, and tax-prep readiness.", href: "/admin/personal-tax", metric: "Slips" },
  { title: "Self-Employed", titleKey: "nav.selfEmployed", description: "Self-employed income, expenses, GST, and receipts.", href: "/admin/self-employed", metric: "Summary" },
  { title: "Documents", titleKey: "nav.documents", description: "Receipts, bank statements, tax, and immigration files.", href: "/admin/documents", metric: "Files" },
  { title: "Messages", titleKey: "nav.messages", description: "Client and employee messages.", href: "/admin/messages", metric: "Open" },
  { title: "Tasks", titleKey: "nav.tasks", description: "Assigned staff work.", href: "/admin/tasks", metric: "Tasks" },
  { title: "Follow-Ups", titleKey: "nav.followUps", description: "Client follow-up dates.", href: "/admin/follow-ups", metric: "Follow up" },
  { title: "IRCC Requests", titleKey: "nav.irccRequests", description: "IRCC request tracker.", href: "/admin/ircc-requests", metric: "Requests" },
  { title: "Reports", titleKey: "nav.reports", description: "Export reports and working papers.", href: "/admin/reports", metric: "Exports" },
  { title: "Employees", titleKey: "nav.employees", description: "Staff access and assignments.", href: "/admin/employees", metric: "Staff" },
  { title: "Audit Logs", titleKey: "nav.auditLogs", description: "Security and case history.", href: "/admin/audit-logs", metric: "Live" }
];

export const employeeDashboardItems: DashboardItem[] = [
  { title: "Clients", titleKey: "nav.clients", description: "Clients assigned to you.", href: "/employee/clients", metric: "Assigned" },
  { title: "Immigration Cases", titleKey: "nav.immigrationCases", description: "Cases assigned to you.", href: "/employee/immigration", metric: "Assigned" },
  { title: "Documents", titleKey: "nav.documents", description: "Files for assigned clients.", href: "/employee/documents", metric: "Review" },
  { title: "Messages", titleKey: "nav.messages", description: "Messages for assigned clients.", href: "/employee/messages", metric: "Open" },
  { title: "Appointments", titleKey: "nav.appointments", description: "Upcoming assigned-client calls.", href: "/employee/appointments", metric: "Today" },
  { title: "Reports", titleKey: "nav.reports", description: "Assigned-client report tasks.", href: "/employee/reports", metric: "Tasks" }
];

export const clientNav = [
  { labelKey: "nav.home", href: "/portal", icon: FolderKanban },
  { labelKey: "nav.income", href: "/portal/income", icon: BadgeDollarSign },
  { labelKey: "nav.expenses", href: "/portal/expenses", icon: ReceiptText },
  { labelKey: "nav.documents", href: "/portal/documents", icon: FileText },
  { labelKey: "nav.t4", href: "/portal/t4", icon: FileText },
  { labelKey: "nav.personalTax", href: "/portal/personal-tax", icon: FileText },
  { labelKey: "nav.selfEmployed", href: "/portal/self-employed", icon: WalletCards },
  { labelKey: "nav.gst", href: "/portal/gst", icon: Landmark },
  { labelKey: "nav.payroll", href: "/portal/payroll", icon: WalletCards },
  { labelKey: "nav.assets", href: "/portal/assets", icon: Building2 },
  { labelKey: "nav.immigration", href: "/portal/immigration-files", icon: Plane },
  { labelKey: "nav.messages", href: "/portal/messages", icon: MessageSquareText },
  { labelKey: "nav.appointments", href: "/portal/appointments", icon: CalendarClock },
  { labelKey: "nav.profile", href: "/portal/profile", icon: UserRound }
];

export const adminNav = [
  { labelKey: "nav.home", href: "/admin", icon: ShieldCheck },
  { labelKey: "nav.clients", href: "/admin/clients", icon: UsersRound },
  { labelKey: "nav.immigrationCases", href: "/admin/immigration", icon: Plane },
  { labelKey: "nav.accountingClients", href: "/admin/accounting-clients", icon: BadgeDollarSign },
  { labelKey: "nav.taxYears", href: "/admin/tax-years", icon: Landmark },
  { labelKey: "nav.taxFiles", href: "/admin/tax-files", icon: FileText },
  { labelKey: "nav.personalTax", href: "/admin/personal-tax", icon: FileText },
  { labelKey: "nav.selfEmployed", href: "/admin/self-employed", icon: WalletCards },
  { labelKey: "nav.documents", href: "/admin/documents", icon: FileText },
  { labelKey: "nav.messages", href: "/admin/messages", icon: MessageSquareText },
  { labelKey: "nav.tasks", href: "/admin/tasks", icon: SquareCheckBig },
  { labelKey: "nav.followUps", href: "/admin/follow-ups", icon: CalendarClock },
  { labelKey: "nav.irccRequests", href: "/admin/ircc-requests", icon: ClipboardList },
  { labelKey: "nav.reports", href: "/admin/reports", icon: Banknote },
  { labelKey: "nav.employees", href: "/admin/employees", icon: UsersRound },
  { labelKey: "nav.auditLogs", href: "/admin/audit-logs", icon: ShieldCheck }
];

export const employeeNav = [
  { labelKey: "nav.home", href: "/employee", icon: ShieldCheck },
  { labelKey: "nav.clients", href: "/employee/clients", icon: UsersRound },
  { labelKey: "nav.immigrationCases", href: "/employee/immigration", icon: Plane },
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
