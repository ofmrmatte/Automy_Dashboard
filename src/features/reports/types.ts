import type { LucideIcon } from "lucide-react";

export type ReportKind =
  | "clients"
  | "products"
  | "contracts"
  | "finance"
  | "scheduling"
  | "support"
  | "users"
  | "permissions"
  | "audit";

export type ReportPeriod = "all" | "last_30_days" | "quarter" | "year";

export type ReportFormat = "CSV" | "XLSX" | "PDF";

export type ReportCard = {
  kind: ReportKind;
  title: string;
  text: string;
  icon: LucideIcon;
};

export type ReportPayload = {
  kind: ReportKind;
  title: string;
  period: ReportPeriod;
  generatedAt: string;
  rows: Array<Record<string, unknown>>;
};
