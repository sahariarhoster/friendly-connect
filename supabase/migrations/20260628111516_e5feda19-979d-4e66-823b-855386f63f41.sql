
DROP POLICY IF EXISTS "Guest resume uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users view own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users update own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own resume" ON storage.objects;

-- Anyone (anon or authenticated) can upload to the resumes bucket for job applications
CREATE POLICY "Anyone can upload resumes" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Owners and admins can read resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Owners can update resumes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete resumes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (auth.uid())::text = (storage.foldername(name))[1]);
