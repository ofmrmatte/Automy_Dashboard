import type { AuditableEntity } from "@/shared/types/entity";

export type ChargeStatus = "pending" | "paid" | "overdue" | "canceled" | "failed";

export type Charge = AuditableEntity & {
  id: string;
  invoice: string;
  reference: string;
  clientId: string;
  contractId: string;
  client: string;
  contract: string;
  dueDate: string;
  due: string;
  amount: number;
  value: string;
  paidValue: number;
  method: string;
  provider: string;
  status: ChargeStatus;
  statusLabel: string;
  description: string;
  notes: string;
  paidAt: string | null;
  canceledAt: string | null;
  failedAt: string | null;
  reconciliationStatus: string;
};

export type FinanceSummary = {
  monthlyRevenue: number;
  annualRevenue: number;
  overdueAmount: number;
  expectedReceipts: number;
  paidAmount: number;
  openAmount: number;
  delinquentClients: number;
};

export type FinancePayload = {
  charges: Charge[];
  summary: FinanceSummary;
};

export type ChargeFilter = {
  search: string;
  status: ChargeStatus | "all";
};
