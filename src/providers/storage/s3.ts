import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/config/env";
import type { StorageProvider } from "./index";

function config() {
  const e = env();
  if (!e.STORAGE_BUCKET || !e.STORAGE_REGION || !e.STORAGE_ACCESS_KEY_ID || !e.STORAGE_SECRET_ACCESS_KEY) throw new Error("STORAGE_NOT_CONFIGURED");
  return e;
}

export class S3StorageProvider implements StorageProvider {
  private client() {
    const e = config();
    return new S3Client({
      region: e.STORAGE_REGION,
      endpoint: e.STORAGE_ENDPOINT,
      forcePathStyle: Boolean(e.STORAGE_ENDPOINT),
      requestChecksumCalculation: "WHEN_REQUIRED",
      credentials: { accessKeyId: e.STORAGE_ACCESS_KEY_ID!, secretAccessKey: e.STORAGE_SECRET_ACCESS_KEY! }
    });
  }
  async createUploadTarget(key: string, contentType: string) {
    const e = config();
    const command = new PutObjectCommand({ Bucket: e.STORAGE_BUCKET, Key: key, ContentType: contentType });
    return { url: await getSignedUrl(this.client(), command, { expiresIn: 600 }), headers: { "Content-Type": contentType } };
  }
  async createDownloadUrl(key: string, expiresSeconds = 300) {
    const e = config();
    return getSignedUrl(this.client(), new GetObjectCommand({ Bucket: e.STORAGE_BUCKET, Key: key }), { expiresIn: expiresSeconds });
  }
  async delete(key: string) {
    const e = config();
    await this.client().send(new DeleteObjectCommand({ Bucket: e.STORAGE_BUCKET, Key: key }));
  }
}
