# PROJECT BRIEF — Alacarta Web (MVP)

This document defines the **non-negotiable technical context** for this project.
Any code generated must strictly follow these rules.

---

## Project Overview
- Product: **A la Carta** (Guía Gastronómica)
- Type: Public-facing web app (SEO-friendly)
- Stack:
  - Next.js **16.1.2**
  - App Router
  - Tailwind CSS
  - Supabase (PostgreSQL + RLS)
  - Vercel (production)
  - pnpm
- OS (local dev): Linux (Pop!_OS)

---

## Routing Rules (VERY IMPORTANT)
- The **only active App Router** is located at:
/app

markdown
Copiar código
- **DO NOT** use or reference `src/app`.
- All routes must live under `/app`.

### Current Routes
- `/` → Home
- `/explorar` → Restaurant listing
- `/r/[slug]` → Restaurant detail (dynamic)

---
## Existing Layout Constraints
- `app/layout.tsx` already exists and uses:
  - `next/font/google` (Geist, Geist_Mono)
  - `import "./globals.css"`
- Do not remove Geist fonts or globals.css import.
- Only extend layout by adding:
  - Header component
  - dark-theme base classes
  - metadata update
  - set html lang="es"


## File Structure (Current)
/app
/explorar
page.tsx
/r
/[slug]
page.tsx
layout.tsx ← exists and must be respected
page.tsx

/lib
supabaseClient.ts

/components
(to be created if needed)

/public

yaml
Copiar código

---

## Supabase Rules
- Supabase client is located at:
/lib/supabaseClient.ts

python
Copiar código
- Import it as:
```ts
import { supabase } from "@/lib/supabaseClient";
Database Tables
restaurants

id (uuid)

name

slug (unique)

description

price_level

status (published/draft)

locations

restaurant_id

address

municipio

zone

is_primary (boolean)

Security
Row Level Security (RLS) is ENABLED.

Frontend uses publishable / anon key only.

Never reference service_role keys in frontend code.

Dynamic Route Params (CRITICAL)
In Next.js 16.1.x:

params may be a Promise

Always unwrap it like this:

ts
Copiar código
type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
}
Environment Variables
Used in frontend:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

Never hardcode secrets.

UI / UX Guidelines
Use Tailwind CSS only (no CSS files).

Dark theme friendly.

Clean, minimal, modern UI.

Prefer reusable components.

Mobile-first, responsive.

Code Generation Rules (MANDATORY)
When generating code:

Return full file contents, not partial diffs.

Do NOT modify unrelated files.

Do NOT create duplicate routers.

One feature = one focused change.

Prefer clarity over cleverness.

Goal of Current Phase
Polish UX

Header with navigation

Card-based listing in /explorar

Clickable cards with hover

Skeleton loaders using App Router conventions
