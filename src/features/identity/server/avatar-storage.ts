import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { RepositoryError } from "@/shared/api/errors";

export type AvatarUploadInput = {
  authUserId: string;
  file: File;
};

export type AvatarUploadResult = {
  url: string;
  thumbnail256Url: string;
  thumbnail512Url: string;
  mimeType: string;
  size: number;
  storageKey: string;
  provider: AvatarStorageProviderName;
  checksumSha256: string;
};

export type AvatarStorageProviderName =
  "noop" | "local" | "s3" | "cloudflare_r2" | "railway_volume";

type ProcessedAvatar = {
  image256: Buffer;
  image512: Buffer;
  checksumSha256: string;
};

type AvatarStorageProvider = {
  name: AvatarStorageProviderName;
  save: (input: AvatarUploadInput & { processed: ProcessedAvatar }) => Promise<AvatarUploadResult>;
};

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxAvatarSize = 5 * 1024 * 1024;

export function validateAvatarFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new RepositoryError("Use PNG, JPG, JPEG ou WebP para o avatar.");
  }

  if (file.size > maxAvatarSize) {
    throw new RepositoryError("O avatar deve ter no máximo 5 MB.");
  }
}

function publicBaseUrl() {
  return process.env["AVATAR_PUBLIC_BASE_URL"]?.replace(/\/$/, "") ?? "";
}

async function processAvatar(file: File): Promise<ProcessedAvatar> {
  const input = Buffer.from(await file.arrayBuffer());
  const checksumSha256 = createHash("sha256").update(input).digest("hex");
  const base = sharp(input).rotate();

  const [image256, image512] = await Promise.all([
    base
      .clone()
      .resize(256, 256, { fit: "cover", position: "centre" })
      .webp({ quality: 86 })
      .toBuffer(),
    base
      .clone()
      .resize(512, 512, { fit: "cover", position: "centre" })
      .webp({ quality: 88 })
      .toBuffer(),
  ]);

  return { image256, image512, checksumSha256 };
}

function storageRoot() {
  return resolve(
    process.env["AVATAR_STORAGE_PATH"] ??
      process.env["RAILWAY_VOLUME_MOUNT_PATH"] ??
      join(process.cwd(), "public", "uploads", "avatars"),
  );
}

function urlForStorageKey(storageKey: string) {
  const baseUrl = publicBaseUrl();
  if (baseUrl) return `${baseUrl}/${storageKey.replace(/\\/g, "/")}`;
  return `/uploads/avatars/${storageKey.replace(/\\/g, "/")}`;
}

function localProvider(name: "local" | "railway_volume"): AvatarStorageProvider {
  return {
    name,
    save: async ({ authUserId, file, processed }) => {
      const avatarId = randomUUID();
      const storageKey = `${authUserId}/${avatarId}`;
      const directory = join(storageRoot(), authUserId, avatarId);
      await mkdir(directory, { recursive: true });
      await Promise.all([
        writeFile(join(directory, "avatar-256.webp"), processed.image256),
        writeFile(join(directory, "avatar-512.webp"), processed.image512),
      ]);

      return {
        url: urlForStorageKey(`${storageKey}/avatar-512.webp`),
        thumbnail256Url: urlForStorageKey(`${storageKey}/avatar-256.webp`),
        thumbnail512Url: urlForStorageKey(`${storageKey}/avatar-512.webp`),
        mimeType: "image/webp",
        size: file.size,
        storageKey,
        provider: name,
        checksumSha256: processed.checksumSha256,
      };
    },
  };
}

const noopProvider: AvatarStorageProvider = {
  name: "noop",
  save: async () => {
    throw new RepositoryError(
      "Storage persistente de avatar ainda não está configurado. Configure AVATAR_STORAGE_PROVIDER com local, railway_volume, s3 ou cloudflare_r2.",
    );
  },
};

function unavailableObjectStorageProvider(name: "s3" | "cloudflare_r2"): AvatarStorageProvider {
  return {
    name,
    save: async () => {
      throw new RepositoryError(
        `Adapter ${name} preparado, mas as credenciais de storage ainda não estão configuradas.`,
      );
    },
  };
}

function getAvatarStorageProvider(): AvatarStorageProvider {
  const provider = (process.env["AVATAR_STORAGE_PROVIDER"] ?? "noop").toLowerCase();
  if (provider === "local") return localProvider("local");
  if (provider === "railway_volume") return localProvider("railway_volume");
  if (provider === "s3") return unavailableObjectStorageProvider("s3");
  if (provider === "cloudflare_r2") return unavailableObjectStorageProvider("cloudflare_r2");
  return noopProvider;
}

export async function uploadAvatarToPersistentStorage({
  authUserId,
  file,
}: AvatarUploadInput): Promise<AvatarUploadResult> {
  validateAvatarFile(file);
  const processed = await processAvatar(file);
  return getAvatarStorageProvider().save({ authUserId, file, processed });
}
