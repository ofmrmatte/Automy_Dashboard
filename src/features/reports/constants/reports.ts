import { Boxes, FileText, Headphones, Receipt, Users } from "lucide-react";
import type { ReportCard } from "@/features/reports/types";

export const REPORTS: ReportCard[] = [
  { title: "Clientes", text: "Carteira, planos, status e dados cadastrais.", icon: Users },
  { title: "Financeiro", text: "Receitas, cobranças e inadimplência.", icon: Receipt },
  { title: "Contratos", text: "Vigências, valores e renovações.", icon: FileText },
  { title: "Suporte", text: "Tickets, SLAs e produtividade da equipe.", icon: Headphones },
  { title: "Produtos", text: "Adoção, versões e clientes por produto.", icon: Boxes },
];
