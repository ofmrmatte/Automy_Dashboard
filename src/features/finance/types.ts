import type { AuditableEntity } from "@/shared/types/entity";

export type ChargeStatus = "Pago" | "Pendente" | "Atrasado";

export type Charge = AuditableEntity & {
  id: string;
  invoice: string;
  client: string;
  due: string;
  value: string;
  method: string;
  status: ChargeStatus;
};

export type ChargeFilter = {
  search: string;
  status: ChargeStatus | "Todos";
};
