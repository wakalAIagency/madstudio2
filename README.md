# Madstudio Booking Web App

Next.js + Supabase implementation of the Madstudio booking platform. Visitors can browse availability, request studio sessions, and receive email updates. Admins manage availability, approve or decline requests, and monitor bookings from a protected dashboard.

## Features

- **Visitor experience**: live availability with timezone-aware slot display, multi-slot booking form, and confirmation state.
- **Admin dashboard**: credential-based login, booking approvals/declines, weekly availability rules, and exception management.
- **Supabase backend**: schema aligned with the PRD (slots, bookings, availability rules, audit logs) plus server-side utilities for slot generation and booking workflows.
- **Emails**: Resend-backed notifications for request received, approved, and declined (with optional ICS attachment for approvals).
- **Multi-studio ready**: manage a portfolio of studios, each with its own availability, slots, and booking pipeline.

## Tech Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Supabase Postgres
- NextAuth credentials provider
- React Query, React Hook Form, Zod
- Resend (email) + ics (calendar attachments)

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create environment file**

   ```bash
   cp .env.example .env.local
   ```

   Update the variables with your Supabase project keys, admin email settings, and timezone preferences. Email-related keys are optional but recommended for production.

3. **Provision the database**

   Use the SQL in `supabase/schema.sql` to create tables, enums, and helper functions. With the Supabase CLI:

   ```bash
   supabase db push --file supabase/schema.sql
   ```

   Alternatively, run the contents in the Supabase SQL editor.

4. **Seed an admin user**

   Insert an admin account with a bcrypt-hashed password:

   ```sql
   insert into users (email, password_hash, role)
   values (
     'admin@example.com',
     crypt('your-strong-password', gen_salt('bf')),
     'admin'
   );
   ```

   If `pgcrypto` is unavailable for `crypt`, hash locally (e.g., `bcryptjs`) and insert the hash directly.

5. **Run the app**

   ```bash
   npm run dev
   ```

   - Public booking UI: `http://localhost:3000/book`
   - Admin login: `http://localhost:3000/admin/login`
   - The schema seeds a default "Main Studio". Add more studios from the admin dashboard using the studio selector → **Add studio**.

## Environment Variables

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Supabase project URL and anon key (also mirrored to `NEXT_PUBLIC_*`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used by server-side Supabase clients. |
| `NEXTAUTH_SECRET` | Random string used by NextAuth for JWT encryption. |
| `BOOKING_FROM_EMAIL` | Sender address for transactional emails (Resend). |
| `RESEND_API_KEY` | Resend API key; omit to disable email sending. |
| `TIMEZONE` / `NEXT_PUBLIC_TIMEZONE` | Primary timezone (defaults to `Asia/Muscat`). |
| `SLOT_DURATION_MINUTES` | Length of generated slots (default 60). |

## Supabase Notes

- Availability rules drive slot creation. The API auto-generates slots for the next 30 days when new rules are added.
- Helper functions `count_bookings_today` and `count_bookings_this_week` power the admin overview metrics.
- Email and slot workflows use the service role key; keep it server-side only.

## Testing & QA

- `npm run lint` — type-aware linting across the project.
- Manual flows:
  - Submit a booking request and confirm an email is queued (if Resend configured).
  - Approve and decline requests from the admin dashboard and verify slot state updates.
  - Add/remove weekly and exception availability rules and confirm slots refresh.

## Deployment Checklist

- Set all environment variables in the hosting platform (Vercel / Supabase Edge).
- Ensure Resend domain is verified if email notifications are required.
- Import the database schema and seed at least one admin user.
- Configure Supabase RLS policies if the project will be exposed publicly (current schema expects trusted server-side access).
