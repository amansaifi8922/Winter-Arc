# Winter Arc – Namdapha

> **Self-improvement, study & workout accountability platform for the Namdapha House community of the IIT Madras BS Degree Programme.**
> **Challenge Window:** October 10, 2026 – December 31, 2026 (83 days, 12 challenge periods).
> **Timezone:** `Asia/Kolkata` (IST, UTC+05:30).

---

## 🌟 Overview & Core Pillars

Winter Arc is an 83-day community initiative designed around personal consistency, habit formation, and peer accountability:

1. **Daily Study Habit:** 180 minutes (3 hours) of academic deep work per calendar day, verified with a photo of the completed timer.
2. **Weekly Workout Discipline:** 3 workouts per week (2 in the final partial week, Dec 26–31), verified with photo evidence.
3. **Weekly House Missions:** Communal habit-building missions worth 20 points each.
4. **Zero Cash Prizes:** 100% peer accountability and personal excellence.

---

## 🛠️ Architecture & Tech Stack

* **Frontend:** React 19, TypeScript 5, Vite build system.
* **Styling:** Tailwind CSS with cinematic dark obsidian palette (`#08090C`), double-bezel card architecture, and Google Fonts (`Plus Jakarta Sans` & `JetBrains Mono`).
* **Timezone Math:** `date-fns` & `date-fns-tz` anchoring all calendar day, timer, and streak calculations to `Asia/Kolkata`.
* **Database & Auth:** Supabase PostgreSQL with 100% Row Level Security (RLS) policies, private evidence storage (`evidence-vault`), and Google OAuth domain verification.
* **Testing:** `vitest` unit test suite covering all 24 core business rules.
* **Hosting:** Hostinger static web hosting compatible (`dist/` with `public/.htaccess` SPA rewrite rules).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally in Development Mode
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. Run Automated Tests
```bash
npm test
```
Executes all 22 business logic tests verifying:
* Domain eligibility enforcement (`@ds.study.iitm.ac.in`, `@es.study.iitm.ac.in`, `@study.iitm.ac.in`)
* Username validation & 1-change limit
* Authoritative session duration calculations
* Midnight boundary & consecutive streak logic
* Missed-day resets without wiping longest streaks
* Workout targets across standard & partial weeks
* Points engine idempotency & streak milestones

### 4. Build for Hostinger Production
```bash
npm run build
```
Generates the production bundle in `dist/` including `.htaccess` for Hostinger Apache/LiteSpeed web servers.

---

## 🔒 Security & Privacy Features

* **Institutional Domain Gate:** Rejects personal emails (`@gmail.com`) with a friendly, informative message.
* **Zero Public Email Exposure:** Public profiles, leaderboards, and views only expose `@username`, avatar, house, and stats.
* **Server-Authoritative Timing:** Durations are calculated from timestamps; client clocks cannot forge study times.
* **Private Storage:** Uploaded photos are stored in Supabase's private `evidence-vault` bucket and accessible only to authorized coordinators.
* **Audit Trail:** Every administrative correction and evidence review action is logged with actor ID, timestamp, entity, and mandatory reason.

---

## 📁 Key Files & Directories

* [`src/lib/constants.ts`](file:///c:/Winter%20Arc/src/lib/constants.ts): Official challenge parameters, 12 challenge periods, scoring configuration.
* [`src/lib/timezone.ts`](file:///c:/Winter%20Arc/src/lib/timezone.ts): Asia/Kolkata timezone calculations.
* [`src/lib/calculations.ts`](file:///c:/Winter%20Arc/src/lib/calculations.ts): Daily study streaks, workout streaks, mission streaks, and points math.
* [`src/lib/validation.ts`](file:///c:/Winter%20Arc/src/lib/validation.ts): Username, email eligibility, and evidence file validation.
* [`src/lib/database.ts`](file:///c:/Winter%20Arc/src/lib/database.ts): Unified database client with reactive subscriptions and local persistence.
* [`supabase/migrations/20261010000000_winter_arc_initial_schema.sql`](file:///c:/Winter%20Arc/supabase/migrations/20261010000000_winter_arc_initial_schema.sql): Production PostgreSQL schema, RLS, triggers, views, and seed data.
* [`DEPLOYMENT.md`](file:///c:/Winter%20Arc/DEPLOYMENT.md): Detailed Hostinger and Supabase production deployment manual.
