import type {
  Activity,
  ClientGrowthPoint,
  DashboardSummary,
  RevenueGrowthPoint,
} from "@/features/dashboard/types";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { getSupabaseClient } from "@/shared/lib/supabase/client";
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
    const supabase = getSupabaseClient();
    if (!supabase) return emptySummary;

    const [clientsResult, contractsResult] = await Promise.all([
      supabase.from("clients").select("id, status").is("deleted_at", null),
      supabase.from("contracts").select("id, monthly_value, ends_at").is("deleted_at", null),
    ]);

    if (clientsResult.error) {
      throw new RepositoryError("Não foi possível carregar indicadores de clientes.", {
        cause: clientsResult.error,
      });
    }

    if (contractsResult.error) {
      throw new RepositoryError("Não foi possível carregar indicadores de contratos.", {
        cause: contractsResult.error,
      });
    }

    const clients = (clientsResult.data ?? []) as Pick<ClientRow, "id" | "status">[];
    const contracts = (contractsResult.data ?? []) as Pick<
      ContractRow,
      "id" | "monthly_value" | "ends_at"
    >[];
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
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      throw new RepositoryError("Não foi possível carregar atividades recentes.", { cause: error });
    }

    return (data ?? []).map(mapActivity);
  },
};
