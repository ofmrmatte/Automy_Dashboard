import { leadRepository } from "@/features/leads/repositories/lead.repository";
import type { LeadStatus } from "@/features/leads/types";

export const leadStatusLabels = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  proposal: "Proposta",
  converted: "Convertido",
  lost: "Perdido",
  discarded: "Descartado",
} as const satisfies Record<LeadStatus, string>;

export function toneForLeadStatus(status: LeadStatus) {
  if (status === "converted" || status === "qualified") return "success";
  if (status === "proposal" || status === "contacted") return "info";
  if (status === "lost" || status === "discarded") return "danger";
  return "pending";
}

export const leadService = {
  listLeads: leadRepository.list,
  updateLead: leadRepository.update,
  convertLead: leadRepository.convert,
};
