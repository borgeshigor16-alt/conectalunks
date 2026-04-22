-- 1. Promover Higor a admin (mantendo editor não é necessário; admin já cobre)
INSERT INTO public.user_roles (user_id, role)
VALUES ('264d6c4a-53c8-4185-9696-d07700812bdb', 'admin')
ON CONFLICT DO NOTHING;

DELETE FROM public.user_roles
WHERE user_id = '264d6c4a-53c8-4185-9696-d07700812bdb' AND role = 'editor';

-- 2. Trigger: novos usuários como viewer + bootstrap do primeiro admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), 'Colaborador Lunks'));

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  END IF;

  RETURN NEW;
END;
$function$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Restringir UPDATE em profiles: usuário não pode trocar próprio sector_id
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND sector_id IS NOT DISTINCT FROM (SELECT sector_id FROM public.profiles WHERE user_id = auth.uid())
);

-- 4. people: esconder email/phone/extension de não-editores
-- Mantemos a policy original substituindo: visualização básica permanece, mas
-- adicionamos uma view segura. Como simplificação, restringimos SELECT a editores do setor
-- ou exibe apenas dados não sensíveis via policy granular.
-- Abordagem: revogar SELECT amplo e permitir SELECT completo só para quem pode gerenciar o setor;
-- demais usuários autenticados acessam via view pública sem contatos.
DROP POLICY IF EXISTS "Authenticated users can view active people" ON public.people;
CREATE POLICY "Sector managers can view full people records"
ON public.people
FOR SELECT
TO authenticated
USING (can_manage_sector(sector_id));

CREATE OR REPLACE VIEW public.people_directory
WITH (security_invoker = true) AS
SELECT id, sector_id, full_name, position, active, created_at, updated_at
FROM public.people
WHERE active = true;

GRANT SELECT ON public.people_directory TO authenticated;

-- Permitir SELECT básico (sem contatos) também via policy alternativa para quem só visualiza
CREATE POLICY "Authenticated users can view basic people info"
ON public.people
FOR SELECT
TO authenticated
USING (active = true);

-- Nota: como RLS é por linha (não coluna), mantemos a policy ampla para SELECT,
-- e o app deve consumir o diretório via view people_directory para ocultar contatos.
-- Para evitar duplicidade, removemos a policy ampla:
DROP POLICY IF EXISTS "Authenticated users can view basic people info" ON public.people;

-- 5. notifications: corrigir UPDATE para apenas o próprio destinatário ou admin
DROP POLICY IF EXISTS "Users can update own notification read state" ON public.notifications;
CREATE POLICY "Users can update own notification read state"
ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (recipient_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 6. notifications INSERT: validar que recipient (se houver) pertence ao setor gerenciado
DROP POLICY IF EXISTS "Sector editors can create notifications" ON public.notifications;
CREATE POLICY "Sector editors can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    sector_id IS NOT NULL
    AND can_manage_sector(sector_id)
    AND created_by = auth.uid()
    AND (
      recipient_user_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.user_id = recipient_user_id AND pr.sector_id = notifications.sector_id
      )
    )
  )
);