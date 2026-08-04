import {
  CalendarClock,
  CircleDollarSign,
  FileWarning,
  Headphones,
  Rocket,
  Users,
} from "lucide-react";
import { ClientChart, RevenueChart } from "@/features/dashboard/components/dashboard-charts";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import { clientService } from "@/features/clients/services/client.service";
import { Badge, Card } from "@/shared/components/ui";
import { MetricCard } from "@/shared/components/metric-card";
import { PageHeader } from "@/shared/components/page-header";
import { toneForStatus } from "@/shared/types/status";

export function DashboardPage() {
  const clients = clientService.getClientsSnapshot();
  const clientGrowth = dashboardService.getClientGrowthSnapshot();
  const revenueGrowth = dashboardService.getRevenueGrowthSnapshot();
  const recentActivities = dashboardService.getRecentActivitiesSnapshot();

  return (
    <div>
      <PageHeader
        eyebrow="Terça-feira, 4 de agosto"
        title="Bom dia, Marina"
        description="Acompanhe os principais indicadores e movimentos da operação."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Clientes ativos"
          value="108"
          change="8,2%"
          helper="vs. mês anterior"
          icon={Users}
        />
        <MetricCard
          label="Em implantação"
          value="12"
          change="3 novos"
          helper="este mês"
          icon={Rocket}
        />
        <MetricCard
          label="Receita mensal"
          value="R$ 428 mil"
          change="6,4%"
          helper="vs. mês anterior"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Receita anual"
          value="R$ 4,8 mi"
          change="12,1%"
          helper="vs. ano anterior"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Chamados abertos"
          value="18"
          change="4,1%"
          positive={false}
          helper="vs. semana anterior"
          icon={Headphones}
        />
        <MetricCard
          label="Contratos a vencer"
          value="7"
          helper="nos próximos 60 dias"
          icon={FileWarning}
        />
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="font-semibold">Crescimento de clientes</h2>
            <p className="text-xs text-muted-foreground">
              Ativos e em implantação nos últimos 6 meses
            </p>
          </div>
          <ClientChart data={clientGrowth} />
        </Card>
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="font-semibold">Receita recorrente</h2>
            <p className="text-xs text-muted-foreground">Evolução mensal em milhares de reais</p>
          </div>
          <RevenueChart data={revenueGrowth} />
        </Card>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-semibold">Clientes recentes</h2>
              <p className="text-xs text-muted-foreground">Últimos cadastros na plataforma</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {clients.slice(0, 4).map((client) => (
              <div
                key={client.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4"
              >
                <div className="grid size-9 place-items-center rounded-lg bg-accent text-xs font-semibold">
                  {client.initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{client.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {client.plan} · {client.city}
                  </div>
                </div>
                <Badge tone={toneForStatus(client.status)}>{client.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="border-b border-border p-5">
            <h2 className="font-semibold">Atividades recentes</h2>
            <p className="text-xs text-muted-foreground">Atualizações da equipe</p>
          </div>
          <div className="space-y-5 p-5">
            {recentActivities.map((activity) => (
              <div key={activity.title} className="flex gap-3">
                <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-accent">
                  <CalendarClock className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">{activity.title}</div>
                  <div className="text-xs text-muted-foreground">{activity.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
