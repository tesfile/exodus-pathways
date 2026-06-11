import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export async function createPrivateSignedDownloadUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 300
) {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds, {
      download: true
    });

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
