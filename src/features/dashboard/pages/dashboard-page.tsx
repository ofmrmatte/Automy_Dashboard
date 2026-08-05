import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CircleDollarSign,
  FileWarning,
  Headphones,
  Rocket,
  Users,
} from "lucide-react";
import {
  clientGrowthQueryOptions,
  dashboardSummaryQueryOptions,
  recentActivitiesQueryOptions,
  revenueGrowthQueryOptions,
} from "@/features/dashboard/api/dashboard.queries";
import { ClientChart, RevenueChart } from "@/features/dashboard/components/dashboard-charts";
import { clientsQueryOptions } from "@/features/clients/api/client.queries";
import { useIdentity } from "@/features/identity/context/identity-context";
import { EmptyState } from "@/shared/components/empty-state";
import { Badge, Card } from "@/shared/components/ui";
import { MetricCard } from "@/shared/components/metric-card";
import { PageHeader } from "@/shared/components/page-header";
import { toneForStatus } from "@/shared/types/status";
import {
  formatCurrency,
  formatShortDate,
  formatLongDate,
  getLocalizedGreeting,
} from "@/shared/utils/regional-formatters";

export function DashboardPage() {
  const { preferences, profile } = useIdentity();
  const regionalPreferences = {
    locale: preferences?.language,
    timeZone: preferences?.timeZone,
    currency: preferences?.currency,
    timeFormat: preferences?.timeFormat,
  };
  const { data: summary, isLoading: summaryLoading } = useQuery(dashboardSummaryQueryOptions());
  const { data: clients = [], isLoading: clientsLoading } = useQuery(clientsQueryOptions());
  const { data: clientGrowth = [], isLoading: clientGrowthLoading } = useQuery(
    clientGrowthQueryOptions(),
  );
  const { data: revenueGrowth = [], isLoading: revenueGrowthLoading } = useQuery(
    revenueGrowthQueryOptions(),
  );
  const { data: recentActivities = [], isLoading: activitiesLoading } = useQuery(
    recentActivitiesQueryOptions(),
  );

  return (
    <div>
      <PageHeader
        eyebrow={formatLongDate(new Date(), regionalPreferences, profile?.companyTimeZone)}
        title={getLocalizedGreeting(
          profile?.firstName ?? "",
          regionalPreferences,
          profile?.companyTimeZone,
        )}
        description="Acompanhe os principais indicadores e movimentos da operação."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Clientes ativos"
          value={String(summary?.activeClients ?? 0)}
          helper="clientes ativos"
          icon={Users}
          loading={summaryLoading}
        />
        <MetricCard
          label="Em implantação"
          value={String(summary?.onboardingClients ?? 0)}
          helper="clientes em implantação"
          icon={Rocket}
          loading={summaryLoading}
        />
        <MetricCard
          label="Receita mensal"
          value={formatCurrency(summary?.monthlyRevenue ?? 0, regionalPreferences)}
          helper="contratos ativos"
          icon={CircleDollarSign}
          loading={summaryLoading}
        />
        <MetricCard
          label="Receita anual"
          value={formatCurrency(summary?.annualRevenue ?? 0, regionalPreferences)}
          helper="receita anualizada"
          icon={CircleDollarSign}
          loading={summaryLoading}
        />
        <MetricCard
          label="Chamados abertos"
          value={String(summary?.openTickets ?? 0)}
          positive={false}
          helper="sem módulo de tickets ativo"
          icon={Headphones}
          loading={summaryLoading}
        />
        <MetricCard
          label="Contratos a vencer"
          value={String(summary?.expiringContracts ?? 0)}
          helper="nos próximos 60 dias"
          icon={FileWarning}
          loading={summaryLoading}
        />
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="font-semibold">Crescimento de clientes</h2>
            <p className="text-xs text-muted-foreground">Ativos e em implantação por período</p>
          </div>
          {clientGrowthLoading || clientGrowth.length > 0 ? (
            <ClientChart data={clientGrowth} />
          ) : (
            <EmptyState
              title="Sem histórico de clientes"
              description="O gráfico será exibido quando houver dados reais suficientes."
            />
          )}
        </Card>
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="font-semibold">Receita recorrente</h2>
            <p className="text-xs text-muted-foreground">Evolução mensal da receita recorrente</p>
          </div>
          {revenueGrowthLoading || revenueGrowth.length > 0 ? (
            <RevenueChart data={revenueGrowth} />
          ) : (
            <EmptyState
              title="Sem histórico financeiro"
              description="O gráfico será exibido quando houver dados reais suficientes."
            />
          )}
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
            {clientsLoading || clients.length > 0 ? (
              clients.slice(0, 4).map((client) => (
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
                      {[client.city, client.state].filter(Boolean).join(", ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cadastro: {formatShortDate(client.createdAt, regionalPreferences)}
                    </div>
                  </div>
                  <Badge tone={toneForStatus(client.status)}>{client.status}</Badge>
                </div>
              ))
            ) : (
              <EmptyState
                title="Sem clientes cadastrados"
                description="Os clientes recentes aparecerão aqui quando houver registros reais."
              />
            )}
          </div>
        </Card>
        <Card>
          <div className="border-b border-border p-5">
            <h2 className="font-semibold">Atividades recentes</h2>
            <p className="text-xs text-muted-foreground">Atualizações da equipe</p>
          </div>
          <div className="space-y-5 p-5">
            {activitiesLoading || recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-accent">
                    <CalendarClock className="size-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{activity.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {activity.meta} · {formatShortDate(activity.createdAt, regionalPreferences)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Sem atividades recentes"
                description="Eventos reais da operação aparecerão aqui quando registrados."
              />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
