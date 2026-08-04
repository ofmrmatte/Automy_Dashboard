import type { AuditableEntity } from "@/shared/types/entity";

export type ClientStatus = "Ativo" | "Implantação" | "Pendente";

export type Client = AuditableEntity & {
  id: string;
  initials: string;
  name: string;
  legal: string;
  cnpj: string;
  city: string;
  state: string;
  owner: string;
  plan: string;
  status: ClientStatus;
  joined: string;
};

export type ClientFilter = {
  search: string;
  status: ClientStatus | "Todos";
};
