import { Download } from "lucide-react";
import { useState } from "react";
import { REPORTS } from "@/features/reports/constants/reports";
import { PageHeader } from "@/shared/components/page-header";
import { Button, Card, Select } from "@/shared/components/ui";

export function ReportsPage() {
  const [done, setDone] = useState("");

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Exporte dados operacionais para análise e compartilhamento."
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <Select aria-label="Período">
          <option>Últimos 30 dias</option>
          <option>Este trimestre</option>
          <option>Este ano</option>
        </Select>
        <Select aria-label="Formato">
          <option>PDF</option>
          <option>CSV</option>
          <option>XLSX</option>
        </Select>
        {done && (
          <div className="flex items-center rounded-lg bg-success/10 px-3 text-sm text-success">
            Relatório de {done} preparado.
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
                onClick={() => setDone(report.title)}
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
