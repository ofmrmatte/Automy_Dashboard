import { RepositoryError } from "@/shared/api/errors";

export type AvatarUploadInput = {
  authUserId: string;
  file: File;
};

export type AvatarUploadResult = {
  url: string;
  mimeType: string;
  size: number;
};

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxAvatarSize = 2 * 1024 * 1024;

export function validateAvatarFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new RepositoryError("Use PNG, JPG, JPEG ou WebP para o avatar.");
  }

  if (file.size > maxAvatarSize) {
    throw new RepositoryError("O avatar deve ter no máximo 2 MB.");
  }
}

export async function uploadAvatarToPersistentStorage({
  file,
}: AvatarUploadInput): Promise<AvatarUploadResult> {
  validateAvatarFile(file);
  throw new RepositoryError(
    "Storage persistente de avatar ainda não está configurado. Informe uma URL segura do avatar.",
  );
}
