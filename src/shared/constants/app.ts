import {
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileText,
  Headphones,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";

export const APP_NAME = "Automy";
export const APP_DESCRIPTION =
  "Automy — Plataforma inteligente para controle e gestão operacional.";

export const APP_NAVIGATION = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Leads", to: "/leads", icon: Megaphone },
  { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Contratos", to: "/contratos", icon: FileText },
  { label: "Produtos", to: "/produtos", icon: Boxes },
  { label: "Financeiro", to: "/financeiro", icon: CircleDollarSign },
  { label: "Call de agendamento", to: "/call-de-agendamento", icon: CalendarDays },
  { label: "Suporte", to: "/suporte", icon: Headphones },
  { label: "Relatórios", to: "/relatorios", icon: ChartNoAxesCombined },
  { label: "Configurações", to: "/configuracoes", icon: Settings },
] as const;
