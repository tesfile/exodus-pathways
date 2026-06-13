# Exodus Pathways

Accounting | Tax | Immigration | Business Services

A professional Next.js 15 client portal and public website for a Canadian business that supports accounting, bookkeeping, payroll, corporate tax, immigration, and business services.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Storage
- Supabase PostgreSQL
- Supabase Row Level Security
- Vercel-ready deployment

## Public Pages

- Home
- Accounting & Tax
- Bookkeeping
- Payroll
- Immigration Services
- Express Entry
- Federal Skilled Worker
- PNP
- Study Permit
- Work Permit
- Visitor Visa
- Family Sponsorship
- Refugee Sponsorship
- Business Immigration
- Start-Up Visa
- Self-Employed Program
- Business Services
- Client Login
- About
- Contact

## Authentication

Supabase Auth supports:

- `/signup`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

Signup flow:

1. Sign Up
2. Email Verification
3. Login
4. Create Case
5. Upload Documents

Signup and guided onboarding now ask whether the client is registering as an Individual or a Business / Corporation. Individual clients save their personal display name, optional SIN, phone, email, and address. Business clients save legal business name, optional operating name, optional BN, optional corporation number, contact person, phone, email, and business address. The app stores `client_type` and `display_name`, and client-facing/admin lists use `display_name` for client names.

Clients must verify their email before protected portal access when Supabase is configured. Admins can create client accounts manually in Supabase Auth. Future 2FA support is prepared with `two_factor_enabled`.

## Portal Roles

- Admin: can view and manage all clients.
- Employee: can view and manage only assigned clients.
- Client: can view and manage only their own records.

These rules are enforced with Supabase RLS policies across the migration files, including the immigration case access helpers in `supabase/migrations/0003_immigration_case_management_and_auth.sql`.

## Client Dashboard

- Immigration
- Personal Tax
- Self-Employed
- Business / Corporation
- Income
- Expenses
- GST
- Documents
- T4 Slips
- Workers & Payments
- Messages
- Appointments
- Profile

## Admin Dashboard

- Clients
- Immigration Cases
- Accounting Clients
- Tax Years
- Tax Files
- Personal Tax
- Self-Employed
- Workers & Payments
- Documents
- Messages
- Tasks
- Follow-Ups
- IRCC Requests
- Reports
- Employees
- Audit Logs
- Settings

The main admin workflow is now: open `/admin/clients`, select a client, then manage that client's profile, documents, immigration, personal tax, self-employed records, income, expenses, GST, Workers & Payments, messages, tasks, notes, and reports from the client detail page.

## Employee Dashboard

Employees use `/employee` and see only assigned clients and assigned immigration cases. The same RLS helpers that protect client/admin records also protect employee access.

## T4 Slip Workflow

- Client route: `/portal/t4`
- Admin review route: `/admin/tax-files`
- Clients upload a T4, the browser reads text from the file and extracts boxes 14, 16, 18, and 22 when possible.
- Clients confirm or correct the extracted values before review.
- Admins review confirmed T4 slips, download the private file through signed URLs, mark reviewed, or request correction.

## Personal Tax And Self-Employed Modules

Personal tax routes:

- Client route: `/portal/personal-tax`
- Admin route: `/admin/personal-tax`
- Clients select a tax year, upload a tax slip, choose T4, T4A, T5, RRSP, Tuition, Medical, Childcare, Rent, or Other, and save payer, document date, notes, and file.
- T4 extraction is prepared for boxes 14, 16, 18, 20, and 22. OCR is not built yet; the `Extract Slip Data` button is a placeholder.
- Admins can view clients by tax year, download slips with signed URLs, edit extraction values, approve slips, and mark slips ready for tax preparation.

Self-employed routes:

- Client route: `/portal/self-employed`
- Admin route: `/admin/self-employed`
- Clients record tax year, business type, income, expenses, GST collected, GST paid, and self-employed expense type.
- Admins can view self-employed income, expenses, GST summary, receipts, and year-end summary by client and year.

## Guided First Login

