import type { Ticket } from "@/features/support/types";

export const ticketsMock: Ticket[] = [
  {
    id: "#SUP-1842",
    client: "Atlas Saúde",
    title: "Falha na sincronização do ERP",
    priority: "Crítica",
    owner: "Diego Alves",
    status: "Em andamento",
    date: "Hoje, 10:42",
  },
  {
    id: "#SUP-1841",
    client: "Nexa Digital",
    title: "Ajuste no relatório mensal",
    priority: "Média",
    owner: "Bia Martins",
    status: "Aberto",
    date: "Hoje, 09:18",
  },
  {
    id: "#SUP-1839",
    client: "Verdi Energia",
    title: "Dúvida sobre permissões",
    priority: "Baixa",
    owner: "Diego Alves",
    status: "Aguardando",
    date: "Ontem, 16:30",
  },
  {
    id: "#SUP-1837",
    client: "Orbe Logística",
    title: "Importação inicial de usuários",
    priority: "Alta",
    owner: "Ana Freitas",
    status: "Em andamento",
    date: "Ontem, 14:05",
  },
  {
    id: "#SUP-1834",
    client: "Lumina Educação",
    title: "Configuração de webhook",
    priority: "Média",
    owner: "Bia Martins",
    status: "Resolvido",
    date: "31 jul., 11:22",
  },
];
