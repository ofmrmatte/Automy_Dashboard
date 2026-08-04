import type { AuditableEntity } from "@/shared/types/entity";

export type ScheduledCallStatus = "Agendada" | "Concluída" | "Cancelada";

export type ScheduledCall = AuditableEntity & {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  title: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  meetingLink: string;
  notes: string;
  status: ScheduledCallStatus;
};