- First login route: `/portal`
- New clients see the guided onboarding welcome card, but portal sections remain visible.
- Registration type, display name, contact details, and service selections are saved through `public.save_client_registration_profile`.
- Supported choices include Immigration, Tax & Accounting, or both.
- Immigration service choices include Refugee Sponsorship, Family Sponsorship, Visitor Visa, Study Permit, Work Permit, Express Entry, Citizenship, and Other.
- Tax choices include Personal Tax, Self-Employed, Corporation, GST Only, and Bookkeeping & Payroll.
- Clients can change service choices later from `/portal/profile`.
- Guided onboarding saves preferences only; it does not remove immigration, tax, business, accounting, document, message, or profile sections.

## Workers & Payments

- Client route: `/portal/workers-payments`
- Admin workflow: `/admin/clients` -> open a client -> `Workers & Payments`.
- Legacy admin review route: `/admin/workers-payroll-review`.
- Client payroll route `/portal/payroll` redirects to `/portal/workers-payments`.
- Clients enter Full Name, SIN or Business Number, Address, optional Phone, optional Email, Date Paid, Amount Paid, Payment Method, Invoice Yes/No/Not sure, invoice/receipt upload, Notes, and Client Selected Type.
- Client selected types are T4 Employee, T4A Contractor, T5018 Subcontractor, Cash worker, Owner / Shareholder, Family member paid, and Not sure.
- Admin-only review fields include CPP, EI, Income Tax Deducted, Benefits, Vacation Pay, and Net Pay.
- Admin classification options are T4 Employee, T4A Contractor, T5018 Subcontractor, Cash Review, Shareholder, Expense Only, and Review Needed.
- T4 Employee records show an admin-only Payroll/T4 preparation panel with Box 14, 16, 18, 22, 24, 26, Benefits, Vacation Pay, Net Pay, and T4 Ready status.
- Admin can enter pay period start/end and generate a protected paystub PDF from `/admin/paystubs/[paymentId]`.
- The admin-only payroll calculator placeholder stores province, pay frequency, pay date, gross pay, TD1 federal and provincial amounts, CPP/EI exemption flags, employer CPP, and employer EI.
- Payroll calculator values are manually editable and include the disclaimer: "Verify payroll deductions with CRA PDOC before filing or remitting."
- Admin sees yearly T4 totals, T4 preparation table, T4A preparation table, T5018 support table, payment list, worker list, and export placeholders for CSV, T4, T4A, and T5018 support.
- No CRA connection is enabled; reports are export-ready placeholders only.

## Immigration Case Management

Client immigration workspace includes:

- Start new immigration case
- Choose program
- Complete assessment
- Applicant information
- Sponsor / inviter information
- People involved
- Document upload
- Checklist
- Case status
- Secure messages
- Missing items
- Deadlines
- Follow-up requests
- IRCC request tracker
- Case timeline

Admin immigration workspace includes:

- New assessments
- Missing documents
- Upcoming deadlines
- Overdue tasks
- Client messages
- IRCC requests
- Document approve, reject, request-again, note, and due-date actions
- Task and follow-up assignment
- Email reminder placeholder
- SMS reminder placeholder

People involved can include applicant, sponsor, inviter, spouse, children, employer, school, business partner, and other family members.

## Multi-Language Foundation

The app includes a client-side translation provider and language switcher for:

- English
- Tigrinya
- Amharic
- Arabic
- French

Translation files live in `lib/i18n/dictionaries.ts`. Shared UI components use translation keys through `useT()` so future copy can be localized without hardcoding text inside components.

## Plain-Language Client Entry

Expense wording has been simplified:

- Vendor -> Paid To
- Description -> What
- Category -> Type

The expense form includes:

- Paid To
- What
- Type
- Amount
- GST
- Receipt
- Notes

Income wording has been simplified:

- Who Paid You
- Work Done
- Amount
- GST
- Invoice Upload
- Notes

Receipts support both file upload and phone camera capture.

## Smart Directories

The portal auto-saves new Paid To names and expense Types using:

- `paid_to_directory`
- `expense_types`

Duplicate records are prevented with normalized-name unique indexes. Authenticated clients store reusable names and types in Supabase for future entries.

Default expense types:

- Materials
- Fuel
- Vehicle
- Tools
- Rent
- Phone
- Payroll
- Insurance
- WCB
- Meals
- Supplies
- Office
- Other

## Missing Items

