import { chargesMock } from "@/features/finance/mocks/charges.mock";

export const financeRepository = {
  listChargesSnapshot: () => chargesMock,
  listCharges: async () => chargesMock,
};
