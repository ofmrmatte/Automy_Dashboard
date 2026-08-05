import type { ReportKind, ReportPayload, ReportPeriod } from "@/features/reports/types";
import { RepositoryError } from "@/shared/api/errors";

async function readError(response: Response, fallback: string) {
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  return result?.error ?? fallback;
}

export const reportRepository = {
  getReport: async (kind: ReportKind, period: ReportPeriod): Promise<ReportPayload> => {
    if (typeof window === "undefined") {
      return {
        kind,
        title: "",
        period,
        generatedAt: new Date().toISOString(),
        rows: [],
      };
    }

    const params = new URLSearchParams({ kind, period });
    const response = await fetch(`/api/reports?${params.toString()}`);

    if (!response.ok) {
      throw new RepositoryError(
        await readError(response, "Não foi possível carregar o relatório."),
      );
    }

    const payload = (await response.json()) as { report: ReportPayload };
    return payload.report;
  },
};
