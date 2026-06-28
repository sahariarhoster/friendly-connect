-- Add custom_fields template + use flag to departments
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add flag on jobs to opt in to department default fields
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS use_department_defaults boolean NOT NULL DEFAULT true;

-- Offices table
CREATE TABLE IF NOT EXISTS public.offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.offices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offices TO authenticated;
GRANT ALL ON public.offices TO service_role;

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offices are viewable by everyone"
  ON public.offices FOR SELECT USING (true);

CREATE POLICY "Admins manage offices"
  ON public.offices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER offices_updated_at BEFORE UPDATE ON public.offices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing office list
INSERT INTO public.offices (name) VALUES
  ('Dhaka — Head Office'),
  ('Dhaka — Creative Team Office'),
  ('Dhaka — Customer Support Office'),
  ('Remote')
ON CONFLICT (name) DO NOTHING;