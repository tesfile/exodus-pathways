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

export type PublicServicePost = {
  id: string;
  title: string;
  category: "Immigration" | "Accounting" | "Business" | "General";
  service_type: string;
  language: string;
  translation_key: string | null;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};
