
-- Position type enum
CREATE TYPE public.position_type AS ENUM ('video_editor','social_media_manager','graphic_designer','content_writer','developer','marketing','other');
CREATE TYPE public.job_status AS ENUM ('draft','open','closed');
CREATE TYPE public.application_status AS ENUM ('pending','reviewing','shortlisted','interviewed','rejected','hired');

-- Jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text,
  position_type position_type NOT NULL DEFAULT 'other',
  description text NOT NULL,
  requirements text,
  location text,
  employment_type text,
  salary_range text,
  status job_status NOT NULL DEFAULT 'draft',
  deadline timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view open jobs" ON public.jobs
  FOR SELECT TO anon, authenticated
  USING (status = 'open' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage jobs" ON public.jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Job applications table
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cover_letter text,
  resume_url text,
  portfolio_url text,
  custom_responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  status application_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants view own applications" ON public.job_applications
  FOR SELECT TO authenticated
  USING (auth.uid() = applicant_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Applicants create own applications" ON public.job_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants update own pending applications" ON public.job_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = applicant_id AND status = 'pending')
  WITH CHECK (auth.uid() = applicant_id AND status = 'pending');

CREATE POLICY "Admins manage all applications" ON public.job_applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
