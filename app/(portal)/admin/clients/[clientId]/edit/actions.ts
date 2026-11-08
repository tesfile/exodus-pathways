
"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function updateClient(form: FormData) {
  await requireRole(["admin"]);

  const clientId = value(form, "client_id");
  const fullName = value(form, "full_name");
  const legalName = value(form, "legal_name");

  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(clientId)) {
    throw new Error("Invalid client ID.");
  }

  if (!fullName || !legalName) {
    redirect(`/admin/clients/${clientId}/edit?error=required`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error("Supabase staging configuration missing.");
  }

  const db = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: client, error: clientError } = await db
    .from("users")
    .select("id,role")
    .eq("id", clientId)
    .single();

  if (clientError || !client || client.role !== "client") {
    throw new Error("Client not found.");
  }

  const { data: archived, error: archiveError } = await db
    .from("archived_clients")
    .select("client_id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (archiveError || archived) {
    throw new Error("Archived clients cannot be edited.");
  }

  const { error: userError } = await db
    .from("users")
    .update({
      full_name: fullName,
      phone: value(form, "client_phone") || null,
    })
    .eq("id", clientId);

  if (userError) {
    console.error("Update client profile error:", userError);
    redirect(`/admin/clients/${clientId}/edit?error=profile`);
  }

  const companyValues = {
    legal_name: legalName,
    trade_name: value(form, "trade_name") || null,
    business_number: value(form, "business_number") || null,
    gst_hst_number: value(form, "gst_hst_number") || null,
    corporation_number: value(form, "corporation_number") || null,
    phone: value(form, "phone") || null,
    email: value(form, "email") || null,
    contact_person: value(form, "contact_person") || null,
    address: value(form, "address") || null,
    province: value(form, "province") || null,
  };

  const { data: existingCompany, error: lookupError } = await db
    .from("companies")
    .select("id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("Company lookup error:", lookupError);
    redirect(`/admin/clients/${clientId}/edit?error=company`);
  }

  const { error: companyError } = existingCompany
    ? await db
        .from("companies")
        .update(companyValues)
        .eq("id", existingCompany.id)
        .eq("client_id", clientId)
    : await db
        .from("companies")
        .insert({
          client_id: clientId,
          ...companyValues,
        });

  if (companyError) {
    console.error("Update company error:", companyError);
    redirect(`/admin/clients/${clientId}/edit?error=company`);
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect("/admin/clients?saved=1");
}
