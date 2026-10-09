# Winter Arc – Namdapha: Production Deployment & Operations Guide

This guide details the complete configuration and deployment procedure for deploying the **Winter Arc – Namdapha** platform onto **Hostinger** web hosting backed by **Supabase**.

---

## 1. Prerequisites & Required Accounts
1. **Hostinger Account:** Web Hosting or Cloud Hosting plan with access to hPanel (File Manager or Git auto-deploy).
2. **Supabase Account:** Free or Pro project at [https://supabase.com](https://supabase.com).
3. **Google Cloud Console:** OAuth 2.0 Web Application credentials.
4. **Node.js 20+ & npm 10+:** Local development and build environment.

---

## 2. Supabase Configuration

### 2.1 Database Migrations
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Create a new query, paste the entire contents of [`supabase/migrations/20261010000000_winter_arc_initial_schema.sql`](file:///c:/Winter%20Arc/supabase/migrations/20261010000000_winter_arc_initial_schema.sql), and click **Run**.
3. This creates:
   - 12 Relational entities with strict constraints and indexes.
   - 100% complete Row Level Security (RLS) policies.
   - The anonymized `leaderboard_view` (zero email exposure).
   - Privileged RPC `process_daily_study_goal` with idempotency guarantees.
   - Seeded 12 Challenge Periods for Winter Arc 2026 (Oct 10 – Dec 31, 2026).

### 2.2 Storage Bucket Setup (`evidence-vault`)
1. In the Supabase Dashboard, navigate to **Storage** -> **New Bucket**.
2. Bucket Name: `evidence-vault`.
3. **Public bucket:** Ensure this is **UNCHECKED (Private)**. Private evidence must never be publicly readable via unrestricted URLs.
4. Max file size: `10MB`.
5. Allowed MIME types: `image/jpeg, image/png, image/webp, image/heic`.
6. Storage Policies:
   - **Upload (INSERT):** Authenticated users can upload to their own folder (`(storage.foldername(name))[1] = auth.uid()::text`).
   - **Download/Read (SELECT):** Authenticated user owns the file OR caller has `coordinator` / `admin` role in `public.profiles`.

---

## 3. Google OAuth 2.0 Setup

1. In [Google Cloud Console](https://console.cloud.google.com):
   - Create a project: `Winter Arc - Namdapha`.
   - Go to **APIs & Services** -> **Credentials** -> **Create Credentials** -> **OAuth 2.0 Client ID**.
   - Application Type: **Web Application**.
   - **Authorized JavaScript Origins:**
     - `http://localhost:5173` (Local testing)
     - `https://your-custom-domain.com` (Hostinger live site)
   - **Authorized Redirect URIs:**
     - `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
2. In Supabase Dashboard -> **Authentication** -> **Providers** -> **Google**:
   - Toggle **Enable Google provider**.
   - Enter your Google **Client ID** and **Client Secret**.
   - Save changes.

---

## 4. Primary Administrator Provisioning

To grant initial administrative permissions:
1. Have the lead administrator sign in once using their institutional Google account (`admin@study.iitm.ac.in`).
2. Run the following query in the Supabase SQL Editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@study.iitm.ac.in';
```
3. This grants access to the **Admin Control Center**, submissions review queue, role modification interface, and CSV reporting.

---

## 5. Hostinger Production Build & Deployment

### 5.1 Environment Variables
Create `.env` in the project root:
```ini
VITE_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ALLOWED_EMAIL_DOMAINS=ds.study.iitm.ac.in,es.study.iitm.ac.in,study.iitm.ac.in
VITE_CHALLENGE_TIMEZONE=Asia/Kolkata
```

### 5.2 Build the Static Assets
Run:
```bash
npm run build
```
This generates the optimized bundle in `dist/`. Note that `dist/.htaccess` is automatically copied from `public/.htaccess` to configure SPA URL rewrites for Hostinger's Apache/LiteSpeed web servers.

### 5.3 Deploy to Hostinger
1. Log into **Hostinger hPanel**.
2. Navigate to **Websites** -> Manage -> **File Manager** (or connect via FTP/SFTP).
3. Open the `public_html/` root directory.
4. Upload all files and folders inside the local `dist/` directory directly into `public_html/`:
   - `assets/`
   - `index.html`
   - `.htaccess`
   - `favicon.svg` (if present)
5. Verify that `.htaccess` is present in `public_html/` so that direct route refreshes do not return 404 errors.

---

## 6. Domain, HTTPS & Security Recommendations

1. **SSL Certificate:** In Hostinger hPanel -> **SSL**, ensure Lifetime Free SSL is active and **Force HTTPS** is enabled.
2. **Secrets Hygiene:** Never commit `.env` or service role keys to Git. The frontend client only requires `VITE_SUPABASE_ANON_KEY`, which is fully secured behind Row Level Security (RLS).
3. **Daily Backup:**
   - In Hostinger: Enable Automated Daily Backups under **Files** -> **Backups**.
   - In Supabase: Automated PITR (Point-in-Time Recovery) or scheduled daily database dumps via `pg_dump`.
