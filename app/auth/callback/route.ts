import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createRouteHandlerClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const back = new URL("/login", request.url);
    back.searchParams.set("error", error.message);
    return NextResponse.redirect(back);
  }

  return NextResponse.redirect(new URL("/admin/restaurants", request.url));
}
