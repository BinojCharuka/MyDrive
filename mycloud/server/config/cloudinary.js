import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const cleanVal = (val) => (val ? val.replace(/[<>]/g, '').trim() : '');

let cloudName = cleanVal(process.env.CLOUDINARY_CLOUD_NAME);
let apiKey = cleanVal(process.env.CLOUDINARY_API_KEY);
let apiSecret = cleanVal(process.env.CLOUDINARY_API_SECRET);
let cloudinaryUrl = process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.replace(/[<>]/g, '').trim() : '';

// Auto-derive if URL is provided
if (cloudinaryUrl && (!cloudName || !apiKey || !apiSecret)) {
  try {
    const parsed = new URL(cloudinaryUrl);
    if (!cloudName) cloudName = parsed.hostname;
    if (!apiKey) apiKey = parsed.username;
    if (!apiSecret) apiSecret = parsed.password;
  } catch {}
}

export const isCloudinaryConfigured = Boolean(
  cloudinaryUrl || (cloudName && apiKey && apiSecret)
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const getCloudinaryConfig = () => {
  return {
    isConfigured: isCloudinaryConfigured,
    cloudName: cloudName || null,
    apiKey: apiKey || null,
    apiSecret: apiSecret || null,
  };
};

export default cloudinary;
