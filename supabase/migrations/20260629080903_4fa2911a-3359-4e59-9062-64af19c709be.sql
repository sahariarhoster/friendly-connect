
-- Restrict user_roles writes to admins
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Prevent applicants from modifying admin-controlled fields on job_applications
CREATE OR REPLACE FUNCTION public.protect_application_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'Not authorized to modify admin-controlled fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_application_admin_fields ON public.job_applications;
CREATE TRIGGER protect_application_admin_fields
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.protect_application_admin_fields();
