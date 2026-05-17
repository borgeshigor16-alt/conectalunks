
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_sector(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_sector(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_instance(uuid) TO authenticated;
