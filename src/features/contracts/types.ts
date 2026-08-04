import type { AuditableEntity } from "@/shared/types/entity";

export type ContractStatus = "Ativo" | "Implantação" | "Renovação" | "Pendente";

export type Contract = AuditableEntity & {
  id: string;
  client: string;
  plan: string;
  value: string;
  start: string;
  renewal: string;
  status: ContractStatus;
  signerName?: string | null;
  witnessName?: string | null;
  contractText?: string | null;
};

export type ContractFilter = {
  search: string;
  status: ContractStatus | "Todos";
};
