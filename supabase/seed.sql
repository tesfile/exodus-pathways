-- Demo data for Exodus Pathways.
--
-- Create Supabase Auth users first, then replace these UUIDs with the matching
-- auth.users.id values. The schema trigger automatically creates public.users
-- rows for new Auth users, but this seed can enrich them and add portal data.
--
-- Suggested demo emails:
-- admin@exoduspathways.ca
-- employee@exoduspathways.ca
-- client@example.ca

do $$
declare
  admin_id uuid := '64dc0d35-6d6d-488d-8f31-8e2d51c1167f';
  employee_id uuid := 'f2a37747-cd61-4900-bcc7-d7f02989f47e';
  client_id uuid := '7a9622f3-efbc-4dd0-a0d8-3dc7c5f1f10a';
  company_id uuid := '79509c54-d879-4624-8713-50219b30ea46';
  immigration_case_id uuid;
begin
  if not exists (select 1 from auth.users where id in (admin_id, employee_id, client_id)) then
    raise notice 'Demo Auth users were not found. Create Auth users and update the UUIDs at the top of supabase/seed.sql before running the seed.';
    return;
  end if;

  insert into public.users (id, email, full_name, role, phone)
  values
    (admin_id, 'admin@exoduspathways.ca', 'Exodus Admin', 'admin', '+1 000 000 0000'),
    (employee_id, 'employee@exoduspathways.ca', 'Maya Singh', 'employee', '+1 000 000 0001'),
    (client_id, 'client@example.ca', 'Amara Roofing Ltd.', 'client', '+1 000 000 0002')
  on conflict (id) do update
  set full_name = excluded.full_name,
      role = excluded.role,
      phone = excluded.phone;

  insert into public.client_profiles (user_id, assigned_employee_id, intake_status, province, service_notes)
  values (client_id, employee_id, 'active', 'Alberta', 'Bookkeeping, payroll, GST, and year-end corporate tax support.')
  on conflict (user_id) do update
  set assigned_employee_id = excluded.assigned_employee_id,
      intake_status = excluded.intake_status,
      province = excluded.province,
      service_notes = excluded.service_notes;

  insert into public.companies (id, client_id, legal_name, trade_name, business_number, province, fiscal_year_end)
  values (company_id, client_id, 'Amara Roofing Ltd.', 'Amara Roofing', '123456789RT0001', 'Alberta', '2026-12-31')
  on conflict (id) do update
  set legal_name = excluded.legal_name,
      trade_name = excluded.trade_name,
      business_number = excluded.business_number;

  insert into public.income_entries (client_id, company_id, entry_date, source, invoice_number, amount, status)
  values
    (client_id, company_id, '2026-05-03', 'Roof repair invoice', '1048', 4250.00, 'matched'),
    (client_id, company_id, '2026-05-12', 'Commercial job deposit', '1051', 12800.00, 'needs_invoice'),
    (client_id, company_id, '2026-05-28', 'Service call e-transfer', '1057', 780.00, 'reviewed');

  insert into public.expense_entries (client_id, company_id, expense_date, category, vendor, description, amount, gst_hst_amount, status)
  values
    (client_id, company_id, '2026-05-04', 'Materials & Supplies', 'Roofing Supply Co.', 'Shingles and underlayment', 1245.40, 62.27, 'submitted'),
    (client_id, company_id, '2026-05-09', 'Fuel', 'Petro-Canada', 'Truck fuel', 182.15, 9.11, 'reviewed'),
    (client_id, company_id, '2026-05-17', 'Insurance', 'Broker payment', 'Commercial insurance', 418.00, 0.00, 'submitted');

  insert into public.payroll_records (client_id, company_id, period_start, period_end, employee_count, gross_pay, source_deductions, status)
  values
    (client_id, company_id, '2026-05-01', '2026-05-15', 4, 8420.00, 1820.00, 'filed'),
    (client_id, company_id, '2026-05-16', '2026-05-31', 4, 9110.00, 1955.00, 'draft');

  insert into public.immigration_cases (client_id, assigned_employee_id, case_type, applicant_name, status, milestone, due_date)
  values
    (client_id, employee_id, 'Visitor record extension', 'Primary applicant', 'active', 'Document collection', '2026-06-20'),
    (client_id, employee_id, 'LMIA support file', 'Employer stream', 'waiting_on_client', 'Employer forms', '2026-06-24');

  select id into immigration_case_id
  from public.immigration_cases
  where public.immigration_cases.client_id = '7a9622f3-efbc-4dd0-a0d8-3dc7c5f1f10a'::uuid
  order by created_at
  limit 1;

  insert into public.messages (client_id, sender_id, recipient_id, subject, body)
  values
    (client_id, employee_id, client_id, 'Missing May receipts', 'Please upload fuel and materials receipts for the final week of May.'),
    (client_id, client_id, employee_id, 'Uploaded CRA notice', 'I uploaded the latest CRA notice for review.');

  insert into public.appointments (client_id, employee_id, appointment_at, appointment_type, status, notes)
  values
    (client_id, employee_id, '2026-06-18 10:30:00-06', 'Bookkeeping review', 'confirmed', 'Monthly review call'),
    (client_id, employee_id, '2026-06-25 14:00:00-06', 'Tax planning call', 'tentative', 'Confirm availability');

  insert into public.tasks (client_id, assigned_to, title, description, status, due_date)
  values
    (client_id, employee_id, 'Review May bank statement', 'Check reconciliation against uploaded receipts.', 'open', '2026-06-12'),
    (client_id, employee_id, 'Prepare GST summary', 'Prepare Q2 GST summary placeholder.', 'open', '2026-06-15');

  insert into public.paid_to_directory (client_id, name, normalized_name, use_count, last_used_at)
  values
    (client_id, 'Home Depot', 'home depot', 4, now()),
    (client_id, 'Shell', 'shell', 6, now()),
    (client_id, 'Costco', 'costco', 2, now()),
    (client_id, 'Canadian Tire', 'canadian tire', 3, now()),
    (client_id, 'ABC Roofing Supply', 'abc roofing supply', 1, now())
  on conflict (client_id, normalized_name) do update
  set name = excluded.name,
      use_count = public.paid_to_directory.use_count + 1,
      last_used_at = now();

  insert into public.expense_types (client_id, name, normalized_name, is_default)
  values
    (client_id, 'Materials', 'materials', false),
    (client_id, 'Fuel', 'fuel', false),
    (client_id, 'Vehicle', 'vehicle', false),
    (client_id, 'Payroll', 'payroll', false)
  on conflict do nothing;

  insert into public.client_reminders (client_id, reminder_type, title, plain_language_title, details, status, due_date, created_by)
  values
    (client_id, 'missing_bank_statement', 'Missing Bank Statement', 'Missing Bank Statement', 'Please upload the latest business bank statement.', 'open', '2026-06-15', employee_id),
    (client_id, 'missing_receipt', 'Missing Receipt', 'Missing Receipt', 'Fuel receipt for the last week of May is missing.', 'open', '2026-06-14', employee_id),
    (client_id, 'missing_gst_information', 'Missing GST Information', 'Missing GST Information', 'Confirm GST collected for May invoices.', 'open', '2026-06-18', employee_id),
    (client_id, 'missing_payroll_information', 'Missing Payroll Information', 'Missing Payroll Information', 'Confirm June payroll hours.', 'open', '2026-06-20', employee_id)
  on conflict do nothing;

  insert into public.client_tasks (client_id, assigned_to, title, plain_language_title, source_module, status, due_date, automation_key, created_by)
  values
    (client_id, employee_id, 'Request missing May receipts', 'Missing Receipt', 'expenses', 'open', '2026-06-14', 'missing_receipt_may_2026', employee_id),
    (client_id, employee_id, 'Prepare client GST summary', 'Missing GST Information', 'gst', 'open', '2026-06-18', 'gst_summary_q2_2026', employee_id)
  on conflict do nothing;

  insert into public.accounting_years (client_id, company_id, tax_year, status, year_end_package_status)
  values
    (client_id, company_id, 2026, 'open', 'not_started'),
    (client_id, company_id, 2025, 'closed', 'generated')
  on conflict (client_id, tax_year) do update
  set status = excluded.status,
      year_end_package_status = excluded.year_end_package_status;

  insert into public.gst_records (client_id, company_id, tax_year, period_label, gst_collected, gst_paid, status)
  values
    (client_id, company_id, 2026, 'Q2 2026', 2410.00, 820.00, 'needs_review'),
    (client_id, company_id, 2026, 'Q1 2026', 1960.00, 740.00, 'ready')
  on conflict (client_id, tax_year, period_label) do update
  set gst_collected = excluded.gst_collected,
      gst_paid = excluded.gst_paid,
      status = excluded.status;

  if immigration_case_id is not null then
    insert into public.immigration_case_assignments (case_id, employee_id, assigned_by)
    values (immigration_case_id, employee_id, admin_id)
    on conflict (case_id, employee_id) do nothing;

    insert into public.immigration_assessments (case_id, client_id, program_slug, answers, status, submitted_at)
    values (immigration_case_id, client_id, 'work-permit', '{"trade":"roofer","country":"Canada"}'::jsonb, 'submitted', now())
    on conflict (case_id) do update
    set answers = excluded.answers,
        status = excluded.status,
        submitted_at = excluded.submitted_at;

    insert into public.immigration_case_people (case_id, client_id, person_type, full_name, country, relationship)
    values
      (immigration_case_id, client_id, 'applicant', 'Primary Applicant', 'Canada', 'Applicant'),
      (immigration_case_id, client_id, 'employer', 'Amara Roofing Ltd.', 'Canada', 'Employer')
    on conflict do nothing;

    insert into public.immigration_document_checklist (case_id, client_id, document_key, document_label, status, due_date, admin_note)
    values
      (immigration_case_id, client_id, 'passport', 'Passport', 'uploaded', '2026-06-18', 'Review scan quality'),
      (immigration_case_id, client_id, 'proofFunds', 'Proof of funds', 'requested', '2026-06-20', 'Upload latest statement'),
      (immigration_case_id, client_id, 'police', 'Police certificate', 'missing', '2026-06-25', 'Request again if not received')
    on conflict (case_id, document_key) do update
    set status = excluded.status,
        due_date = excluded.due_date,
        admin_note = excluded.admin_note;

    insert into public.ircc_requests (case_id, client_id, title, requested_document, due_date, notes, status, created_by)
    values
      (immigration_case_id, client_id, 'Updated bank statement', 'Bank Statement', '2026-06-20', 'IRCC requested current proof of funds.', 'action_required', employee_id)
    on conflict do nothing;

    insert into public.immigration_case_timeline (case_id, client_id, event_key, event_label, actor_id, notes)
    values
      (immigration_case_id, client_id, 'account_created', 'Account Created', client_id, 'Client account created'),
      (immigration_case_id, client_id, 'assessment_submitted', 'Assessment Submitted', client_id, 'Initial assessment received'),
      (immigration_case_id, client_id, 'documents_requested', 'Documents Requested', employee_id, 'Checklist generated')
    on conflict do nothing;

    insert into public.immigration_tasks (case_id, client_id, assigned_to, title, follow_up_date, deadline, priority, status, notes, created_by)
    values
      (immigration_case_id, client_id, employee_id, 'Review work permit assessment', '2026-06-12', '2026-06-15', 'high', 'open', 'Confirm employer documents.', admin_id)
    on conflict do nothing;

    insert into public.notifications (client_id, case_id, channel, subject, body, status, created_by)
    values
      (client_id, immigration_case_id, 'email', 'Missing immigration document', 'Please upload the requested proof of funds.', 'draft', employee_id),
      (client_id, immigration_case_id, 'sms', 'SMS reminder placeholder', 'Future SMS reminder support.', 'draft', employee_id)
    on conflict do nothing;

    insert into public.audit_logs (actor_id, client_id, case_id, action, area, metadata)
    values
      (employee_id, client_id, immigration_case_id, 'requested_document', 'immigration', '{"document":"proofFunds"}'::jsonb),
      (client_id, client_id, immigration_case_id, 'submitted_assessment', 'immigration', '{}'::jsonb)
    on conflict do nothing;
  end if;
end $$;
