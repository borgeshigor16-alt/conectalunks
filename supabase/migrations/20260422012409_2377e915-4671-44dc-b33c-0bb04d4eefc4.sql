-- Adiciona coluna active em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Recria view people_directory respeitando profiles inativos não é necessário (people é tabela própria),
-- mas garantimos que perfis inativos sumam de listagens via policy de SELECT.
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (active = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));