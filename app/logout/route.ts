import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";

export async function GET(request: Request) {
  const supabase = await createRouteHandlerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
