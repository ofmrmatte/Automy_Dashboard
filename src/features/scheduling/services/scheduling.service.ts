import { schedulingRepository } from "@/features/scheduling/repositories/scheduling.repository";

export const schedulingService = {
  listCalls: () => schedulingRepository.list(),
  createCall: (payload: Parameters<typeof schedulingRepository.create>[0]) =>
    schedulingRepository.create(payload),
};
