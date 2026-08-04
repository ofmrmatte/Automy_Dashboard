import { contractsMock } from "@/features/contracts/mocks/contracts.mock";

export const contractRepository = {
  listSnapshot: () => contractsMock,
  list: async () => contractsMock,
};
