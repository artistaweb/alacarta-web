# PROJECT BRIEF — A la Carta (Alacarta Web)

This document is the **single source of truth** for this project.
Any code generation tool (Codex, assistants, agents) **MUST READ THIS FILE FIRST**
before creating or modifying any code.

---

## Project Overview
- Product: **A la Carta** — Guía Gastronómica (PR)
- Type:
  - Public-facing website (SEO friendly)
  - Internal **Admin / Data Entry** (protected)
- Stack:
  - Next.js **16.1.x**
  - App Router (ONLY under `/app`)
  - Tailwind CSS
  - shadcn/ui
  - Supabase (PostgreSQL + RLS + Storage)
  - Vercel (production)
  - pnpm
- Local OS: Linux (Pop!_OS)

---

## Routing Rules (CRITICAL)
- The ONLY router in use is **App Router** under `/app`
- **DO NOT** use `src/app`
- **DO NOT** create Pages Router files

---

## Routes — Current (Implemented)

### Public
- `/` → Home
- `/explorar` → Restaurant listing
- `/r/[slug]` → Restaurant detail (dynamic)

### Auth (Email OTP / Magic Link)
- `/login` → Admin login page (OTP request UI)
- `/auth/otp` → POST route handler (send OTP)
- `/auth/callback` → GET route handler (exchange code → session → redirect)

### Session
- `/logout` → Route handler that signs out and redirects (currently implemented as GET)

### Admin (Protected)
- `/admin/restaurants` → Admin listing
- `/admin/restaurants/new` → Create restaurant (initial)
- **Planned next:** `/admin/restaurants/[id]` → Full editor by **UUID** (NOT slug)

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

  /login
    page.tsx
  /auth
    /otp
      route.ts
    /callback
      route.ts
  /logout
    route.ts
  /admin
    /restaurants
      page.tsx
      /new
        page.tsx
      /[id]
        page.tsx (may exist as placeholder; full editor is planned)

/components
  /ui (shadcn)
    input.tsx
    label.tsx
    select.tsx
    table.tsx
    textarea.tsx
  /restaurant
    SimilarRestaurants.tsx

/lib
  slug.ts
  /supabase
    browser.ts        (browser client helper)
    server.ts         (server component client helper)
    route.ts          (route handler client helper)

---

## Supabase Rules (MANDATORY)

### Supabase Client Pattern
This project uses **@supabase/ssr** helpers (NOT Pages Router patterns).

- Server Components:
  - Use `createServerComponentClient` (wrapper in `@/lib/supabase/server`)
  - Must use async cookies: `await cookies()`

- Route Handlers:
  - Use `createRouteHandlerClient` (wrapper in `@/lib/supabase/route`)
  - Must use async cookies: `await cookies()`

- Client Components:
  - Use browser client wrapper in `@/lib/supabase/browser`

**Do not create new Supabase clients ad-hoc**. Always import from `/lib/supabase/*`.

### Security
- RLS is **ENABLED**
- Frontend uses **anon key only**
- **NEVER** use service_role keys in frontend, route handlers, or client code
- Admin write access is enforced via:
  - `profiles.role = 'admin'`
  - RLS policies per table

---

## Storage (Supabase)

### Bucket(s)
- Primary bucket: `restaurant-images` (public)

### Current usage
- `restaurants.cover_url` stores the **public URL** of the uploaded cover image.

### Next planned
- Gallery images (max 6) stored in the same bucket under a gallery path.
- Images should be **optimized before upload**:
  - Convert to **webp**
  - Resize to recommended max dimensions
  - Reduce file size for fast loading

---

## Next.js Images (IMPORTANT)
`next/image` is enabled. External hosts MUST be allowed in `next.config.ts`.

Currently allowed:
- `picsum.photos`
- Supabase project host: `*.supabase.co` or the specific project host

If images do not render, confirm:
- `remotePatterns` includes the Supabase host + pathname `/storage/v1/object/public/**`
- Dev server restarted after config change

---

## Database Tables (Confirmed — Current Schema)

