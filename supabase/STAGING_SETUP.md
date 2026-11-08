# KAL Accounting & Tax — Staging Setup and Integration Test Plan

This guide is for the separate, empty Supabase staging project `kal-accounting-staging` (ref `riwkjhdehbambuztlcwu`). It must not use the project currently referenced by production `.env.local` (ref `ndvknwejrghmchdzsmrs`). This project was supplied by the user; no staging Auth user, document, or remote schema is created by this guide.

## Safety gates

- The Supabase pricing page lists a Free plan at $0/month (limited project count, database/storage quotas, and inactivity pausing) and Pro starting at $25/month plus applicable compute/usage. Pricing and availability can change; this staging project already exists, so do not create or upgrade projects for this work. Confirm the organization's billing status/quota in the dashboard if needed.
- Never copy production URL/key values into staging. The ignored `.env.staging.local` file is prefilled with the staging URL; paste only the staging public anon/publishable key into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in that file. Do not paste it into chat.
- Do not use `supabase/seed.sql` for this test. It contains fixed demo IDs/data and unrelated legacy records.
- Use synthetic client/company/document details and test-only email inboxes controlled by the test owner.
- Use no real receipts, bank statements, SINs, bank account data, payroll/personnel files, or production client records.
- Keep service-role keys out of browser configuration. Normal browser integration testing only needs the staging public anon/publishable key.

## Fresh staging database migration order

Run each migration exactly once against the **empty staging project**, in this order. The shared `public` schema holds the legacy accounting and staff tables; the `exodus_`-prefixed migration supplies the identity/profile tables consumed by current app auth/middleware. Both are currently needed by the application.

1. `migrations/0001_initial_schema.sql`
2. `migrations/0002_plain_language_portal.sql`
3. `migrations/0003_immigration_case_management_and_auth.sql`
4. `migrations/0004_accounting_records_functionality.sql`
5. `migrations/0005_client_workflow_fixes.sql`
6. `migrations/0006_phase1_stabilization.sql`
7. `migrations/0007_accounting_document_dates.sql`
8. `migrations/0008_t4_slip_workflow.sql`
9. `migrations/0009_personal_tax_and_self_employed.sql`
10. `migrations/0010_guided_onboarding_workers_payments.sql`
11. `migrations/0011_client_friendly_worker_payments.sql`
12. `migrations/0012_simplify_payroll_workers_workflow.sql`
13. `migrations/0013_restore_portal_worker_fields.sql`
14. `migrations/0014_worker_slip_payroll_preparation.sql`
15. `migrations/0015_paystub_pdf_fields.sql`
16. `migrations/0016_client_type_display_name.sql`
17. `migrations/0017_client_simplification_service_posts_expense_classification.sql`
18. `migrations/0018_public_service_posts_general_category.sql`
19. `migrations/0019_public_service_posts_translation_key.sql`
20. `migrations/20260905150000_exodus_foundation.sql`
21. `migrations/20261106150000_document_company_link.sql`

This ordered list is for a **fresh database only**. Never replay it against production or an existing database. First compare applied migration history on the target. For a fresh project, use Supabase SQL Editor/CLI migration tracking with the project migration mechanism; do not assume pasting SQL into the editor records version history automatically.

`20261106150000_document_company_link.sql` adds nullable `public.documents.company_id`, an index over `(client_id, company_id, tax_year)`, a trigger that rejects a company/client mismatch, and an FK using `ON DELETE SET NULL`. It leaves existing documents intact. The UI's company-linked upload writes require this column to exist.

## Project configuration

1. In Supabase Dashboard, verify the `kal-accounting-staging` project reference `riwkjhdehbambuztlcwu` before use. Confirm it is not the production project. No additional project creation is required if this project is the approved isolated staging target.
2. Enable email/password Auth and email verification. Configure `/auth/callback` as an allowed redirect for `http://localhost:3001/auth/callback` (or the chosen local port) and the staging site URL. Do not add/change production URLs for this test.
3. Paste the staging publishable/anon key into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the ignored `.env.staging.local`. Keep production `.env.local` unchanged. Start with `scripts/dev-staging.cmd`; it loads only the staging settings, suppresses production `.env.local` values in that process, and runs on port 3001.
4. Verify the app reports the staging hostname before any Auth or upload test. Do not paste keys into chat or commit the filled file.

