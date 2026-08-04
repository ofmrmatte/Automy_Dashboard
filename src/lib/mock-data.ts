export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export const clients = [
  { id: "nexa", initials: "NX", name: "Nexa Digital", legal: "Nexa Tecnologia Ltda.", cnpj: "42.018.920/0001-11", city: "São Paulo", state: "SP", owner: "Marina Costa", plan: "Enterprise", status: "Ativo", joined: "24 jul. 2026" },
  { id: "orbe", initials: "OR", name: "Orbe Logística", legal: "Orbe Transportes S.A.", cnpj: "18.552.401/0001-08", city: "Curitiba", state: "PR", owner: "Rafael Lima", plan: "Scale", status: "Implantação", joined: "22 jul. 2026" },
  { id: "atlas", initials: "AT", name: "Atlas Saúde", legal: "Atlas Serviços Médicos Ltda.", cnpj: "09.771.834/0001-62", city: "Belo Horizonte", state: "MG", owner: "Lívia Rocha", plan: "Enterprise", status: "Ativo", joined: "18 jul. 2026" },
  { id: "verdi", initials: "VR", name: "Verdi Energia", legal: "Verdi Energia Renovável S.A.", cnpj: "31.229.168/0001-35", city: "Florianópolis", state: "SC", owner: "André Melo", plan: "Scale", status: "Ativo", joined: "15 jul. 2026" },
  { id: "lumina", initials: "LU", name: "Lumina Educação", legal: "Lumina Ensino e Pesquisa Ltda.", cnpj: "27.814.050/0001-90", city: "Recife", state: "PE", owner: "Carla Dias", plan: "Growth", status: "Pendente", joined: "11 jul. 2026" },
  { id: "arco", initials: "AR", name: "Arco Varejo", legal: "Arco Comércio Digital Ltda.", cnpj: "12.930.774/0001-41", city: "Campinas", state: "SP", owner: "Bruno Reis", plan: "Growth", status: "Ativo", joined: "08 jul. 2026" },
];

export const products = [
  { name: "Automy Flow", category: "Automação", version: "v4.8.2", clients: 68, status: "Ativo" },
  { name: "Automy Desk", category: "Atendimento", version: "v3.12.0", clients: 42, status: "Ativo" },
  { name: "Automy Insights", category: "Analytics", version: "v2.6.1", clients: 31, status: "Ativo" },
  { name: "Automy Connect", category: "Integrações", version: "v1.9.4", clients: 24, status: "Beta" },
  { name: "Automy Legacy", category: "Operações", version: "v8.1.0", clients: 7, status: "Descontinuando" },
];

export const contracts = [
  { client: "Nexa Digital", plan: "Enterprise", value: "R$ 12.800", start: "10 jan. 2025", renewal: "10 jan. 2027", status: "Ativo" },
  { client: "Orbe Logística", plan: "Scale", value: "R$ 7.400", start: "22 jul. 2026", renewal: "22 jul. 2027", status: "Implantação" },
  { client: "Atlas Saúde", plan: "Enterprise", value: "R$ 15.200", start: "03 set. 2024", renewal: "03 set. 2026", status: "Renovação" },
  { client: "Verdi Energia", plan: "Scale", value: "R$ 8.900", start: "18 mar. 2025", renewal: "18 mar. 2027", status: "Ativo" },
  { client: "Lumina Educação", plan: "Growth", value: "R$ 4.600", start: "11 jul. 2026", renewal: "11 jul. 2027", status: "Pendente" },
];

export const charges = [
  { invoice: "FAT-2048", client: "Nexa Digital", due: "05 ago. 2026", value: "R$ 12.800,00", method: "Boleto", status: "Pendente" },
  { invoice: "FAT-2047", client: "Atlas Saúde", due: "02 ago. 2026", value: "R$ 15.200,00", method: "Pix", status: "Pago" },
  { invoice: "FAT-2046", client: "Verdi Energia", due: "01 ago. 2026", value: "R$ 8.900,00", method: "Boleto", status: "Pago" },
  { invoice: "FAT-2045", client: "Arco Varejo", due: "28 jul. 2026", value: "R$ 4.600,00", method: "Cartão", status: "Atrasado" },
  { invoice: "FAT-2044", client: "Orbe Logística", due: "25 jul. 2026", value: "R$ 7.400,00", method: "Boleto", status: "Pago" },
];

export const tickets = [
  { id: "#SUP-1842", client: "Atlas Saúde", title: "Falha na sincronização do ERP", priority: "Crítica", owner: "Diego Alves", status: "Em andamento", date: "Hoje, 10:42" },
  { id: "#SUP-1841", client: "Nexa Digital", title: "Ajuste no relatório mensal", priority: "Média", owner: "Bia Martins", status: "Aberto", date: "Hoje, 09:18" },
  { id: "#SUP-1839", client: "Verdi Energia", title: "Dúvida sobre permissões", priority: "Baixa", owner: "Diego Alves", status: "Aguardando", date: "Ontem, 16:30" },
  { id: "#SUP-1837", client: "Orbe Logística", title: "Importação inicial de usuários", priority: "Alta", owner: "Ana Freitas", status: "Em andamento", date: "Ontem, 14:05" },
  { id: "#SUP-1834", client: "Lumina Educação", title: "Configuração de webhook", priority: "Média", owner: "Bia Martins", status: "Resolvido", date: "31 jul., 11:22" },
];

export const clientGrowth = [
  { month: "Fev", active: 72, onboarding: 8 }, { month: "Mar", active: 78, onboarding: 6 },
  { month: "Abr", active: 84, onboarding: 9 }, { month: "Mai", active: 91, onboarding: 7 },
  { month: "Jun", active: 99, onboarding: 11 }, { month: "Jul", active: 108, onboarding: 12 },
];

export const revenueGrowth = [
  { month: "Fev", revenue: 312 }, { month: "Mar", revenue: 338 }, { month: "Abr", revenue: 351 },
  { month: "Mai", revenue: 379 }, { month: "Jun", revenue: 402 }, { month: "Jul", revenue: 428 },
];

export function toneFor(status: string): StatusTone {
  if (["Ativo", "Pago", "Resolvido"].includes(status)) return "success";
  if (["Pendente", "Renovação", "Aguardando", "Média", "Implantação"].includes(status)) return "warning";
  if (["Atrasado", "Crítica", "Descontinuando"].includes(status)) return "danger";
  if (["Em andamento", "Aberto", "Alta", "Beta"].includes(status)) return "info";
  return "neutral";
}