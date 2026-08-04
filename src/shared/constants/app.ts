import {
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileText,
  Headphones,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

export const APP_NAME = "Automy";
export const APP_DESCRIPTION =
  "Automy — Plataforma inteligente para controle e gestão operacional.";

export const APP_NAVIGATION = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Contratos", to: "/contratos", icon: FileText },
  { label: "Produtos", to: "/produtos", icon: Boxes },
  { label: "Financeiro", to: "/financeiro", icon: CircleDollarSign },
  { label: "Suporte", to: "/suporte", icon: Headphones },
  { label: "Relatórios", to: "/relatorios", icon: ChartNoAxesCombined },
  { label: "Configurações", to: "/configuracoes", icon: Settings },
] as const;