## Test identities and role bootstrap

Create four Auth accounts in the staging Auth dashboard with dedicated test-owned email addresses:

| Test identity | Role | Assignment |
|---|---|---|
| `stage-client` | client | Own test profile and one synthetic test company |
| `stage-assigned-staff` | employee | Assigned to `stage-client` |
| `stage-unassigned-staff` | employee | No client assignment |
| `stage-admin` | admin | Admin test user |

Use unique passwords stored in the team's password manager; do not send them through chat. Verify each email through its test inbox.

**Important role split to handle before tests:** signup creates rows in `public.users`/`public.client_profiles`; the app's route/session bootstrap also uses `public.exodus_users`/`public.exodus_client_profiles`. Fresh signups default to client. In the staging SQL Editor, bootstrap the approved test staff roles in **both** identity tables and mirror the assigned staff/client relationship in both profile tables. Set the stage admin explicitly in both role tables. Verify IDs match `auth.users.id`. Do not use the production owner's email or carry production account IDs into staging. The foundation `exodus_ensure_profile()` contains a hardcoded email-based initial-admin rule; do not rely on that rule to grant staging roles. Review it before any future public launch.

The `public.users` role is consulted by legacy accounting RLS functions (`public.is_admin()` and `public.can_access_client()`); `exodus_users.role` is consulted by current application routing. Tests are not meaningful until the role/assignment records are synchronized.

## Auth and access tests

1. Register one synthetic client from `/signup`, verify through the staging email, and confirm the Auth account maps to client-role records in both identity tables.
2. Client login lands in the document-only client portal; directly requesting a staff route must not expose staff content.
3. Assigned employee login reaches employee workspace; unrelated-client queries must return no rows. Unassigned employee must not see the test client's private records/documents. Admin sees the test dataset.
4. Sign out from client, assigned employee, unassigned employee, and admin sessions; verify protected routes redirect to login afterward.
5. Request a password-reset email for the test client, open its staging callback link, set a new password, and verify old/new password behavior. Repeat for staff only if required.
6. Verify registered test accounts cannot self-select or self-promote to staff/admin.

## Private document tests

Use synthetic non-sensitive fixture documents only (one PDF, one image; optionally multiple pages). Do not use real client documents.

1. As client, upload a receipt/general PDF to `client-documents` using the test client's own UUID path. Choose a test company and tax year.
2. Confirm one `public.documents` row with correct `client_id`, `uploaded_by`, `company_id`, bucket/path, year, and uploaded status; confirm the Storage bucket is not public.
3. Confirm the client sees its own status and a short-lived signed download; a different test client and unassigned staff cannot fetch the object or row.
4. Confirm assigned staff and admin can list/review/download the assigned test document through authorized interfaces.
5. Attempt a mismatched company ID and verify the `validate_document_company_owner` trigger rejects it.
6. Try client edits to staff-only review fields. The current legacy `documents_update_scope` allows client updates to document rows, so first verify/tighten that policy before trusting review statuses.
7. Repeat upload for an image and multi-page PDF; test camera capture from an HTTPS staging page on a phone.

## Receipt and bank statement extraction

Current code has **no configured real receipt or bank-statement extraction provider**. The T4 upload code has a client-side text/regex placeholder, not a document OCR service. There is no receipt or bank-statement extraction worker/endpoint in the app. Do not expect extraction results and do not treat an upload as extracted.

To test extraction later, first select and configure an approved provider in staging only, store its secret server-side, build a server-side extraction/review queue, and test with synthetic fixtures. For each fixture, confirm field values against the source (receipt vendor/date/subtotal/tax/total; statement dates/descriptions/debits/credits/balances), preserve nulls for unreadable values, and ensure deposits are not posted as duplicate income. Staff must approve/correct before accounting entries are saved. Record provider/model/version and test artifacts. Do not send sensitive documents to a third-party service without authorization.

## Completion record

Record staging project ref, migration versions applied, test account aliases (not passwords), test timestamps/results, safe fixture names, and any failures. Never include secret keys, passwords, full signed URLs, or actual personal/financial data in the report. Keep production credentials and data untouched.
