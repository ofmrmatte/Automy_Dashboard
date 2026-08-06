import { createHash } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { loadLocalServerEnv } from "@/shared/server/env";

export type StorageProviderName = "noop" | "railway_s3" | "s3" | "cloudflare_r2";

export type StorageObjectMetadata = {
  contentType?: string;
  contentLength?: number;
  checksumSha256?: string;
};

export type StoragePutInput = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
};

export type StorageProvider = {
  name: StorageProviderName;
  bucket: string;
  createUploadUrl: (key: string, contentType: string) => Promise<string>;
  createDownloadUrl: (key: string) => Promise<string>;
  putObject: (input: StoragePutInput) => Promise<StorageObjectMetadata>;
  getObject: (key: string) => Promise<{ body: ArrayBuffer; contentType?: string }>;
  deleteObject: (key: string) => Promise<void>;
  replaceObject: (input: StoragePutInput) => Promise<StorageObjectMetadata>;
  getMetadata: (key: string) => Promise<StorageObjectMetadata>;
  validateObject: (
    key: string,
    rules?: { allowedMimeTypes?: Set<string>; maxSizeBytes?: number },
  ) => Promise<void>;
};

const signedUrlTtlSeconds = 5 * 60;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável ${name} não configurada para storage.`);
  return value;
}

function configuredProviderName(): StorageProviderName {
  loadLocalServerEnv();
  const raw = (
    process.env["STORAGE_PROVIDER"] ??
    process.env["AVATAR_STORAGE_PROVIDER"] ??
    "noop"
  ).toLowerCase();

  if (raw === "railway_s3" || raw === "s3" || raw === "cloudflare_r2") return raw;
  return "noop";
}

function checksum(body: Buffer | Uint8Array) {
  return createHash("sha256").update(body).digest("hex");
}

function createS3StorageProvider(name: Exclude<StorageProviderName, "noop">): StorageProvider {
  const bucket = requiredEnv("STORAGE_BUCKET");
  const client = new S3Client({
    region: process.env["STORAGE_REGION"] ?? "auto",
    endpoint: requiredEnv("STORAGE_ENDPOINT"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv("STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("STORAGE_SECRET_ACCESS_KEY"),
    },
  });

  async function putObject(input: StoragePutInput) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        Metadata: input.metadata,
      }),
    );

    return {
      contentType: input.contentType,
      contentLength: input.body.byteLength,
      checksumSha256: checksum(input.body),
    };
  }

  return {
    name,
    bucket,
    createUploadUrl: (key, contentType) =>
      getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: signedUrlTtlSeconds },
      ),
    createDownloadUrl: (key) =>
      getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
        expiresIn: signedUrlTtlSeconds,
      }),
    putObject,
    async getObject(key) {
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const body = await object.Body?.transformToByteArray();
      if (!body) throw new Error("Arquivo não encontrado no storage.");
      const arrayBuffer = body.buffer.slice(
        body.byteOffset,
        body.byteOffset + body.byteLength,
      ) as ArrayBuffer;
      return {
        body: arrayBuffer,
        ...(object.ContentType ? { contentType: object.ContentType } : {}),
      };
    },
    async deleteObject(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    replaceObject: putObject,
    async getMetadata(key) {
      const metadata = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return {
        ...(metadata.ContentType ? { contentType: metadata.ContentType } : {}),
        ...(metadata.ContentLength ? { contentLength: metadata.ContentLength } : {}),
        ...(metadata.Metadata?.["checksum-sha256"]
          ? { checksumSha256: metadata.Metadata["checksum-sha256"] }
          : {}),
      };
    },
    async validateObject(key, rules) {
      const metadata = await this.getMetadata(key);
      if (
        rules?.allowedMimeTypes &&
        metadata.contentType &&
        !rules.allowedMimeTypes.has(metadata.contentType)
      ) {
        throw new Error("Tipo de arquivo não permitido.");
      }
      if (
        rules?.maxSizeBytes &&
        metadata.contentLength &&
        metadata.contentLength > rules.maxSizeBytes
      ) {
        throw new Error("Arquivo maior que o limite permitido.");
      }
    },
  };
}

export function getStorageProvider(): StorageProvider {
  const name = configuredProviderName();
  if (name === "noop") {
    return {
      name,
      bucket: "",
      createUploadUrl: async () => {
        throw new Error("Storage persistente não configurado.");
      },
      createDownloadUrl: async () => {
        throw new Error("Storage persistente não configurado.");
      },
      putObject: async () => {
        throw new Error("Storage persistente não configurado.");
      },
      getObject: async () => {
        throw new Error("Storage persistente não configurado.");
      },
      deleteObject: async () => {
        throw new Error("Storage persistente não configurado.");
      },
      replaceObject: async () => {
        throw new Error("Storage persistente não configurado.");
      },
      getMetadata: async () => {
        throw new Error("Storage persistente não configurado.");
      },
      validateObject: async () => {
        throw new Error("Storage persistente não configurado.");
      },
    };
  }

  return createS3StorageProvider(name);
}
