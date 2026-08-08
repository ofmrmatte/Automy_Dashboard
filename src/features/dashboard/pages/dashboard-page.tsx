import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileWarning,
  Headphones,
  Rocket,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  dashboardChartsQueryOptions,
  dashboardRecentClientsQueryOptions,
  dashboardSummaryQueryOptions,
} from "@/features/dashboard/api/dashboard.queries";
import { ClientChart, RevenueChart } from "@/features/dashboard/components/dashboard-charts";
import { useIdentity } from "@/features/identity/context/identity-context";
import { EmptyState } from "@/shared/components/empty-state";
import { Badge, Card, Skeleton } from "@/shared/components/ui";
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
    <Card className="p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {isLoading || hasData ? (
        children
      ) : (
        <div className="py-2">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      )}
    </Card>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>;
}

function DashboardMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  loading,
  secondary = false,
  attention = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  loading: boolean;
  secondary?: boolean;
  attention?: boolean;
}) {
  return (
    <Card
      className={[
        "min-w-0 p-3.5 transition-colors sm:p-4",
        secondary ? "bg-card/70" : "bg-card",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-xs font-medium text-muted-foreground">{label}</div>
        <div className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
          {attention && !loading && (
            <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-warning ring-2 ring-card" />
          )}
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-20" />
      ) : (
        <div
          className={[
            "mt-3 truncate font-semibold tracking-tight text-foreground",
            secondary ? "text-xl" : "text-2xl",
          ].join(" ")}
          title={value}
        >
          {value}
        </div>
      )}
      {!loading && <div className="mt-1 text-xs text-muted-foreground">{helper}</div>}
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

      <section>
        <SectionTitle title="Visão principal" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <DashboardMetricCard
            label="Clientes ativos"
            value={String(summary?.activeClients ?? 0)}
            helper="clientes ativos"
            icon={Users}
            loading={summaryLoading}
          />
          <DashboardMetricCard
            label="Em implantação"
            value={String(summary?.onboardingClients ?? 0)}
            helper="clientes em implantação"
            icon={Rocket}
            loading={summaryLoading}
          />
          <DashboardMetricCard
            label="Contratos ativos"
            value={String(summary?.activeContracts ?? 0)}
            helper="contratos vigentes"
            icon={ClipboardCheck}
            loading={summaryLoading}
          />
          <DashboardMetricCard
            label="Receita mensal"
            value={formatCurrency(summary?.monthlyRevenue ?? 0, regionalPreferences)}
            helper="contratos ativos"
            icon={CircleDollarSign}
            loading={summaryLoading}
          />
          <DashboardMetricCard
            label="Pendências financeiras"
            value={String(summary?.pendingCharges ?? 0)}
            helper="cobranças pendentes"
            icon={CreditCard}
            loading={summaryLoading}
            attention={Boolean((summary?.pendingCharges ?? 0) > 0)}
          />
          <DashboardMetricCard
            label="Chamados abertos"
            value={String(summary?.openTickets ?? 0)}
            helper="tickets em aberto"
            icon={Headphones}
            loading={summaryLoading}
            attention={Boolean((summary?.openTickets ?? 0) > 0)}
          />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="Alertas e operação" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <DashboardMetricCard
            label="Vencem em 30 dias"
            value={String(summary?.expiringContracts30 ?? 0)}
            helper="contratos próximos"
            icon={FileWarning}
            loading={summaryLoading}
            secondary
            attention={Boolean((summary?.expiringContracts30 ?? 0) > 0)}
          />
          <DashboardMetricCard
            label="Vencem em 60 dias"
            value={String(summary?.expiringContracts60 ?? 0)}
            helper="janela de renovação"
            icon={FileWarning}
            loading={summaryLoading}
            secondary
            attention={Boolean((summary?.expiringContracts60 ?? 0) > 0)}
          />
          <DashboardMetricCard
            label="Cobranças vencidas"
            value={String(summary?.overdueCharges ?? 0)}
            helper="cobranças vencidas"
            icon={AlertTriangle}
            loading={summaryLoading}
            secondary
            attention={Boolean((summary?.overdueCharges ?? 0) > 0)}
          />
          <DashboardMetricCard
            label="Chamados críticos"
            value={String(summary?.criticalTickets ?? 0)}
            helper="prioridade crítica"
            icon={AlertTriangle}
            loading={summaryLoading}
            secondary
            attention={Boolean((summary?.criticalTickets ?? 0) > 0)}
          />
          <DashboardMetricCard
            label="Agendamentos"
            value={String(summary?.futureScheduledCalls ?? 0)}
            helper="próximos compromissos"
            icon={CalendarDays}
            loading={summaryLoading}
            secondary
          />
          <DashboardMetricCard
            label="Usuários ativos"
            value={String(summary?.activeUsers ?? 0)}
            helper="contas ativas"
            icon={UserCheck}
            loading={summaryLoading}
            secondary
          />
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
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
      </section>
      <section className="mt-8">
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
      </section>
    </div>
  );
}
