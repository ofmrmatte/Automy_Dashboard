export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export function toneForStatus(status: string): StatusTone {
  if (["Ativo", "Pago", "Resolvido", "paid", "completed"].includes(status)) return "success";
  if (
    [
      "Pendente",
      "Renovação",
      "Aguardando",
      "Média",
      "Implantação",
      "pending",
      "scheduled",
      "rescheduled",
    ].includes(status)
  ) {
    return "warning";
  }
  if (
    [
      "Atrasado",
      "Crítica",
      "Descontinuando",
      "Suspenso",
      "Cancelado",
      "overdue",
      "canceled",
      "failed",
    ].includes(status)
  ) {
    return "danger";
  }
  if (["Em andamento", "Aberto", "Alta", "Beta"].includes(status)) return "info";
  return "neutral";
}
