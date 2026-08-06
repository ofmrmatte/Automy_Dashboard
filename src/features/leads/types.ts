export type LeadStatus =
  "new" | "contacted" | "qualified" | "proposal" | "converted" | "lost" | "discarded";

export type Lead = {
  id: string;
  companyId: string | null;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  document: string;
  message: string;
  interest: string;
  source: string;
  status: LeadStatus;
  assignedUserId: string | null;
  assignedUserName: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  landingPath: string;
  referrer: string;
  consentAt: string;
  firstContactAt: string | null;
  convertedClientId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type LeadListResponse = {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type LeadFilter = {
  search: string;
  status: LeadStatus | "all";
  page: number;
  pageSize: number;
};
