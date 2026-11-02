import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const inputSchema = z.object({
  username: z.string().min(4).max(30).regex(/^[a-z0-9_]+$/),
  password: z.string().min(8),
  fullName: z.string().trim().min(2).max(120),
});

async function main() {
  const input = inputSchema.parse({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, fullName: process.env.ADMIN_FULL_NAME });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diatur.");
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const email = `${input.username}@sijaga.local`;
  const { data: created, error } = await supabase.auth.admin.createUser({ email, password: input.password, email_confirm: true });
  if (error || !created.user) throw error ?? new Error("Akun Auth gagal dibuat.");
  const { error: profileError } = await supabase.from("profiles").insert({ auth_user_id: created.user.id, username: input.username, full_name: input.fullName, role: "admin" });
  if (profileError) {
    await supabase.auth.admin.deleteUser(created.user.id);
    throw profileError;
  }
  console.log(`Admin ${input.username} berhasil dibuat.`);
}

main().catch((error: unknown) => { console.error("Gagal membuat admin:", error instanceof Error ? error.message : error); process.exitCode = 1; });
