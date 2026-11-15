# MyCloud – Personal & Shared Cloud Storage Platform

> **Your Files. Your Cloud. Anywhere.**

MyCloud is a modern, production-grade cloud storage web platform designed with the visual polish and power of Google Drive and Dropbox. It combines **React (TypeScript + Vite + Tailwind CSS)** on the frontend with a secure **Node.js/Express** backend, **Supabase PostgreSQL & Row Level Security (RLS)** for metadata and authentication, and **Cloudflare R2** for fast, cost-effective S3-compatible cloud object storage.

---

## 🌟 Key Features

- **Multi-File & Complete Folder Uploads**: Upload multiple files simultaneously with drag-and-drop support. Upload entire directories while preserving their original folder structure.
- **Direct Cloudflare R2 Uploads via Presigned URLs**: Client uploads directly to Cloudflare R2 via secure presigned PUT URLs, preventing backend bottlenecks and keeping R2 secret access keys private.
- **Multipart Chunked Uploads for Large Files**: Files exceeding 5 MB automatically use R2 multipart upload chunking (5 MB slices) with progress tracking, upload speed (MB/s), estimated time remaining, pause, cancellation, and retry.
- **Comprehensive File & Folder Management**: Create folders, rename, move, delete (soft delete to Trash), restore, and permanently purge items.
- **Rich In-Browser File Previews**: Native preview modal for Images, Videos, Audio, PDFs, Spreadsheets, and text files.
- **Collaboration & Granular Sharing**: Share files and folders with registered users via their email address with **Viewer** (read-only) or **Editor** (upload & modify) permissions.
- **Storage Quota Enforcement**: Real-time quota calculation. Starts with a generous 10 GB free-tier allowance (matching Cloudflare R2 free tier) and easily expands to 1 TB or more via backend configuration.
- **Enterprise-Grade Security**: Supabase Row Level Security (RLS) policies on all tables, rate-limited endpoints, CORS protection, helmet headers, and zero exposed service keys.

---

## 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────┐
│                      Frontend                          │
│   React 18 + TypeScript + Vite + Tailwind CSS          │
│   Lucide Icons + React Router + React Dropzone         │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Metadata │ Auth          Uploads  │ Presigned PUTs
        Queries │ & RLS                  │ & GETs
                ▼                        ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     Supabase Cloud      │    │      Cloudflare R2      │
│  - PostgreSQL Database  │    │  - S3-compatible API    │
│  - Row Level Security   │    │  - Private Bucket       │
│  - User Authentication  │    │  - Multipart Chunking   │
└─────────────────────────┘    └─────────────────────────┘
                ▲
                │ Token Verification & Presigned URL Signing
┌───────────────┴────────────────────────────────────────┐
│                   Node.js / Express                    │
│   - AWS SDK for S3 (@aws-sdk/client-s3)                │
│   - Presigned Upload/Download URL Generator            │
│   - Storage Quota Validator & Multipart Orchestrator   │
└────────────────────────────────────────────────────────┘
```

---

## 🆓 Free-Tier Zero-Cost Setup Guide

This platform is engineered to run on **100% Free Tiers**:
- **Supabase Free Tier**: Free authentication and 500 MB database allowance.
- **Cloudflare R2 Free Allowance**: 10 GB storage, 10 million read operations/month, and **$0 egress fees**.
- **Vercel Hobby Tier**: Free frontend hosting with CI/CD.

### 1. Supabase Database & Auth Setup
1. Create a free account at [supabase.com](https://supabase.com) and create a new project.
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Open `supabase/migrations/20240101000000_init_mycloud_schema.sql` and run the script. This creates all tables (`profiles`, `folders`, `files`, `file_shares`, `folder_shares`, `storage_usage`, `upload_sessions`), triggers, and Row Level Security policies.
4. Go to **Project Settings -> API** to copy:
   - Project URL -> `VITE_SUPABASE_URL`
   - `anon` `public` key -> `VITE_SUPABASE_ANON_KEY`
   - `service_role` `secret` key -> `SUPABASE_SERVICE_ROLE_KEY` (Keep secret on server!)

### 2. Cloudflare R2 Bucket & Token Setup
1. Log in to your Cloudflare dashboard and navigate to **R2**.
2. Click **Create Bucket** and name it `mycloud-files`. Set the location to Automatic.
3. Click **Manage R2 API Tokens** -> **Create API Token**.
4. Set permissions to **Object Read & Write**, and restrict to the `mycloud-files` bucket.
5. Copy the generated credentials:
   - Account ID -> `R2_ACCOUNT_ID`
   - Access Key ID -> `R2_ACCESS_KEY_ID`
   - Secret Access Key -> `R2_SECRET_ACCESS_KEY`
   - Bucket Name -> `R2_BUCKET_NAME` (`mycloud-files`)

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
cd mycloud
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your Supabase and Cloudflare R2 keys.

*(Note: MyCloud features an instant **Demo Mode**. If credentials are left as placeholders, the frontend and backend will automatically run in local interactive mode so you can test all UI flows, folder creations, and simulated uploads immediately!)*

### 3. Run the Development Environment
Run both the Vite frontend and Express server concurrently:
```bash
npm run dev:all
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Backend Health Check: `http://localhost:3001/api/health`

Alternatively, run them in separate terminals:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend API
npm run server
```

---

## 🚀 Production Deployment

### Frontend (Vercel)
1. Push your project to GitHub.
2. In Vercel, import your repository with the **Vite** preset.
3. Set the Root Directory to `mycloud` (or repository root).
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

### Backend (Render / Railway / Fly.io)
1. Deploy the `server/` directory as a Node service.
2. Start command: `node server/index.js`
3. Set environment variables:
   - `PORT=3001`
   - `CORS_ORIGIN=https://your-mycloud-frontend.vercel.app`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

---

## 🛡️ Security Highlights

1. **No Frontend Secret Leakage**: The Cloudflare R2 `SecretAccessKey` and Supabase `service_role` key never touch the browser.
2. **Short-Lived Presigned URLs**: PUT and GET URLs expire after 1 hour (3600 seconds).
3. **Database RLS Enforcement**: Even if a user attempts to query a file directly through the Supabase client, the database rejects queries unless the user is the authenticated owner or has an active share record.
4. **Rate Limiting**: Express rate limiters protect the API from brute-force attempts and upload spam.

