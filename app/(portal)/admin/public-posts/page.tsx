import { revalidatePath } from "next/cache";
import { FileText, PlusCircle, Trash2 } from "lucide-react";
import { languages } from "@/lib/i18n/types";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

const categories = ["Immigration", "Accounting", "Business", "General"] as const;

type PublicPostCategory = (typeof categories)[number];

type AdminPublicPost = {
  id: string;
  title: string;
  category: PublicPostCategory;
  service_type: string;
  language: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function readCategory(value: FormDataEntryValue | null): PublicPostCategory {
  const category = String(value ?? "");
  return categories.includes(category as PublicPostCategory) ? (category as PublicPostCategory) : "General";
}

function readPostPayload(formData: FormData, existingPublishedAt?: string | null) {
  const isPublished = formData.get("isPublished") === "on";

  return {
    title: String(formData.get("title") ?? "").trim(),
    category: readCategory(formData.get("category")),
    service_type: String(formData.get("serviceType") ?? "").trim() || "General",
    language: String(formData.get("language") ?? "en"),
    content: String(formData.get("content") ?? "").trim(),
    is_published: isPublished,
    published_at: isPublished ? existingPublishedAt || new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };
}

async function createPostAction(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const payload = readPostPayload(formData);

  if (!payload.title || !payload.content) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("public_service_posts").insert({
    ...payload,
    created_by: admin.id
  });

  revalidatePath("/");
  revalidatePath("/admin/public-posts");
}

async function updatePostAction(formData: FormData) {
  "use server";

  await requireRole(["admin"]);
  const postId = String(formData.get("postId") ?? "");
  const existingPublishedAt = String(formData.get("publishedAt") ?? "") || null;
  const payload = readPostPayload(formData, existingPublishedAt);

  if (!postId || !payload.title || !payload.content) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("public_service_posts").update(payload).eq("id", postId);

  revalidatePath("/");
  revalidatePath("/admin/public-posts");
}

async function deletePostAction(formData: FormData) {
  "use server";

  await requireRole(["admin"]);
  const postId = String(formData.get("postId") ?? "");

  if (!postId) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("public_service_posts").delete().eq("id", postId);

  revalidatePath("/");
  revalidatePath("/admin/public-posts");
}

async function getPosts() {
  await requireRole(["admin"]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("public_service_posts")
    .select("id,title,category,service_type,language,content,is_published,published_at,created_at,updated_at")
    .order("created_at", { ascending: false });

  return (data ?? []) as AdminPublicPost[];
}

export default async function PublicPostsPage() {
  const posts = await getPosts();

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Public website</p>
        <h1 className="mt-2 text-3xl font-black text-exodus-navy">Public Posts</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-exodus-slate">
          Create service explanations and homepage updates by language. Published posts appear on the public homepage under Latest Updates.
        </p>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <PlusCircle className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
          <h2 className="text-lg font-black text-exodus-navy">Create Post</h2>
        </div>
        <form action={createPostAction} className="mt-5 grid gap-4">
          <PostFields />
          <button type="submit" className="focus-ring min-h-12 rounded-md bg-exodus-navy px-5 text-sm font-black text-white">
            Save Post
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-black text-exodus-navy">Manage Posts</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">Edit, publish, unpublish, or delete public service content.</p>
        </div>

        {posts.length > 0 ? (
          posts.map((post) => (
            <article key={post.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-exodus-light px-3 py-1 text-xs font-black text-exodus-navy">{post.category}</span>
                <span className="rounded-md bg-exodus-light px-3 py-1 text-xs font-black text-exodus-navy">{post.service_type}</span>
                <span className="rounded-md bg-exodus-light px-3 py-1 text-xs font-black text-exodus-navy">{post.language.toUpperCase()}</span>
                <span className={post.is_published ? "rounded-md bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700" : "rounded-md bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"}>
                  {post.is_published ? "Published" : "Draft"}
                </span>
              </div>

              <form action={updatePostAction} className="grid gap-4">
                <input type="hidden" name="postId" value={post.id} />
                <input type="hidden" name="publishedAt" value={post.published_at ?? ""} />
                <PostFields post={post} />
                <div className="grid gap-3 sm:flex">
                  <button type="submit" className="focus-ring min-h-12 rounded-md bg-exodus-navy px-5 text-sm font-black text-white">
                    Save Changes
                  </button>
                  <button
                    type="submit"
                    formAction={deletePostAction}
                    formNoValidate
                    className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-red-200 px-5 text-sm font-black text-red-700"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </form>
            </article>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-bold text-exodus-slate">
            No public posts have been created yet.
          </div>
        )}
      </section>
    </div>
  );
}

function PostFields({ post }: { post?: AdminPublicPost }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">Title</span>
          <input name="title" required className="field" defaultValue={post?.title ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="label">Service type</span>
          <input name="serviceType" required className="field" defaultValue={post?.service_type ?? ""} placeholder="Study Permit, Personal Tax, GST" />
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <label className="grid gap-2">
          <span className="label">Category</span>
          <select name="category" className="field" defaultValue={post?.category ?? "General"}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Language</span>
          <select name="language" className="field" defaultValue={post?.language ?? "en"}>
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-md bg-exodus-light px-4 py-3 text-sm font-black text-exodus-navy">
          <input name="isPublished" type="checkbox" defaultChecked={post?.is_published ?? false} className="h-4 w-4 accent-exodus-gold" />
          Published
        </label>
      </div>
      <label className="grid gap-2">
        <span className="label">Content</span>
        <textarea name="content" required rows={6} className="field resize-y" defaultValue={post?.content ?? ""} />
      </label>
      <div className="flex items-center gap-2 rounded-md bg-exodus-light p-3 text-xs font-bold text-exodus-slate">
        <FileText className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
        Homepage readers only see posts that are marked Published.
      </div>
    </>
  );
}
