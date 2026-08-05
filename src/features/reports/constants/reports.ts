import {
  Boxes,
  CalendarClock,
  FileText,
  Headphones,
  KeyRound,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ReportCard } from "@/features/reports/types";

export const REPORTS: ReportCard[] = [
  {
    kind: "clients",
    title: "Clientes",
    text: "Carteira, planos, status e dados cadastrais.",
    icon: Users,
  },
  {
    kind: "products",
    title: "Produtos",
    text: "Adoção, versões e clientes por produto.",
    icon: Boxes,
  },
  {
    kind: "contracts",
    title: "Contratos",
    text: "Vigências, valores e renovações.",
    icon: FileText,
  },
  {
    kind: "finance",
    title: "Financeiro",
    text: "Receitas, cobranças e inadimplência.",
    icon: Receipt,
  },
  {
    kind: "scheduling",
    title: "Agenda",
    text: "Compromissos, reuniões e histórico de execução.",
    icon: CalendarClock,
  },
  {
    kind: "support",
    title: "Suporte",
    text: "Tickets, SLAs e produtividade da equipe.",
    icon: Headphones,
  },
  {
    kind: "users",
    title: "Usuários",
    text: "Contas, perfis, status e último acesso.",
    icon: ShieldCheck,
  },
  {
    kind: "permissions",
    title: "Permissões",
    text: "Matriz de RBAC por perfil operacional.",
    icon: KeyRound,
  },
  {
    kind: "audit",
    title: "Auditoria",
    text: "Eventos relevantes registrados no audit log.",
    icon: ScrollText,
  },
];
