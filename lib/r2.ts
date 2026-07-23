import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const R2_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export const ALLOWED_DOC_MIMES = new Set([
  ...ALLOWED_IMAGE_MIMES,
  "application/pdf",
]);

function r2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error(
      "Missing Cloudflare R2 env vars. Ensure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, " +
      "CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME, and CLOUDFLARE_R2_PUBLIC_URL are set."
    );
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function makeClient() {
  const { accountId, accessKeyId, secretAccessKey } = r2Config();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function buildPublicUrl(key: string): string {
  return `${r2Config().publicUrl}/${key}`;
}

export async function uploadToR2(buffer: Buffer, key: string, mime: string): Promise<string> {
  const { bucket } = r2Config();
  await makeClient().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mime })
  );
  return buildPublicUrl(key);
}

export async function deleteFromR2(key: string): Promise<void> {
  const { bucket } = r2Config();
  await makeClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
