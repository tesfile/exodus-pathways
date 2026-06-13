import { PublicHomePage } from "@/components/public/public-home-page";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PublicServicePost } from "@/lib/types";

async function getPublishedPosts(): Promise<PublicServicePost[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("public_service_posts")
      .select("id,title,category,service_type,language,translation_key,content,is_published,published_at,created_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(24);

    return (data ?? []) as PublicServicePost[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const posts = await getPublishedPosts();
  return <PublicHomePage posts={posts} />;
}
