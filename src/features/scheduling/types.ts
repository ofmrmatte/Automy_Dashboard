import type { AuditableEntity } from "@/shared/types/entity";

export type ScheduledCallStatus = "scheduled" | "rescheduled" | "completed" | "canceled";

export type ScheduledCall = AuditableEntity & {
  id: string;
  clientId: string;
  ownerUserId: string;
  scheduledDate: string;
  scheduledTime: string;
  title: string;
  description: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  meetingLink: string;
  participants: string[];
  startAt: string;
  endAt: string;
  timezone: string;
  reminderMinutes: number;
  notes: string;
  status: ScheduledCallStatus;
  statusLabel: string;
  completedAt: string | null;
  canceledAt: string | null;
};

export type ScheduledCallFilter = {
  search: string;
  status: ScheduledCallStatus | "all";
};
