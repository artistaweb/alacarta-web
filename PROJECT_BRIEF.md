
# PROJECT BRIEF — A la Carta (Alacarta Web)

This document is the **single source of truth** for this project.
Any code generation tool (Codex, assistants, agents) **MUST READ THIS FILE FIRST**
before creating or modifying any code.

---

## Project Overview
- Product: **A la Carta** — Guía Gastronómica
- Type:
  - Public-facing website (SEO friendly)
  - Internal **Admin / Data Entry** (protected)
- Stack:
  - Next.js **16.1.x**
  - App Router (ONLY under `/app`)
  - Tailwind CSS
  - shadcn/ui
  - Supabase (PostgreSQL + RLS)
  - Vercel (production)
  - pnpm
- Local OS: Linux (Pop!_OS)

---

## Routing Rules (CRITICAL)
- The ONLY router in use is **App Router** under `/app`
- **DO NOT** use `src/app`
- **DO NOT** create Pages Router files

---

## Routes — Current (Already Implemented)
Public:
- `/` → Home
- `/explorar` → Restaurant listing
- `/r/[slug]` → Restaurant detail (dynamic)

---

## Routes — Planned (To Be Created by Codex)

### Auth (Email OTP / Magic Link)
- `/login` → Admin login page
- `/auth/otp` → POST route handler (send OTP)
- `/auth/callback` → GET route handler (exchange code → session → redirect)

### Admin (Protected)
- `/admin` → Layout guard (auth + role)
- `/admin/restaurants` → Admin listing
- `/admin/restaurants/new` → Create restaurant
- `/admin/restaurants/[id]` → Edit restaurant by **UUID** (NOT slug)

---

## File Structure

### Current (Exists in Repo)
/app
  layout.tsx
  page.tsx
  /explorar
    page.tsx
  /r
    /[slug]
      page.tsx

/lib
  supabaseClient.ts

/components
  /ui (shadcn)
  /restaurant
    SimilarRestaurants.tsx

---

### Planned (Created by Codex)
/app
  /login
    page.tsx
    /ui
      LoginForm.tsx
  /auth
    /otp
      route.ts
    /callback
      route.ts
  /admin
    layout.tsx
    /restaurants
      page.tsx
      /new
        page.tsx
      /[id]
        page.tsx

/lib
  /supabase
    server.ts
    route.ts

---

## Supabase Rules

### Client Usage
- Client is located at `/lib/supabaseClient.ts`
- Import as:
```ts
import { supabase } from "@/lib/supabaseClient";
````

### Security

* RLS is **ENABLED**
* Frontend uses **anon key only**
* **NEVER** use service_role keys in frontend or route handlers
* Admin write access is enforced via:

  * `profiles.role = 'admin'`
  * RLS policies

---

## Database Tables (Confirmed)

### restaurants

* id (uuid)
* name
* slug (unique)
* description
* phone
* website
* cover_url
* price_level
* status (`published`, `draft`)
* created_at / updated_at

### locations

* id
* restaurant_id (FK)
* address
* municipio
* zone
* lat
* lng
* is_primary

### restaurant_hours

* restaurant_id (FK)
* day_of_week (0=Sun .. 6=Sat)
* opens_at (time)
* closes_at (time)
* is_closed (boolean)

### categories

* id
* name
* slug

### restaurant_categories

* restaurant_id
* category_id

### profiles

* id (FK to auth.users.id)
* role (`admin`, `user`)
* created_at

---

## Admin & Auth (MVP)

### Authentication

* Supabase Auth
* **Email OTP / Magic Link**
* No passwords stored
* Redirect flow:

  * `/login` → send OTP
  * `/auth/callback` → exchange code → session → `/admin/restaurants`

### Admin Protection

* `/admin/*` routes must:

  * Require authenticated user
  * Require `profiles.role === 'admin'`
  * Redirect unauthenticated users to `/login`
  * Redirect non-admin users to `/`

---

## Admin Data Entry Flow

When saving a restaurant in Admin:

1. Upsert `restaurants`
2. Upsert **primary** `locations` record (`is_primary = true`)
3. Upsert 7 rows in `restaurant_hours`
4. (Phase 2) Manage categories via `restaurant_categories`

---

## Time & Locale Rules (Puerto Rico)

* Display times in **12-hour format (AM/PM)**
* Internally store times in DB as `time` (24h)
* Timezone: `America/Puerto_Rico`
* Show:

  * Abierto / Cerrado
  * Horario hoy
  * Tooltip “Ver horario semanal”

---

## Environment Variables & Secrets

### Local Development

* Secrets stored in **1Password Vault**
* `.env.local` contains **op:// references**
* Run locally using:

```bash
op run --env-file=.env.local -- pnpm dev
```

### Production

* Environment variables stored in **Vercel**
* Required vars:

  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `NEXT_PUBLIC_SITE_URL`

Never commit secrets.

---

## UI / UX Rules

* Tailwind CSS only
* shadcn/ui components
* Dark / Light mode already implemented — **DO NOT reimplement**
* Clean, modern, mobile-first
* No ratings or reviews in MVP

---

## Dynamic Route Params (Next 16)

`params` may be a Promise.

Always unwrap like:

```ts
type PageProps = {
  params: Promise<{ id: string }>;
};

const { id } = await params;
```

---

## Code Generation Rules (MANDATORY)

* Always read `PROJECT_BRIEF.md` first
* Never assume planned files already exist
* Return **full file contents**, not diffs
* Do not modify unrelated files
* Prefer clarity over clever abstractions

---

## Current Phase Goal

* Implement **Admin + Auth**
* Secure data entry with RLS
* Keep public UX intact

```

