import "server-only";
import { PHOTO_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function createSignedPhotoUrl(path: string | null, expiresIn = 300): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, expiresIn);
  return error ? null : data.signedUrl;
}
