#!/usr/bin/env bash
set -e

echo "🔐 Loading Supabase env vars from 1Password..."
export NEXT_PUBLIC_SUPABASE_URL="$(op read 'op://Alacarta-Prod/Supabase.Alacarta.Prod/SUPABASE_URL')"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$(op read 'op://Alacarta-Prod/Supabase.Alacarta.Prod/SUPABASE_PUBLISHABLE_KEY')"

echo "🚀 Starting Next.js..."
pnpm dev
