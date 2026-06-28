
-- 1. Departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active departments" ON public.departments
  FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage departments" ON public.departments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER departments_updated BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.departments (name) VALUES
  ('Engineering'), ('Design'), ('Marketing'), ('Sales'),
  ('Customer Support'), ('Operations'), ('Finance'),
  ('Human Resources'), ('Content'), ('Product');

-- 2. Jobs: per-job custom fields + defaults toggle
ALTER TABLE public.jobs
  ADD COLUMN custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN use_position_defaults boolean NOT NULL DEFAULT true;

-- 3. Allow guest applications
ALTER TABLE public.job_applications
  ALTER COLUMN applicant_id DROP NOT NULL;

DROP POLICY IF EXISTS "Applicants create own applications" ON public.job_applications;
CREATE POLICY "Anyone can apply" ON public.job_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    applicant_id IS NULL OR applicant_id = auth.uid()
  );
GRANT INSERT ON public.job_applications TO anon;

-- 4. Storage: allow anon resume uploads under guest/ folder
CREATE POLICY "Guest resume uploads" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'guest');
