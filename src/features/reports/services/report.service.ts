import { reportRepository } from "@/features/reports/repositories/report.repository";
import type { ReportKind, ReportPeriod } from "@/features/reports/types";

export const reportService = {
  getReport: (kind: ReportKind, period: ReportPeriod) => reportRepository.getReport(kind, period),
};
