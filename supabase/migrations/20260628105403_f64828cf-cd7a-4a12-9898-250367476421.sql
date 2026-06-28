DROP POLICY IF EXISTS "Public can view open jobs" ON public.jobs;
CREATE POLICY "Anyone can view open jobs"
ON public.jobs
FOR SELECT
TO anon, authenticated
USING (status = 'open'::job_status);

DROP POLICY IF EXISTS "Anyone views active departments" ON public.departments;
CREATE POLICY "Anyone can view active departments"
ON public.departments
FOR SELECT
TO anon, authenticated
USING (active = true);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;