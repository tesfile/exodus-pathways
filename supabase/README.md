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
11. In Authentication, enable email/password sign-in and email verification.
12. Add redirect URLs for `/verify-email` and `/reset-password`.
13. Create admin, employee, and client Auth users.
14. Update the UUIDs in `supabase/seed.sql` to match those Auth users, then run the seed only when you want optional demo data.
15. In `public.users`, set trusted staff roles to `admin` or `employee`. New signups default to `client`.
16. Store uploaded files under paths that start with the client UUID, for example:
   - `receipts/<client_uuid>/fuel-receipt.jpg`
   - `bank-statements/<client_uuid>/may-2026.pdf`
   - `immigration-documents/<client_uuid>/passport-scan.pdf`
   - `tax-slips/<client_uuid>/2026/t4.pdf`

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
- Documents are private. Use signed URLs for download links.

Never request or store online banking usernames, online banking passwords, credit card numbers, or bank login credentials.
