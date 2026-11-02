import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions, REMEMBER_ME_COOKIE } from "@/lib/supabase/session";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const rememberMe = request.cookies.get(REMEMBER_ME_COOKIE)?.value === "1";
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll(cookies) {
      cookies.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, authCookieOptions(options, rememberMe)));
    } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const protectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/pelanggaran") || pathname.startsWith("/rekap") || pathname.startsWith("/santri") || pathname.startsWith("/admin");
  if (protectedRoute) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    const { data: profile } = await supabase.from("profiles").select("role,is_active,deleted_at").eq("auth_user_id", user.id).maybeSingle();
    if (!profile || !profile.is_active || profile.deleted_at) {
      await supabase.auth.signOut();
      const redirect = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
    if (pathname.startsWith("/admin") && profile.role !== "admin") return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}