Client reminders are supported by `client_reminders` and shown on the client home page. Examples:

- Missing Bank Statement
- Missing Receipt
- Missing GST Information
- Missing Workers & Payments Information

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Supabase environment variables are required for login, signup, logout, and all protected portal routes. Missing or placeholder Supabase configuration redirects protected routes to `/login`.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Only expose `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to browser code. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and use it only for trusted scripts or admin jobs.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL editor.
3. Run `supabase/migrations/0002_plain_language_portal.sql`.
4. Run `supabase/migrations/0003_immigration_case_management_and_auth.sql`.
5. Run `supabase/migrations/0004_accounting_records_functionality.sql`.
6. Run `supabase/migrations/0005_client_workflow_fixes.sql`.
7. Run `supabase/migrations/0006_phase1_stabilization.sql`.
8. Run `supabase/migrations/0007_accounting_document_dates.sql`.
9. Run `supabase/migrations/0008_t4_slip_workflow.sql`.
10. Run `supabase/migrations/0009_personal_tax_and_self_employed.sql`.
11. Run `supabase/migrations/0010_guided_onboarding_workers_payments.sql`.
12. Run `supabase/migrations/0011_client_friendly_worker_payments.sql`.
13. Run `supabase/migrations/0012_simplify_payroll_workers_workflow.sql`.
14. Run `supabase/migrations/0013_restore_portal_worker_fields.sql`.
15. Run `supabase/migrations/0014_worker_slip_payroll_preparation.sql`.
16. Run `supabase/migrations/0015_paystub_pdf_fields.sql`.
17. Run `supabase/migrations/0016_client_type_display_name.sql`.
18. Enable email/password authentication and email verification.
19. Add redirect URLs for `/verify-email` and `/reset-password`.
20. Create Auth users for admins, employees, and clients.
21. Update `supabase/seed.sql` with matching Auth user UUIDs.
22. Run `supabase/seed.sql` only when you want optional demo data.
23. Confirm the private Storage buckets exist:
    - `receipts`
    - `invoices`
    - `bank-statements`
    - `immigration-documents`
    - `tax-documents`
    - `tax-slips`
    - `client-documents`

Storage paths must start with the client UUID, for example:

```text
receipts/<client_uuid>/fuel-receipt.jpg
bank-statements/<client_uuid>/may-2026.pdf
immigration-documents/<client_uuid>/passport.pdf
tax-slips/<client_uuid>/2026/t4.pdf
invoices/<client_uuid>/workers/2026/subcontractor-invoice.pdf
```

## Database Tables

The initial migration creates:

- `users`
- `client_profiles`
- `companies`
- `income_entries`
- `expense_entries`
- `receipts`
- `bank_statements`
- `assets`
- `payroll_records`
- `immigration_cases`
- `documents`
- `messages`
- `appointments`
- `tasks`

The plain-language upgrade migration also creates:

- `expense_types`
- `paid_to_directory`
- `client_tasks`
- `client_reminders`

It also adds AI/workflow-ready metadata fields for future receipt scanning and immigration automation.

The immigration/auth/year upgrade migration also creates or extends:

- `accounting_years`
- `gst_records`
- `immigration_case_assignments`
- `immigration_assessments`
- `immigration_case_people`
- `immigration_document_checklist`
- `ircc_requests`
- `immigration_case_timeline`
- `immigration_tasks`
- `notifications`
- `audit_logs`
- year fields on accounting records
- email verification and future 2FA profile fields

The accounting records functionality migration also adds:

- `income_entries.gst_hst_amount`
- year/date indexes for income, expenses, and assets

The client workflow fixes migration also adds:

- `expense_entries.notes`
- document review due dates, requested-again timestamps, and review tracking fields

The Phase 1 stabilization migration also:

- converts `expense_entries.category` from enum to text so custom client-added expense types save correctly
- confirms year/GST/notes fields used by the MVP forms
- adds document/year indexes used by admin review pages

The accounting/document date migration also adds:

- `documents.document_date` for optional receipt, invoice, bank statement, payroll, GST, and immigration document dates
- GST period start/end dates for saved GST records
- indexes for document effective dates, uploaded timestamps, and GST periods

The T4 slip workflow migration also creates:

- `t4_slips` for uploaded T4 tax slips
- extracted box values for CRA boxes 14, 16, 18, and 22
- client confirmation fields
- admin review status, reviewer notes, and review timestamps

The personal tax and self-employed migration also creates:

- `personal_tax_slips`
- `tax_slip_extractions`
- `self_employed_records`
- private `tax-slips` storage bucket and RLS policies
- tax-year indexes for personal tax and self-employed records

The guided onboarding and workers/payments migration also creates or extends:

- guided onboarding fields on `client_profiles`
- client self-update policy for service preferences
- `workers`
- `worker_payments`
- worker/payment RLS policies using `can_access_client`
- client/company/tax-year indexes for worker payment review

The client-friendly worker payment migration also:

- makes worker address optional
- adds `payment_method`, `client_worker_type`, `slip_needed`, and admin review fields to `worker_payments`
- moves payroll deduction handling to admin review only

The simplified payroll/workers migration also:

- keeps older simple worker records compatible
- adds `worker_payments.invoice_provided`
- adds `worker_payments.admin_classification`
- indexes admin classification by client and tax year

The restored portal worker-fields migration also:

- adds `worker_payments.net_pay` for admin-only payroll review

The worker slip and payroll preparation migration also:

- adds T4 Box 14, 16, 18, 22, 24, and 26 fields to `worker_payments`
- adds T4 Benefits, Vacation Pay, Net Pay, and T4 Ready status
- adds admin-only payroll calculator placeholder fields for province, pay frequency, pay date, TD1 amounts, exemption flags, employer CPP, and employer EI

The paystub PDF fields migration also:

- adds pay period start, pay period end, and pay frequency fields to `worker_payments`
- supports protected admin paystub PDF downloads for reviewed T4 employee payments

The client type and display name migration also:

- adds `users.client_type`, `users.display_name`, and `users.sin_number`
- adds `client_profiles.sin_number`
- adds `companies.corporation_number` and `companies.contact_person`
- defaults existing client users to `client_type = 'individual'` and `display_name = full_name`
- updates the Auth signup trigger to save individual or business registration metadata
- adds `public.save_client_registration_profile` for guided onboarding and Profile updates

## File Uploads

The portal includes Supabase Storage upload components for:

- Receipts
- Invoices
- Bank statements
- Immigration documents
- Tax documents
- Personal tax slips
- T4 slips with box 14, 16, 18, and 22 extraction
- General client documents

The upload UI intentionally warns clients not to submit credit card numbers, online banking usernames, online banking passwords, or bank login information.

Documents are private. Download links are generated through signed URLs. Uploaded timestamps use `documents.created_at`; optional effective dates use `documents.document_date`.

## Future-Ready Hooks

The portal includes UI and database placeholders for:

- AI receipt scanning
- SMS notifications
- Email campaigns
- T4 generation
- T4 upload, extraction confirmation, and admin review
- T2 preparation
- Immigration workflow automation

## Reports And Exports

The report pages generate real on-screen summaries from Supabase records for:

- Trial Balance
- General Ledger
- GST Summary
- Payroll Summary
- T2 Working Papers

The year-end package page can create/update the `accounting_years` package status. Excel, CSV, and working-paper file downloads remain future export actions and show a clear coming-soon status instead of silently doing nothing.

These buttons are ready for future server actions or background jobs.

## Vercel Deployment

1. Push this project to a Git repository.
2. Import the repository into Vercel.
3. Set the environment variables in Vercel Project Settings.
4. Use the default Next.js build settings:

```bash
npm install
npm run build
```

5. Add the deployed site URL to `NEXT_PUBLIC_SITE_URL`.
6. In Supabase Authentication settings, add the Vercel production URL to the allowed redirect URLs.

## Security Notes

- Client data separation is enforced with RLS, not only with UI checks.
- Employees receive access through `client_profiles.assigned_employee_id` and immigration case assignments.
- Storage policies derive client access from the first folder in each Storage object path.
- Document downloads use private signed URL helpers.
- New Auth signups default to the `client` role.
- Verified email is required before protected portal access when Supabase is configured.
- Staff roles should be assigned manually by a trusted admin.
- Exodus Pathways provides professional support, but clients remain responsible for providing complete and accurate documents.
