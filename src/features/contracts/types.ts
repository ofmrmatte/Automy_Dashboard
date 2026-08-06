import type { AuditableEntity } from "@/shared/types/entity";

export type ContractStatus =
  "Ativo" | "Implantação" | "Renovação" | "Pendente" | "Suspenso" | "Cancelado" | "Encerrado";

export type Contract = AuditableEntity & {
  id: string;
  clientId: string;
  productId: string;
  client: string;
  product: string;
  plan: string;
  value: string;
  monthlyValue: number;
  implementationValue: number;
  start: string;
  startsAt: string;
  renewal: string;
  endsAt: string;
  renewalAt: string;
  billingPeriod: string;
  status: ContractStatus;
  signerName?: string | null;
  witnessName?: string | null;
  contractText?: string | null;
  notes?: string | null;
};

export type ContractFilter = {
  search: string;
  status: ContractStatus | "Todos";
};
