export type PortalRole = "admin" | "employee" | "client";
export type ClientType = "individual" | "business";

export type PortalUser = {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  client_type: ClientType;
  phone?: string | null;
  role: PortalRole;
};

export type ServiceSlug =
  | "accounting-tax"
  | "bookkeeping"
  | "payroll"
  | "immigration-services"
  | "business-services";

export type DashboardItem = {
  title: string;
  description: string;
  href: string;
  metric?: string;
  titleKey?: string;
  descriptionKey?: string;
};

export type TableColumn = {
  key: string;
  label: string;
  labelKey?: string;
};

export type DemoRow = Record<string, string>;
