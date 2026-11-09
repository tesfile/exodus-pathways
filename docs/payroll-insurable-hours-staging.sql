-- Apply once in the STAGING Supabase SQL Editor before testing payroll hours.
-- Does not change existing records or backfill unverified hours.
ALTER TABLE public.worker_payments
  ADD COLUMN IF NOT EXISTS hours_worked numeric(10,2),
  ADD COLUMN IF NOT EXISTS insurable_hours numeric(10,2);
ALTER TABLE public.worker_payments
  DROP CONSTRAINT IF EXISTS worker_payments_hours_worked_valid;
ALTER TABLE public.worker_payments
  ADD CONSTRAINT worker_payments_hours_worked_valid CHECK (hours_worked IS NULL OR (hours_worked >= 0 AND hours_worked <= 1000));
ALTER TABLE public.worker_payments
  DROP CONSTRAINT IF EXISTS worker_payments_insurable_hours_valid;
ALTER TABLE public.worker_payments
  ADD CONSTRAINT worker_payments_insurable_hours_valid CHECK (insurable_hours IS NULL OR (insurable_hours >= 0 AND insurable_hours <= 1000));
-- The server-only service_role key writes these fields; existing RLS policies remain unchanged.
-- Old payroll records remain NULL until their hours are confirmed against timesheets.
