import type { Charge } from "@/features/finance/types";

export const chargesMock: Charge[] = [
  {
    invoice: "FAT-2048",
    client: "Nexa Digital",
    due: "05 ago. 2026",
    value: "R$ 12.800,00",
    method: "Boleto",
    status: "Pendente",
  },
  {
    invoice: "FAT-2047",
    client: "Atlas Saúde",
    due: "02 ago. 2026",
    value: "R$ 15.200,00",
    method: "Pix",
    status: "Pago",
  },
  {
    invoice: "FAT-2046",
    client: "Verdi Energia",
    due: "01 ago. 2026",
    value: "R$ 8.900,00",
    method: "Boleto",
    status: "Pago",
  },
  {
    invoice: "FAT-2045",
    client: "Arco Varejo",
    due: "28 jul. 2026",
    value: "R$ 4.600,00",
    method: "Cartão",
    status: "Atrasado",
  },
  {
    invoice: "FAT-2044",
    client: "Orbe Logística",
    due: "25 jul. 2026",
    value: "R$ 7.400,00",
    method: "Boleto",
    status: "Pago",
  },
];
