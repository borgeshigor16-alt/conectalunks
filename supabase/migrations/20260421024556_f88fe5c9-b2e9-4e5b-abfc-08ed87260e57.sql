CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), 'Colaborador Lunks'));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'editor');
  RETURN NEW;
END;
$$;