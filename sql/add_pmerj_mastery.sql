ALTER TABLE public.diagnostic_results
ADD COLUMN IF NOT EXISTS pmerj_global_mastery INTEGER DEFAULT 0;
