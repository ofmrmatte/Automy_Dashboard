import type {
  Activity,
  ClientGrowthPoint,
  DashboardSummary,
  RevenueGrowthPoint,
} from "@/features/dashboard/types";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { formatDate } from "@/shared/utils/formatters";

type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];
type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

const emptySummary: DashboardSummary = {
  activeClients: 0,
  onboardingClients: 0,
  monthlyRevenue: 0,
  annualRevenue: 0,
  openTickets: 0,
  expiringContracts: 0,
};

function isWithinNextDays(value: string | null, days: number) {
  if (!value) return false;

  const target = new Date(value).getTime();
  const now = Date.now();
  const limit = now + days * 24 * 60 * 60 * 1000;

  return target >= now && target <= limit;
}

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

export const dashboardRepository = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await fetch("/api/dashboard/summary");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar indicadores do dashboard.");
    }

    const payload = (await response.json()) as {
      clients?: Pick<ClientRow, "status">[];
      contracts?: Pick<ContractRow, "monthly_value" | "ends_at">[];
    };
    const clients = payload.clients ?? [];
    const contracts = payload.contracts ?? [];
    const monthlyRevenue = contracts.reduce(
      (total, contract) => total + (contract.monthly_value ?? 0),
      0,
    );

    return {
      activeClients: clients.filter((client) => client.status === "active").length,
      onboardingClients: clients.filter((client) => client.status === "onboarding").length,
      monthlyRevenue,
      annualRevenue: monthlyRevenue * 12,
      openTickets: 0,
      expiringContracts: contracts.filter((contract) => isWithinNextDays(contract.ends_at, 60))
        .length,
    };
  },
  getClientGrowth: async (): Promise<ClientGrowthPoint[]> => [],
  getRevenueGrowth: async (): Promise<RevenueGrowthPoint[]> => [],
  getRecentActivities: async (): Promise<Activity[]> => {
    const response = await fetch("/api/dashboard/activity");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar atividades recentes.");
    }

    const payload = (await response.json()) as { activities?: ActivityLogRow[] };
    return (payload.activities ?? []).map(mapActivity);
  },
};
