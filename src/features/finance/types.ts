export type ChargeStatus = "Pago" | "Pendente" | "Atrasado";

export type Charge = {
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
