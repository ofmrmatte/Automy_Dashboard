import type {
  Activity,
  DashboardCharts,
  DashboardRecentClient,
  DashboardSummary,
} from "@/features/dashboard/types";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { formatDate, getInitials } from "@/shared/utils/formatters";

type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];
type RecentClientRow = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  | "id"
  | "trade_name"
  | "legal_name"
  | "city"
  | "state"
  | "status"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "created_by"
  | "updated_by"
>;

const fallbackSummary: DashboardSummary = {
  activeClients: 0,
  onboardingClients: 0,
  inactiveClients: 0,
  activeContracts: 0,
  expiringContracts30: 0,
  expiringContracts60: 0,
  monthlyRevenue: 0,
  annualRevenue: 0,
  pendingCharges: 0,
  overdueCharges: 0,
  openTickets: 0,
  criticalTickets: 0,
  futureScheduledCalls: 0,
  activeUsers: 0,
  expiringContracts: 0,
};

function mapActivity(row: ActivityLogRow): Activity {
  return {
    id: row.id,
    title: row.action,
    meta: `${row.entity_type} · ${formatDate(row.created_at)}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapRecentClient(row: RecentClientRow): DashboardRecentClient {
  const name = row.trade_name ?? row.legal_name;

  return {
    id: row.id,
    initials: getInitials(name),
    name,
    city: row.city ?? "",
    state: row.state ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const dashboardRepository = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await fetch("/api/dashboard/summary");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar indicadores do dashboard.");
    }

    const payload = (await response.json()) as { summary?: DashboardSummary };
    return { ...fallbackSummary, ...payload.summary };
  },
  getCharts: async (): Promise<DashboardCharts> => {
    const response = await fetch("/api/dashboard/charts");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar gráficos do dashboard.");
    }

    const payload = (await response.json()) as { charts?: DashboardCharts };
    return {
      clientGrowth: payload.charts?.clientGrowth ?? [],
      revenueGrowth: payload.charts?.revenueGrowth ?? [],
      contractsByStatus: payload.charts?.contractsByStatus ?? [],
      ticketsByPriority: payload.charts?.ticketsByPriority ?? [],
      productsByUsage: payload.charts?.productsByUsage ?? [],
      chargesByStatus: payload.charts?.chargesByStatus ?? [],
    };
  },
  getRecentClients: async (): Promise<DashboardRecentClient[]> => {
    const response = await fetch("/api/dashboard/recent-clients");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar clientes recentes.");
    }

    const payload = (await response.json()) as { clients?: RecentClientRow[] };
    return (payload.clients ?? []).map(mapRecentClient);
  },
  getRecentActivities: async (): Promise<Activity[]> => {
    const response = await fetch("/api/dashboard/activity");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar atividades recentes.");
    }

    const payload = (await response.json()) as { activities?: ActivityLogRow[] };
    return (payload.activities ?? []).map(mapActivity);
  },
};
