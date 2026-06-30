
-- 1. Harden has_role: SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. Tighten anon/auth INSERT policy on job_applications
DROP POLICY IF EXISTS "Anyone can apply" ON public.job_applications;

CREATE POLICY "Anyone can apply"
ON public.job_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Signed-in users must claim their own row; anon must leave applicant_id NULL
  ((auth.uid() IS NULL AND applicant_id IS NULL)
    OR (auth.uid() IS NOT NULL AND applicant_id = auth.uid()))
  AND char_length(trim(full_name)) BETWEEN 1 AND 100
  AND char_length(trim(email)) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (phone IS NULL OR char_length(phone) <= 30)
  AND (cover_letter IS NULL OR char_length(cover_letter) <= 3000)
  AND (portfolio_url IS NULL OR char_length(portfolio_url) <= 500)
  AND (resume_url IS NULL OR char_length(resume_url) <= 500)
  -- Force safe defaults on submission
  AND status = 'pending'
  AND admin_notes IS NULL
);
