import { queryOptions } from "@tanstack/react-query";
import { reportService } from "@/features/reports/services/report.service";
import type { ReportKind, ReportPeriod } from "@/features/reports/types";

export const reportQueryKeys = {
  all: ["reports"] as const,
  detail: (kind: ReportKind, period: ReportPeriod) => ["reports", kind, period] as const,
};

export function reportQueryOptions(kind: ReportKind, period: ReportPeriod) {
  return queryOptions({
    queryKey: reportQueryKeys.detail(kind, period),
    queryFn: () => reportService.getReport(kind, period),
    enabled: typeof window !== "undefined",
  });
}
