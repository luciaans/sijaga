import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_ME_COOKIE = "sijaga-remember-me";
export const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;

export function authCookieOptions(options: CookieOptions, rememberMe: boolean): CookieOptions {
  if (options.maxAge === 0) return options;
  return { ...options, maxAge: rememberMe ? REMEMBER_ME_MAX_AGE : undefined };
}
