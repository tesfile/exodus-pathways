
"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

function value(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function fail(code: string, message?: string): never {
  const params = new URLSearchParams({ error: code });

  // Only expose a short, sanitized error message.
  if (message) {
    params.set("reason", message.slice(0, 200));
  }

  redirect(`/admin/clients/new?${params.toString()}`);
}

export async function saveClient(form: FormData) {
  const admin = await requireRole(["admin"]);

  const fullName = value(form, "full_name");
  const email = value(form, "client_email").toLowerCase();
  const legalName = value(form, "legal_name");

  if (!fullName || !email || !legalName) {
    fail("required");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    fail("config");
  }

  const supabase = createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Create the client account without sending an email.
  // The password is random and is never displayed or sent.
  const password = randomBytes(48).toString("base64url");

  const { data: created, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
      },
    });

  if (authError || !created.user) {
    console.error("Client account error:", {
      message: authError?.message,
      code: authError?.code,
      status: authError?.status,
    });

    fail(
      "account",
      authError?.message ?? "Supabase did not return a user"
    );
  }

  const clientId = created.user.id;

  const { error: profileError } = await supabase
    .from("users")
    .upsert(
      {
        id: clientId,
        email,
        full_name: fullName,
        phone: value(form, "client_phone") || null,
        role: "client",
        invited_by: admin.id,
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("Client profile error:", profileError);

    fail("profile", profileError.message);
  }

  const { error: companyError } = await supabase
    .from("companies")
    .insert({
      client_id: clientId,
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
    });

  if (companyError) {
    console.error("Company save error:", companyError);

    fail("company", companyError.message);
  }

  revalidatePath("/admin/clients");
  redirect("/admin/clients?created=1");
}