### restaurants
- id (uuid)
- name (text)
- slug (text, unique)
- description (text)
- phone (text)
- website (text)
- price_level (int4)
- status (text) — e.g. `published`, `draft`
- cover_url (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### locations
- id (uuid)
- restaurant_id (uuid FK → restaurants.id)
- address (text)
- municipio (text)
- zone (text)
- lat (float8)
- lng (float8)
- is_primary (bool)
- created_at (timestamptz)

### restaurant_hours
- restaurant_id (uuid FK → restaurants.id)
- day_of_week (int2) (0=Sun .. 6=Sat)
- opens_at (time)
- closes_at (time)
- is_closed (bool)

### categories
- id (uuid)
- name (text)
- slug (text)

### restaurant_categories
- restaurant_id (uuid FK → restaurants.id)
- category_id (uuid FK → categories.id)

### profiles
- id (uuid FK → auth.users.id)
- role (text) — `admin`, `user`
- created_at (timestamptz)

---

## Admin & Auth (MVP)

### Authentication
- Supabase Auth
- **Email OTP / Magic Link**
- No passwords stored
- Redirect flow:
  - `/login` → send OTP
  - `/auth/callback` → exchange code → session → redirect to `/admin/restaurants`

### Admin Protection
All `/admin/*` routes must:
- Require authenticated user
- Require `profiles.role === 'admin'`
- Redirect unauthenticated users to `/login`
- Redirect non-admin users to `/`

---

## Admin Data Entry Flow (Current + Next)

### Current
- Admin can:
  - View restaurant list
  - Create a new restaurant (stores in `restaurants`)

### Next (Editor at `/admin/restaurants/[id]`)
When saving a restaurant in Admin:
1. Update `restaurants` base fields
2. Upsert **primary** `locations` record (`is_primary = true`)
3. Upsert 7 rows in `restaurant_hours`
4. Manage categories via `restaurant_categories`
5. Upload cover image to `restaurant-images` and store public URL in `restaurants.cover_url`
6. (Phase) Gallery images:
   - Max 6 images per restaurant
   - Store public URLs and ordering
   - Allow delete/reorder

---

## Image Guidelines (Content Rules)
### Cover Image (Required)
- Instruction to user/admin:
  - “Sube una foto del **plato estrella** o bebida icónica del restaurante.”
  - “Evita fotos de estructuras, fachadas, rótulos o logos.”

### Gallery Images (Optional)
- Maximum: **6**
- Focus: food, ambience, signature items

### Optimization Requirements (Preferred)
- Convert to **webp**
- Resize down to recommended max dimensions (mobile-first)
- Prioritize fast loading

---

## Time & Locale Rules (Puerto Rico)
- Display times in **12-hour format (AM/PM)**
- Internally store times in DB as `time` (24h)
- Timezone: `America/Puerto_Rico`
- Show:
  - Abierto / Cerrado
  - Horario hoy
  - Tooltip “Ver horario semanal”

---

## Environment Variables & Secrets

### Local Development
- Secrets stored in **1Password Vault**
- `.env.local` contains **op:// references**
- Run locally using:
```bash
op run --env-file=.env.local -- pnpm dev

Production

Environment variables stored in Vercel

Required vars:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

NEXT_PUBLIC_SITE_URL

Never commit secrets.

UI / UX Rules

Tailwind CSS only

shadcn/ui components

Dark / Light mode already implemented — DO NOT reimplement

Clean, modern, mobile-first

No ratings or reviews in MVP

Dynamic Route Params (Next 16)

params may be a Promise.
Always unwrap like:

type PageProps = {
  params: Promise<{ id: string }>;
};

const { id } = await params;

Code Generation Rules (MANDATORY)

Always read PROJECT_BRIEF.md first

Never assume planned files already exist

Return full file contents, not diffs

Do not modify unrelated files

Prefer clarity over clever abstractions

Keep patterns consistent with /lib/supabase/* wrappers and @supabase/ssr usage

Current Phase Goal (Right Now)

Finish Admin editor /admin/restaurants/[id]

Implement cover upload + optimization + storage path rules

Implement gallery (max 6) + upload/optimize + delete/reorder

Ensure RLS stays tight and public site UX remains intact