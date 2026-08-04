export type AuditableEntity = {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type SoftDeletePayload = {
  deletedAt: string;
  updatedAt: string;
  updatedBy: string | null;
};
