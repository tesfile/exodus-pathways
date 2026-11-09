
import { saveClient } from "./actions";
import Link from "next/link";

const fields = [
  ["Client Full Name", "full_name"],
  ["Client Email", "client_email"],
  ["Client Telephone", "client_phone"],
  ["Company Legal Name", "legal_name"],
  ["Trade Name", "trade_name"],
  ["CRA Business Number", "business_number"],
  ["GST/HST Number", "gst_hst_number"],
  ["Corporation Number", "corporation_number"],
  ["Company Telephone", "phone"],
  ["Company Email", "email"],
  ["Contact Person", "contact_person"],
  ["Business Address", "address"],
  ["Province", "province"],
];

const errorMessages: Record<string, string> = {
  required:
    "Please enter the client name, email and company legal name.",
  config:
    "Supabase staging configuration is missing.",
  account:
    "Supabase could not create the client account.",
  profile:
    "The account was created, but the client profile could not be saved. Do not submit again yet.",
  company:
    "The account was created, but company information could not be saved. Do not submit again yet.",
};

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    reason?: string;
  }>;
}) {
  const params = await searchParams;

  const error = params.error
    ? errorMessages[params.error] ??
      "An unexpected error occurred."
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/clients"
          className="text-blue-800 hover:underline"
        >
          ← Back to All Clients
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-blue-950">
          Add New Client
        </h1>

        <p className="text-gray-600">
          Register a client and their company information.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800"
        >
          <p className="font-semibold">{error}</p>

          {params.reason && (
            <p className="mt-2 text-sm">
              Supabase error: {params.reason}
            </p>
          )}
        </div>
      )}

      <form
        action={saveClient}
        className="grid gap-5 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2"
      >
        {fields.map(([label, name]) => (
          <label key={name} className="space-y-2">
            <span className="block text-sm font-semibold">
              {label}
            </span>

            <input
              name={name}
              type={name.includes("email") ? "email" : "text"}
              required={[
                "full_name",
                "client_email",
                "legal_name",
              ].includes(name)}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        ))}

        <div className="md:col-span-2 flex items-center justify-between gap-4">
          <button
            type="submit"
            className="rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Save Client
          </button>

          <Link
            href="/admin/clients"
            className="font-medium text-gray-600 hover:text-blue-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
