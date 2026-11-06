<p align="center">
  <img src="public/al-jihad-emblem.png" alt="Al-Jihad Islamic Boarding School emblem" width="72" height="72" />
</p>

<h1 align="center">SIJAGA</h1>

<p align="center"><strong>Student Discipline and Incident Reporting System</strong></p>
<p align="center">A clear, consistent way for Pondok Pesantren Al-Jihad to record and review student discipline.</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App_Router-111111?logo=nextdotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-UI-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Database_and_Auth-3FCF8E?logo=supabase&logoColor=white" />
</p>

SIJAGA is a web application for Pondok Pesantren Al-Jihad. It brings incident reporting, student records, and discipline reports together in one place. The application interface is in Indonesian.

## Features

- **Dashboard** — Review report totals, recorded students, incident categories, monthly trends, and recent activity.
- **Incident reporting** — Record incidents with the student's name, class, date, category, description, and supporting photos.
- **Student records and history** — Search for students and review their summaries and incident history.
- **Report filters** — Filter reports by student name, category, class, reporter, and date range.
- **Reports and summaries** — Review reports and download PDF summaries.
- **Account management** — Manage ustaz/ustazah accounts and review administrator activity.
- **Private photos** — Store photos in private Supabase Storage and serve them with signed URLs.
- **Data security** — Use authentication, role-based access, and Supabase Row Level Security (RLS).

## User roles

- **Administrator** — Manages ustaz/ustazah accounts, reviews reports, views student records, and accesses the audit log.
- **Ustaz/ustazah** — Records reports and views reporting activity according to their account permissions.

## Technology

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase, Recharts, jsPDF, and Zod.

## Getting started

### Requirements

- Node.js and npm
- A Supabase project

### Install dependencies

```bash
git clone https://github.com/luciaans/sijaga.git
cd sijaga
npm install
```

Create a local environment file by copying `.env.example` to `.env.local`, then set the values:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase publishable key (`sb_publishable_...`) or legacy anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase secret key for server-side operations. Keep it secret and never expose it in client code. |
| `ADMIN_USERNAME` | Yes, to create the admin | Username for the first administrator; 4–30 lowercase letters, numbers, or underscores. |
| `ADMIN_PASSWORD` | Yes, to create the admin | Password for the first administrator; at least 8 characters. |
| `ADMIN_FULL_NAME` | Yes, to create the admin | Full name of the first administrator. |
| `TEST_USTAZ_A_USERNAME` and `TEST_USTAZ_A_PASSWORD` | Optional | Test account credentials for `npm run test:rls`. |
| `TEST_USTAZ_B_USERNAME` and `TEST_USTAZ_B_PASSWORD` | Optional | Credentials for the second test account used by `npm run test:rls`. |

Never commit `.env.local` or share the service role key.

### Set up Supabase

1. Create a Supabase project and add its URL and keys to `.env.local`.
2. For a new, empty project, run [`supabase/setup.sql`](supabase/setup.sql) once in the Supabase SQL Editor. Alternatively, run the files in [`supabase/migrations/`](supabase/migrations/) in order. Do not use both methods or rerun the full setup on an active project.
3. Make sure the Email provider is enabled in Supabase Authentication.
4. Create the first administrator account:

   ```bash
   npm run create-admin
   ```

### Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run lint` | Check the code with ESLint. |
| `npx tsc --noEmit` | Check TypeScript types. |
| `npm test` | Run validation schema tests. |
| `npm run test:rls` | Test RLS using two ustaz test accounts. |
| `npm run build` | Create a production build. |
| `npm start` | Run the production build locally. |

For more setup details, see the [installation guide](docs/INSTALASI.md). Never commit `.env.local` or share the service role key.

---

Created by [luciaans](https://github.com/luciaans).

Copyright © 2026 luciaans. All rights reserved.
