import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileWarning,
  Headphones,
  Rocket,
  UserCheck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  dashboardChartsQueryOptions,
  dashboardRecentClientsQueryOptions,
  dashboardSummaryQueryOptions,
  recentActivitiesQueryOptions,
} from "@/features/dashboard/api/dashboard.queries";
import {
  ClientChart,
  DistributionChart,
  ProductUsageChart,
  RevenueChart,
} from "@/features/dashboard/components/dashboard-charts";
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

function labelForClientStatus(status: string) {
  if (status === "active") return "Ativo";
  if (status === "onboarding") return "Implantação";
  if (status === "inactive") return "Inativo";
  if (status === "blocked") return "Bloqueado";
  return "Pendente";
}

function ChartCard({
  title,
  description,
  emptyTitle,
  emptyDescription,
  isLoading,
  hasData,
  children,
}: {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  isLoading: boolean;
  hasData: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-5">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {isLoading || hasData ? (
        children
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </Card>
  );
}

export function DashboardPage() {
  const { preferences, profile } = useIdentity();
  const regionalPreferences = {
    locale: preferences?.language,
    timeZone: preferences?.timeZone,
    currency: preferences?.currency,
    timeFormat: preferences?.timeFormat,
  };
  const { data: summary, isLoading: summaryLoading } = useQuery(dashboardSummaryQueryOptions());
  const { data: charts, isLoading: chartsLoading } = useQuery(dashboardChartsQueryOptions());
  const { data: clients = [], isLoading: clientsLoading } = useQuery(
    dashboardRecentClientsQueryOptions(),
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
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
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
          label="Clientes inativos"
          value={String(summary?.inactiveClients ?? 0)}
          positive={false}
          helper="clientes inativos"
          icon={Users}
          loading={summaryLoading}
        />
        <MetricCard
          label="Contratos ativos"
          value={String(summary?.activeContracts ?? 0)}
          helper="contratos vigentes"
          icon={ClipboardCheck}
          loading={summaryLoading}
        />
        <MetricCard
          label="Vencem em 30 dias"
          value={String(summary?.expiringContracts30 ?? 0)}
          positive={false}
          helper="contratos próximos"
          icon={FileWarning}
          loading={summaryLoading}
        />
        <MetricCard
          label="Vencem em 60 dias"
          value={String(summary?.expiringContracts60 ?? 0)}
          positive={false}
          helper="janela de renovação"
          icon={FileWarning}
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
          label="Pendentes"
          value={String(summary?.pendingCharges ?? 0)}
          positive={false}
          helper="cobranças pendentes"
          icon={CreditCard}
          loading={summaryLoading}
        />
        <MetricCard
          label="Vencidas"
          value={String(summary?.overdueCharges ?? 0)}
          positive={false}
          helper="cobranças vencidas"
          icon={AlertTriangle}
          loading={summaryLoading}
        />
        <MetricCard
          label="Chamados abertos"
          value={String(summary?.openTickets ?? 0)}
          positive={false}
          helper="tickets em aberto"
          icon={Headphones}
          loading={summaryLoading}
        />
        <MetricCard
          label="Chamados críticos"
          value={String(summary?.criticalTickets ?? 0)}
          positive={false}
          helper="prioridade crítica"
          icon={AlertTriangle}
          loading={summaryLoading}
        />
        <MetricCard
          label="Agendamentos"
          value={String(summary?.futureScheduledCalls ?? 0)}
          helper="futuros"
          icon={CalendarDays}
          loading={summaryLoading}
        />
        <MetricCard
          label="Usuários ativos"
          value={String(summary?.activeUsers ?? 0)}
          helper="contas ativas"
          icon={UserCheck}
          loading={summaryLoading}
        />
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Crescimento de clientes"
          description="Ativos e em implantação por período"
          emptyTitle="Sem histórico de clientes"
          emptyDescription="O gráfico será exibido quando houver dados reais suficientes."
          isLoading={chartsLoading}
          hasData={(charts?.clientGrowth ?? []).some((point) => point.active || point.onboarding)}
        >
          <ClientChart data={charts?.clientGrowth ?? []} />
        </ChartCard>
        <ChartCard
          title="Receita recorrente"
          description="Evolução mensal da receita recorrente"
          emptyTitle="Sem histórico financeiro"
          emptyDescription="O gráfico será exibido quando houver contratos ativos."
          isLoading={chartsLoading}
          hasData={(charts?.revenueGrowth ?? []).some((point) => point.revenue > 0)}
        >
          <RevenueChart data={charts?.revenueGrowth ?? []} />
        </ChartCard>
        <ChartCard
          title="Contratos por status"
          description="Distribuição real da carteira contratual"
          emptyTitle="Sem contratos cadastrados"
          emptyDescription="A distribuição será exibida quando houver contratos reais."
          isLoading={chartsLoading}
          hasData={(charts?.contractsByStatus ?? []).length > 0}
        >
          <DistributionChart data={charts?.contractsByStatus ?? []} valueLabel="Contratos" />
        </ChartCard>
        <ChartCard
          title="Tickets por prioridade"
          description="Distribuição dos chamados por nível de impacto"
          emptyTitle="Sem chamados cadastrados"
          emptyDescription="A distribuição será exibida quando houver tickets reais."
          isLoading={chartsLoading}
          hasData={(charts?.ticketsByPriority ?? []).length > 0}
        >
          <DistributionChart data={charts?.ticketsByPriority ?? []} valueLabel="Tickets" />
        </ChartCard>
        <ChartCard
          title="Produtos por utilização"
          description="Clientes vinculados a cada produto"
          emptyTitle="Sem utilização de produtos"
          emptyDescription="A utilização será exibida quando produtos forem vinculados a contratos."
          isLoading={chartsLoading}
          hasData={(charts?.productsByUsage ?? []).some((point) => point.clients > 0)}
        >
          <ProductUsageChart data={charts?.productsByUsage ?? []} />
        </ChartCard>
        <ChartCard
          title="Cobranças por status"
          description="Distribuição financeira operacional"
          emptyTitle="Sem cobranças cadastradas"
          emptyDescription="A distribuição será exibida quando houver cobranças reais."
          isLoading={chartsLoading}
          hasData={(charts?.chargesByStatus ?? []).length > 0}
        >
          <DistributionChart data={charts?.chargesByStatus ?? []} valueLabel="Cobranças" />
        </ChartCard>
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
              clients.map((client) => {
                const status = labelForClientStatus(client.status);

                return (
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
                    <Badge tone={toneForStatus(status)}>{status}</Badge>
                  </div>
                );
              })
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
