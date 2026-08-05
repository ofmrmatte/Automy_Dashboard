import { Download } from "lucide-react";
import { useState } from "react";
import { useIdentity } from "@/features/identity/context/identity-context";
import { REPORTS } from "@/features/reports/constants/reports";
import { reportService } from "@/features/reports/services/report.service";
import type { ReportFormat, ReportKind, ReportPeriod } from "@/features/reports/types";
import { downloadReport } from "@/features/reports/utils/exporters";
import { PageHeader } from "@/shared/components/page-header";
import { Button, Card, Select } from "@/shared/components/ui";
import { toast } from "@/shared/components/toast";

export function ReportsPage() {
  const { preferences } = useIdentity();
  const [done, setDone] = useState("");
  const [format, setFormat] = useState<ReportFormat>("CSV");
  const [loading, setLoading] = useState("");
  const [period, setPeriod] = useState<ReportPeriod>("all");

  async function exportReport(kind: ReportKind, title: string) {
    try {
      setLoading(title);
      const report = await reportService.getReport(kind, period);
      downloadReport(report, format, {
        preferences: {
          locale: preferences?.language,
          timeZone: preferences?.timeZone,
          currency: preferences?.currency,
          dateFormat: preferences?.dateFormat,
          timeFormat: preferences?.timeFormat,
        },
      });
      setDone(title);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível exportar.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Exporte dados operacionais salvos no banco da Railway."
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <Select
          aria-label="Período"
          value={period}
          onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
        >
          <option value="all">Todos os registros</option>
          <option value="last_30_days">Últimos 30 dias</option>
          <option value="quarter">Este trimestre</option>
          <option value="year">Este ano</option>
        </Select>
        <Select
          aria-label="Formato"
          value={format}
          onChange={(event) => setFormat(event.target.value as ReportFormat)}
        >
          <option>CSV</option>
          <option>PDF</option>
          <option>XLSX</option>
        </Select>
        {done && (
          <div className="flex items-center rounded-lg bg-success/10 px-3 text-sm text-success">
            Relatório de {done} exportado.
          </div>
        )}
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title} className="p-6">
              <div className="grid size-10 place-items-center rounded-lg bg-accent">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-5 font-semibold">{report.title}</h2>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{report.text}</p>
              <Button
                variant="secondary"
                className="mt-5 w-full"
                loading={loading === report.title}
                onClick={() => exportReport(report.kind, report.title)}
              >
                <Download className="size-4" />
                Exportar relatório
              </Button>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
