import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { authCookieOptions, REMEMBER_ME_COOKIE } from "@/lib/supabase/session";

export async function createClient(rememberPreference?: boolean) {
  const cookieStore = await cookies();
  const rememberMe = rememberPreference ?? cookieStore.get(REMEMBER_ME_COOKIE)?.value === "1";
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: (values) => {
      try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, authCookieOptions(options, rememberMe))); } catch { /* Server Components tidak dapat menulis cookie. */ }
    } },
  });
}
