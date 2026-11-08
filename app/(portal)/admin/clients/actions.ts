
"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error("Supabase staging configuration missing.");
  }

  return createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function clientIdFrom(form: FormData) {
  const id = String(form.get("client_id") ?? "");

  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) {
    throw new Error("Invalid client ID.");
  }

  return id;
}

export async function archiveClient(form: FormData) {
  const admin = await requireRole(["admin"]);
  const clientId = clientIdFrom(form);
  const db = adminDb();

  if (clientId === admin.id) {
    throw new Error("You cannot archive your own admin account.");
  }

  const { data: client, error: clientError } = await db
    .from("users")
    .select("id,role")
    .eq("id", clientId)
    .single();

  if (clientError || !client || client.role !== "client") {
    throw new Error("Client not found.");
  }

  const { error } = await db.from("archived_clients").upsert(
    {
      client_id: clientId,
      archived_by: admin.id,
    },
    { onConflict: "client_id" }
  );

  if (error) {
    console.error("Archive client error:", error);
    redirect("/admin/clients?error=archive");
  }

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function restoreClient(form: FormData) {
  await requireRole(["admin"]);

  const clientId = clientIdFrom(form);
  const db = adminDb();

  const { error } = await db
    .from("archived_clients")
    .delete()
    .eq("client_id", clientId);

  if (error) {
    console.error("Restore client error:", error);
    redirect("/admin/clients?view=archived&error=restore");
  }

  revalidatePath("/admin/clients");
  redirect("/admin/clients?view=archived");
}
