CREATE POLICY "Sector editors can update own sector"
ON public.sectors FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'editor') AND public.get_user_sector(auth.uid()) = id)
WITH CHECK (public.has_role(auth.uid(), 'editor') AND public.get_user_sector(auth.uid()) = id);