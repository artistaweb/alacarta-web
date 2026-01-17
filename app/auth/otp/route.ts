import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const supabase = await createRouteHandlerClient();


    // Fallback seguro si NEXT_PUBLIC_SITE_URL no existe
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      new URL(request.url).origin;

    const redirectTo = new URL("/auth/callback", baseUrl).toString();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    // Si Supabase devuelve error, vuelve a /login con mensaje
    const url = new URL("/login", request.url);

    if (error) {
      url.searchParams.set("error", error.message);
      return NextResponse.redirect(url);
    }

    url.searchParams.set("sent", "1");
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("OTP route error:", err);
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "Error enviando enlace. Revisa configuración.");
    return NextResponse.redirect(url);
  }
}
