# Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/0001_initial_schema.sql`.
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
18. Run `supabase/migrations/0017_client_simplification_service_posts_expense_classification.sql`.
19. Run `supabase/migrations/0018_public_service_posts_general_category.sql`.
20. Run `supabase/migrations/0019_public_service_posts_translation_key.sql`.
21. In Authentication, enable email/password sign-in and email verification.
22. Add redirect URLs for `/verify-email` and `/reset-password`.
23. Create admin, employee, and client Auth users.
24. Update the UUIDs in `supabase/seed.sql` to match those Auth users, then run the seed only when you want optional demo data.
25. In `public.users`, set trusted staff roles to `admin` or `employee`. New signups default to `client`.
26. Store uploaded files under paths that start with the client UUID, for example:
   - `receipts/<client_uuid>/fuel-receipt.jpg`
   - `bank-statements/<client_uuid>/may-2026.pdf`
   - `immigration-documents/<client_uuid>/passport-scan.pdf`
   - `tax-slips/<client_uuid>/2026/t4.pdf`
   - `invoices/<client_uuid>/workers/2026/subcontractor-invoice.pdf`

The RLS policy model is:

- Clients can read and write their own records.
- Admins can read and manage all client records.
- Employees can read and manage only clients assigned to them through `client_profiles.assigned_employee_id`.
- Storage objects use the first folder in the file path as the client UUID.
- `expense_types`, `paid_to_directory`, `client_tasks`, and `client_reminders` use the same client access helper.
- Duplicate smart directory records are prevented with normalized-name unique indexes.
- Immigration case tables use `can_access_case`, so clients see their own cases, employees see assigned clients/cases, and admins see all cases.
- Accounting and tax records include `tax_year` and can be grouped through `accounting_years`.
- `0006_phase1_stabilization.sql` converts `expense_entries.category` to text so custom expense types can save.
- `0007_accounting_document_dates.sql` adds optional document effective dates while keeping uploaded timestamps in `created_at`.
- `0008_t4_slip_workflow.sql` creates `t4_slips` for boxes 14, 16, 18, and 22 extraction, client confirmation, and admin review.
- `0009_personal_tax_and_self_employed.sql` creates `personal_tax_slips`, `tax_slip_extractions`, `self_employed_records`, and the private `tax-slips` bucket.
- `0010_guided_onboarding_workers_payments.sql` adds guided onboarding fields, allows clients to update service preferences, and creates `workers` and `worker_payments`.
- `0011_client_friendly_worker_payments.sql` makes address optional, adds payment method and slip-needed classification, and keeps payroll deduction review on the admin side.
- `0012_simplify_payroll_workers_workflow.sql` keeps older simple worker records compatible, records whether an invoice was provided, and adds admin classification for Workers & Payments review.
- `0013_restore_portal_worker_fields.sql` adds `worker_payments.net_pay` for admin-only payroll review.
- `0014_worker_slip_payroll_preparation.sql` adds T4 preparation boxes, T4 ready status, and admin-only payroll calculator placeholder fields to worker payments.
- `0015_paystub_pdf_fields.sql` adds pay period fields used by protected admin paystub PDF downloads.
- `0016_client_type_display_name.sql` adds Individual vs Business / Corporation registration support, saves `client_type` and `display_name`, defaults existing clients to individual/full name, extends business company profile fields, and updates the Auth signup/onboarding profile save flow.
- `0017_client_simplification_service_posts_expense_classification.sql` adds admin expense classification for asset/CCA review and creates `public_service_posts` for future public service explanations by category, service type, language, content, and publish status.
- `0018_public_service_posts_general_category.sql` extends public posts so admins can publish General updates alongside Immigration, Accounting, and Business posts.
- `0019_public_service_posts_translation_key.sql` adds `translation_key` so admins can connect separate manual language versions of the same public post.
- Worker payment records are grouped by client, company, and tax year. Employee access is still limited through `client_profiles.assigned_employee_id`.
- Documents are private. Use signed URLs for download links.

Never request or store online banking usernames, online banking passwords, credit card numbers, or bank login credentials.
