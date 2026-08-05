import type { ScheduledCall, ScheduledCallStatus } from "@/features/scheduling/types";
import type {
  ScheduledCallFormData,
  ScheduledCallPatchData,
} from "@/features/scheduling/validation";
import { scheduledCallStatusLabels } from "@/features/scheduling/validation";
import { RepositoryError } from "@/shared/api/errors";

type ScheduledCallRow = {
  id: string;
  client_id: string | null;
  owner_user_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  title: string;
  description: string | null;
  client_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  meeting_link: string | null;
  participants: string[] | null;
  start_at: string;
  end_at: string;
  timezone: string;
  reminder_minutes: number;
  notes: string | null;
  status: ScheduledCallStatus;
  completed_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

async function parseApiError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return new RepositoryError(payload?.error ?? fallback);
}

function mapCall(row: ScheduledCallRow): ScheduledCall {
  return {
    id: row.id,
    clientId: row.client_id ?? "",
    ownerUserId: row.owner_user_id ?? "",
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    title: row.title,
    description: row.description ?? "",
    clientName: row.client_name,
    contactName: row.contact_name ?? "",
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_phone ?? "",
    meetingLink: row.meeting_link ?? "",
    participants: row.participants ?? [],
    startAt: row.start_at,
    endAt: row.end_at,
    timezone: row.timezone,
    reminderMinutes: row.reminder_minutes,
    notes: row.notes ?? "",
    status: row.status,
    statusLabel: scheduledCallStatusLabels[row.status],
    completedAt: row.completed_at,
    canceledAt: row.canceled_at,
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
      throw await parseApiError(response, "Não foi possível carregar as calls.");
    }

    const payload = (await response.json()) as { calls?: ScheduledCallRow[] };
    return (payload.calls ?? []).map(mapCall);
  },
  create: async (payload: ScheduledCallFormData) => {
    const response = await fetch("/api/scheduled-calls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await parseApiError(response, "Não foi possível agendar a call.");
    }

    const result = (await response.json()) as { call: ScheduledCallRow };
    return mapCall(result.call);
  },
  update: async (payload: ScheduledCallPatchData) => {
    const response = await fetch("/api/scheduled-calls", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await parseApiError(response, "Não foi possível atualizar a call.");
    }

    const result = (await response.json()) as { call: ScheduledCallRow };
    return mapCall(result.call);
  },
  updateStatus: async (callId: string, status: ScheduledCallStatus) => {
    return schedulingRepository.update({ id: callId, status });
  },
  remove: async (callId: string) => {
    const response = await fetch(`/api/scheduled-calls?id=${encodeURIComponent(callId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw await parseApiError(response, "Não foi possível excluir a call.");
    }
  },
};
