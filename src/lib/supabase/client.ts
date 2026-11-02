import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { authCookieOptions, REMEMBER_ME_COOKIE } from "@/lib/supabase/session";

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => parseCookieHeader(document.cookie),
      setAll: (cookies) => {
        const rememberMe = parseCookieHeader(document.cookie).some((cookie) => cookie.name === REMEMBER_ME_COOKIE && cookie.value === "1");
        cookies.forEach(({ name, value, options }) => {
          document.cookie = serializeCookieHeader(name, value, authCookieOptions(options, rememberMe));
        });
      },
    },
  });
}
