import { Download } from "lucide-react";
import { useState } from "react";
import { REPORTS } from "@/features/reports/constants/reports";
import { PageHeader } from "@/shared/components/page-header";
import { Button, Card, Select } from "@/shared/components/ui";
import { toast } from "@/shared/components/toast";

const reportEndpoints: Record<string, { endpoint: string; key: string }> = {
  Clientes: { endpoint: "/api/clients", key: "clients" },
  Financeiro: { endpoint: "/api/finance/charges", key: "charges" },
  Contratos: { endpoint: "/api/contracts", key: "contracts" },
  Suporte: { endpoint: "/api/support/tickets", key: "tickets" },
  Produtos: { endpoint: "/api/products", key: "products" },
};

function flattenValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return "sem_registros\n";

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const lines = rows.map((row) =>
    headers
      .map((header) => `"${flattenValue(row[header]).replace(/"/g, '""')}"`)
      .join(","),
  );

  return `${headers.join(",")}\n${lines.join("\n")}`;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [done, setDone] = useState("");
  const [format, setFormat] = useState("CSV");
  const [loading, setLoading] = useState("");

  async function exportReport(title: string) {
    if (format !== "CSV") {
      toast.warning("Exportação PDF/XLSX será adicionada depois; CSV já baixa dados reais.");
      return;
    }

    const config = reportEndpoints[title];
    if (!config) return;

    try {
      setLoading(title);
      const response = await fetch(config.endpoint);
      if (!response.ok) throw new Error("Falha ao carregar dados do relatório.");

      const payload = (await response.json()) as Record<string, Array<Record<string, unknown>>>;
      const rows = payload[config.key] ?? [];
      downloadCsv(`automy-${title.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
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
        <Select aria-label="Período">
          <option>Todos os registros</option>
          <option>Últimos 30 dias</option>
          <option>Este trimestre</option>
          <option>Este ano</option>
        </Select>
        <Select aria-label="Formato" value={format} onChange={(event) => setFormat(event.target.value)}>
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
                onClick={() => exportReport(report.title)}
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
