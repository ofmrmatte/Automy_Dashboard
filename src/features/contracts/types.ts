export type ContractStatus = "Ativo" | "Implantação" | "Renovação" | "Pendente";

export type Contract = {
  client: string;
  plan: string;
  value: string;
  start: string;
  renewal: string;
  status: ContractStatus;
};

export type ContractFilter = {
  search: string;
  status: ContractStatus | "Todos";
};
