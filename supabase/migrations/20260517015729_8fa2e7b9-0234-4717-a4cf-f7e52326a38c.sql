
-- 1) Tighten notifications SELECT policy
DROP POLICY IF EXISTS "Users can view own and sector notifications" ON public.notifications;
CREATE POLICY "Users can view own and sector notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  recipient_user_id = auth.uid()
  OR (recipient_user_id IS NULL AND sector_id IS NOT NULL AND sector_id = public.get_user_sector(auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 2) Revoke EXECUTE on SECURITY DEFINER helper functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_sector(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_sector(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_instance(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_feedback_indices(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_overdue_instances() FROM anon;

-- Keep aggregated reporting functions callable by signed-in users
GRANT EXECUTE ON FUNCTION public.get_feedback_indices(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_overdue_instances() TO authenticated;
