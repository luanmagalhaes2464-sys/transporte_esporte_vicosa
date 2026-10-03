import { env } from "@/config/env";
import { S3StorageProvider } from "./s3";
export interface StorageProvider {
  createUploadTarget(key: string, contentType: string): Promise<{ url: string; headers?: Record<string, string> }>;
  createDownloadUrl(key: string, expiresSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}
export function storageProvider(): StorageProvider {
  if (env().STORAGE_PROVIDER === "s3") return new S3StorageProvider();
  throw new Error("STORAGE_PROVIDER_NOT_CONFIGURED");
}
