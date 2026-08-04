export type TicketPriority = "Crítica" | "Alta" | "Média" | "Baixa";
export type TicketStatus = "Em andamento" | "Aberto" | "Aguardando" | "Resolvido";

export type Ticket = {
  id: string;
  client: string;
  title: string;
  priority: TicketPriority;
  owner: string;
  status: TicketStatus;
  date: string;
};

export type TicketFilter = {
  search: string;
  priority: TicketPriority | "Todas";
};
