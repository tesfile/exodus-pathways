
import Link from "next/link";
import { AccountingHeader } from "@/components/portal/accounting-records";
import { getClientOptions } from "@/lib/accounting/data";
import { requireRole } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { archiveClient, restoreClient, deleteArchivedClient } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; error?: string; saved?: string }>;
}) {
  await requireRole(["admin"]);

  const params = await searchParams;
  const archivedView = params.view === "archived";
  const clients = await getClientOptions();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error("Supabase staging configuration is missing.");
  }

  const db = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: archived, error } = await db
    .from("archived_clients")
    .select("client_id");

  if (error) {
    throw new Error(`Unable to load archive records: ${error.message}`);
  }

  const archivedIds = new Set(
    (archived ?? []).map((item) => item.client_id)
  );

  const visibleClients = clients.filter((client) =>
    archivedView
      ? archivedIds.has(client.id)
      : !archivedIds.has(client.id)
  );

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title={archivedView ? "Archived Clients" : "All Clients"}
        description="Manage client profiles and linked company records."
      />

      {params.saved === "1" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
          {params.saved === "deleted" ? "Archived client and linked records deleted." : "Client information saved successfully."}
        </div>
      )}

      {params.error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Deletion failed. Check that the staging SQL setup is installed and that no unsupported database dependencies remain.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Link
            href="/admin/clients"
            className={`rounded-lg px-4 py-2 font-semibold ${
              !archivedView
                ? "bg-blue-900 text-white"
                : "border bg-white text-blue-900"
            }`}
          >
            Active Clients
          </Link>

          <Link
            href="/admin/clients?view=archived"
            className={`rounded-lg px-4 py-2 font-semibold ${
              archivedView
                ? "bg-blue-900 text-white"
                : "border bg-white text-blue-900"
            }`}
          >
            Archived Clients
          </Link>
        </div>

        <Link
          href="/admin/clients/new"
          className="rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white hover:bg-blue-800"
        >
          + Add Client
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b bg-amber-50 px-5 py-4">
          <h2 className="text-lg font-bold text-blue-950">
            {archivedView ? "Archived Clients" : "Clients"}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-50 text-blue-950">
              <tr>
                <th className="px-4 py-4">CLIENT</th>
                <th className="px-4 py-4">OWNER</th>
                <th className="px-4 py-4">EMAIL</th>
                <th className="px-4 py-4">STATUS</th>
                <th className="px-4 py-4">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {visibleClients.map((client) => (
                <tr key={client.id} className="border-t">
                  <td className="px-4 py-4 font-bold text-blue-900">
                    {client.companyName}
                  </td>
                  <td className="px-4 py-4">{client.name}</td>
                  <td className="px-4 py-4">{client.email}</td>
                  <td className="px-4 py-4">
                    {archivedView ? "Archived" : "Active"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-semibold text-blue-800 hover:underline"
                      >
                        View
                      </Link>

                      {!archivedView && (
                        <Link
                          href={`/admin/clients/${client.id}/edit`}
                          className="font-semibold text-blue-800 hover:underline"
                        >
                          Edit
                        </Link>
                      )}

                      {archivedView ? (
                        <form action={restoreClient}>
                          <input type="hidden" name="client_id" value={client.id} />
                          <button
                            type="submit"
                            className="font-semibold text-green-700 hover:underline"
                          >
                            Restore
                          </button>
                        </form>
                      ) : (
                        <form action={archiveClient}>
                          <input type="hidden" name="client_id" value={client.id} />
                          <button
                            type="submit"
                            className="font-semibold text-red-700 hover:underline"
                            title="Preserves accounting records"
                          >
                            Archive
                          </button>
                        </form>
                      )}
                      {archivedView && (
                        <form action={deleteArchivedClient} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="client_id" value={client.id} />
                          <input name="confirm_delete" aria-label="Type DELETE PERMANENTLY to confirm" placeholder="DELETE PERMANENTLY" pattern="DELETE PERMANENTLY" required className="w-48 rounded border px-2 py-1" />
                          <button type="submit" className="font-semibold text-red-700 hover:underline">Delete Permanently</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleClients.length === 0 && (
            <p className="p-8 text-center text-gray-500">
              No clients found in this category.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
