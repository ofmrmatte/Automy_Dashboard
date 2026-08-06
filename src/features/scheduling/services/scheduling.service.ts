import { schedulingRepository } from "@/features/scheduling/repositories/scheduling.repository";
import type {
  ScheduledCall,
  ScheduledCallFilter,
  ScheduledCallStatus,
} from "@/features/scheduling/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const schedulingService = {
  listCalls: () => schedulingRepository.list(),
  createCall: (payload: Parameters<typeof schedulingRepository.create>[0]) =>
    schedulingRepository.create(payload),
  updateCall: (payload: Parameters<typeof schedulingRepository.update>[0]) =>
    schedulingRepository.update(payload),
  updateCallStatus: (callId: string, status: ScheduledCallStatus) =>
    schedulingRepository.updateStatus(callId, status),
  removeCall: (callId: string) => schedulingRepository.remove(callId),
  filterCalls: (calls: ScheduledCall[], filter: ScheduledCallFilter) => {
    const term = normalizeSearch(filter.search);
    return calls.filter((call) => {
      const matchesSearch = [
        call.title,
        call.description,
        call.clientName,
        call.contactName,
        call.contactEmail,
        call.contactPhone,
        call.meetingLink,
        call.notes,
        call.participants.join(" "),
      ].some((value) => normalizeSearch(value ?? "").includes(term));
      const matchesStatus = filter.status === "all" || call.status === filter.status;

      return matchesSearch && matchesStatus;
    });
  },
};
