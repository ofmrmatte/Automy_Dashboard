export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export function toneForStatus(status: string): StatusTone {
  if (["Ativo", "Pago", "Resolvido"].includes(status)) return "success";
  if (["Pendente", "Renovação", "Aguardando", "Média", "Implantação"].includes(status)) {
    return "warning";
  }
  if (["Atrasado", "Crítica", "Descontinuando", "Suspenso", "Cancelado"].includes(status)) {
    return "danger";
  }
  if (["Em andamento", "Aberto", "Alta", "Beta"].includes(status)) return "info";
  return "neutral";
}
