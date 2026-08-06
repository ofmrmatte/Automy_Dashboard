import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  FileText,
  Headphones,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";

export const LANDING_MODULES = [
  {
    icon: Users,
    title: "Clientes",
    description:
      "Cadastro completo, histórico de relacionamento e visão 360º de cada transportadora atendida.",
  },
  {
    icon: FileText,
    title: "Contratos",
    description: "Ciclo de vida contratual com vigências, reajustes e assinatura acompanhada.",
  },
  {
    icon: Boxes,
    title: "Produtos",
    description: "Catálogo de serviços e planos com precificação padronizada por operação.",
  },
  {
    icon: CircleDollarSign,
    title: "Financeiro",
    description: "Cobranças, recebíveis e conciliação em um fluxo único, sem planilhas paralelas.",
  },
  {
    icon: Headphones,
    title: "Suporte",
    description: "Tickets priorizados por SLA, com rastreio de responsáveis e tempo de resposta.",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Indicadores executivos em tempo real para decisões rápidas e defensáveis.",
  },
] as const;

export const LANDING_BENEFITS = [
  {
    icon: Workflow,
    title: "Operação centralizada",
    description:
      "Um só lugar para comercial, contratos, faturamento e suporte — sem retrabalho entre times.",
  },
  {
    icon: ShieldCheck,
    title: "Governança e permissões",
    description: "Perfis, papéis e trilhas de acesso definidos por função dentro da empresa.",
  },
  {
    icon: BarChart3,
    title: "Decisão orientada a dados",
    description: "Métricas de receita, inadimplência e produtividade atualizadas continuamente.",
  },
] as const;

export const LANDING_STEPS = [
  {
    step: "01",
    title: "Diagnóstico",
    description: "Mapeamos processos, gargalos e integrações necessárias da sua operação.",
  },
  {
    step: "02",
    title: "Implantação",
    description: "Configuramos módulos, papéis e importamos a base de clientes e contratos.",
  },
  {
    step: "03",
    title: "Operação assistida",
    description: "Treinamento do time e acompanhamento dos indicadores nos primeiros ciclos.",
  },
] as const;

export const LANDING_PLANS = [
  {
    name: "Essencial",
    price: "R$ 890",
    period: "/mês",
    description: "Para transportadoras que estão saindo das planilhas.",
    features: ["Clientes e contratos", "Financeiro básico", "Até 5 usuários", "Suporte por e-mail"],
    highlighted: false,
  },
  {
    name: "Operacional",
    price: "R$ 1.890",
    period: "/mês",
    description: "O plano mais adotado por operações em crescimento.",
    features: [
      "Todos os módulos do ERP",
      "Relatórios executivos",
      "Até 25 usuários",
      "Suporte prioritário com SLA",
    ],
    highlighted: true,
  },
  {
    name: "Corporativo",
    price: "Sob consulta",
    period: "",
    description: "Para grupos com múltiplas filiais e integrações próprias.",
    features: [
      "Multiempresa e multifilial",
      "Integrações e APIs dedicadas",
      "Usuários ilimitados",
      "Gerente de conta dedicado",
    ],
    highlighted: false,
  },
] as const;

export const LANDING_FAQ = [
  {
    question: "A Automy substitui o meu sistema atual?",
    answer:
      "Na maioria dos casos sim. O ERP cobre clientes, contratos, produtos, financeiro, suporte e relatórios em uma base única, e integrações mantêm sistemas legados conectados durante a transição.",
  },
  {
    question: "Quanto tempo leva a implantação?",
    answer:
      "Operações de porte médio entram em produção entre 2 e 6 semanas, incluindo migração de base, configuração de permissões e treinamento das equipes.",
  },
  {
    question: "Consigo importar minha base atual?",
    answer:
      "Sim. Fazemos a importação de clientes, contratos e histórico financeiro a partir de planilhas ou exportações do sistema atual.",
  },
  {
    question: "Como funciona o suporte?",
    answer:
      "Todo chamado entra pelo módulo de suporte com prioridade e SLA definidos, com acompanhamento de responsável e tempo de resposta.",
  },
] as const;

export const LANDING_METRICS = [
  { value: "6", label: "módulos integrados" },
  { value: "-38%", label: "tempo em tarefas manuais" },
  { value: "99,9%", label: "disponibilidade da plataforma" },
  { value: "2-6", label: "semanas para implantar" },
] as const;