import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME
} = process.env;

export const r2Bucket = R2_BUCKET_NAME || 'mycloud-files';

// Cloudflare R2 provides an S3-compatible API endpoint
const r2Endpoint = R2_ACCOUNT_ID
  ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : undefined;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || 'placeholder',
    secretAccessKey: R2_SECRET_ACCESS_KEY || 'placeholder',
  },
  forcePathStyle: true,
});

export const isR2Configured = Boolean(
  R2_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_ACCOUNT_ID !== 'placeholder-account-id'
);

