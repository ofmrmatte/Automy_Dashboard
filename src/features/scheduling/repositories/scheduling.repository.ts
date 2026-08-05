import type { ScheduledCall } from "@/features/scheduling/types";
import { RepositoryError } from "@/shared/api/errors";

type ScheduledCallRow = {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  title: string;
  client_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  meeting_link: string | null;
  notes: string | null;
  status: ScheduledCall["status"];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

function mapCall(row: ScheduledCallRow): ScheduledCall {
  return {
    id: row.id,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    title: row.title,
    clientName: row.client_name,
    contactName: row.contact_name ?? "",
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_phone ?? "",
    meetingLink: row.meeting_link ?? "",
    notes: row.notes ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const schedulingRepository = {
  list: async () => {
    const response = await fetch("/api/scheduled-calls");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar as calls.");
    }

    const payload = (await response.json()) as { calls?: ScheduledCallRow[] };
    return (payload.calls ?? []).map(mapCall);
  },
  create: async (payload: {
    scheduledDate: string;
    scheduledTime: string;
    title: string;
    clientName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    meetingLink: string;
    notes: string;
    status: ScheduledCall["status"];
  }) => {
    const response = await fetch("/api/scheduled-calls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível agendar a call.");
    }

    const result = (await response.json()) as { call: ScheduledCallRow };
    return mapCall(result.call);
  },
};
