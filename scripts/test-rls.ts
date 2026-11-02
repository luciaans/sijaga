import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const credentials = [
  { username: process.env.TEST_USTAZ_A_USERNAME, password: process.env.TEST_USTAZ_A_PASSWORD },
  { username: process.env.TEST_USTAZ_B_USERNAME, password: process.env.TEST_USTAZ_B_PASSWORD },
];

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
async function main() {
  assert(url && anonKey, "Isi URL Supabase dan anon key pada .env.local.");
  assert(credentials.every((entry) => entry.username && entry.password), "Isi TEST_USTAZ_A/B_USERNAME dan TEST_USTAZ_A/B_PASSWORD pada .env.local.");
  const clients = credentials.map(() => createClient(url, anonKey, { auth: { persistSession: false } }));
  for (let index = 0; index < clients.length; index += 1) {
    const credential = credentials[index];
    assert(credential.username && credential.password, "Kredensial akun uji belum lengkap.");
    const { error } = await clients[index].auth.signInWithPassword({ email: `${credential.username}@sijaga.local`, password: credential.password });
    assert(!error, `Login akun uji ${index === 0 ? "A" : "B"} gagal.`);
  }
  const [a, b] = clients;
  const [{ data: profileAData }, { data: profileBData }] = await Promise.all([
    a.from("profiles").select("id,role,is_active").eq("username", credentials[0].username).single(),
    b.from("profiles").select("id,role,is_active").eq("username", credentials[1].username).single(),
  ]);
  assert(profileAData?.role === "ustaz" && profileAData.is_active, "Akun A harus ustaz aktif.");
  assert(profileBData?.role === "ustaz" && profileBData.is_active, "Akun B harus ustaz aktif.");
  const [{ data: reportsA }, { data: reportsB }] = await Promise.all([
    a.from("pelanggaran").select("id,reporter_id").eq("reporter_id", profileAData.id).limit(1),
    b.from("pelanggaran").select("id,reporter_id").eq("reporter_id", profileBData.id).limit(1),
  ]);
  const reportB = reportsB?.[0];
  assert(reportB, "Buat minimal satu laporan dengan akun B untuk menguji isolasi pemilik.");
  const { data: visibleB } = await a.from("pelanggaran").select("id").eq("id", reportB.id).maybeSingle();
  assert(visibleB?.id === reportB.id, "Ustaz A harus dapat melihat laporan Ustaz B.");
  const { data: changedRows, error: changeError } = await a.from("pelanggaran").update({ description: "Uji perubahan lintas pemilik" }).eq("id", reportB.id).select("id");
  assert(!changeError && changedRows?.length === 0, "Ustaz A tidak boleh mengubah laporan B.");
  const { data: deletedRows, error: deleteError } = await a.from("pelanggaran").delete().eq("id", reportB.id).select("id");
  assert(!deleteError && deletedRows?.length === 0, "Ustaz A tidak boleh menghapus laporan B.");
  const reportA = reportsA?.[0];
  if (reportA) {
    const { error } = await a.from("pelanggaran").update({ reporter_id: profileBData.id }).eq("id", reportA.id);
    assert(Boolean(error), "Ustaz A tidak boleh mengubah reporter_id.");
  } else console.warn("Lewati uji reporter_id: akun A belum memiliki laporan.");
  const { data: roleRows, error: roleError } = await a.from("profiles").update({ role: "admin" }).eq("id", profileAData.id).select("id");
  assert(!roleError && roleRows?.length === 0, "Ustaz tidak boleh mengubah role profil.");
  console.log("Uji RLS berhasil: baca lintas ustaz diizinkan; edit, hapus, reporter_id, dan role dilindungi.");
}

main().catch((error: unknown) => { console.error("Uji RLS gagal:", error instanceof Error ? error.message : error); process.exitCode = 1; });
