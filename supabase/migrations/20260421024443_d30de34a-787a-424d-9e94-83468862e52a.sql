CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE public.process_status AS ENUM ('active', 'review', 'paused', 'archived');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 80),
  acronym TEXT NOT NULL UNIQUE CHECK (char_length(acronym) BETWEEN 2 AND 12),
  leader_name TEXT CHECK (leader_name IS NULL OR char_length(leader_name) <= 100),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 800),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL DEFAULT 'Colaborador Lunks' CHECK (char_length(full_name) BETWEEN 2 AND 100),
  position TEXT CHECK (position IS NULL OR char_length(position) <= 100),
  avatar_url TEXT CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_sector(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sector_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_sector(_sector_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'editor')
      AND public.get_user_sector(auth.uid()) = _sector_id
    );
$$;

CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (char_length(category) BETWEEN 2 AND 40),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 4 AND 160),
  excerpt TEXT NOT NULL CHECK (char_length(excerpt) BETWEEN 10 AND 500),
  body TEXT CHECK (body IS NULL OR char_length(body) <= 5000),
  author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 100),
  pinned BOOLEAN NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'published',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  position TEXT NOT NULL CHECK (char_length(position) BETWEEN 2 AND 100),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 255),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 40),
  extension TEXT CHECK (extension IS NULL OR char_length(extension) <= 20),
  bio TEXT CHECK (bio IS NULL OR char_length(bio) <= 1000),
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
  code TEXT NOT NULL UNIQUE CHECK (char_length(code) BETWEEN 2 AND 30),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 4 AND 140),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 1200),
  sla TEXT CHECK (sla IS NULL OR char_length(sla) <= 80),
  status public.process_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.process_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  owner_sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  step_order INTEGER NOT NULL CHECK (step_order > 0),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (process_id, step_order)
);

ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (char_length(category) BETWEEN 2 AND 60),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 4 AND 160),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 10 AND 500),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 20 AND 8000),
  tags TEXT[] NOT NULL DEFAULT '{}',
  status public.content_status NOT NULL DEFAULT 'published',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 500),
  link TEXT CHECK (link IS NULL OR char_length(link) <= 300),
  read_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON public.sectors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON public.processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_process_steps_updated_at BEFORE UPDATE ON public.process_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_articles_updated_at BEFORE UPDATE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
  VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Authenticated users can view active sectors"
ON public.sectors FOR SELECT TO authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sectors"
ON public.sectors FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view published announcements"
ON public.announcements FOR SELECT TO authenticated
USING (status = 'published' OR public.can_manage_sector(sector_id));

CREATE POLICY "Sector editors can create announcements"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (public.can_manage_sector(sector_id) AND created_by = auth.uid());

CREATE POLICY "Sector editors can update announcements"
ON public.announcements FOR UPDATE TO authenticated
USING (public.can_manage_sector(sector_id))
WITH CHECK (public.can_manage_sector(sector_id));

CREATE POLICY "Sector editors can delete announcements"
ON public.announcements FOR DELETE TO authenticated
USING (public.can_manage_sector(sector_id));

CREATE POLICY "Authenticated users can view active people"
ON public.people FOR SELECT TO authenticated
USING (active = true OR public.can_manage_sector(sector_id));

CREATE POLICY "Sector editors can create people"
ON public.people FOR INSERT TO authenticated
WITH CHECK (public.can_manage_sector(sector_id) AND created_by = auth.uid());

CREATE POLICY "Sector editors can update people"
ON public.people FOR UPDATE TO authenticated
USING (public.can_manage_sector(sector_id))
WITH CHECK (public.can_manage_sector(sector_id));

CREATE POLICY "Sector editors can delete people"
ON public.people FOR DELETE TO authenticated
USING (public.can_manage_sector(sector_id));

CREATE POLICY "Authenticated users can view processes"
ON public.processes FOR SELECT TO authenticated
USING (status <> 'archived' OR public.can_manage_sector(sector_id));

CREATE POLICY "Sector editors can create processes"
ON public.processes FOR INSERT TO authenticated
WITH CHECK (public.can_manage_sector(sector_id) AND created_by = auth.uid());

CREATE POLICY "Sector editors can update processes"
ON public.processes FOR UPDATE TO authenticated
USING (public.can_manage_sector(sector_id))
WITH CHECK (public.can_manage_sector(sector_id));

CREATE POLICY "Sector editors can delete processes"
ON public.processes FOR DELETE TO authenticated
USING (public.can_manage_sector(sector_id));

CREATE POLICY "Authenticated users can view process steps"
ON public.process_steps FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id AND (p.status <> 'archived' OR public.can_manage_sector(p.sector_id))));

CREATE POLICY "Sector editors can manage process steps"
ON public.process_steps FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id AND public.can_manage_sector(p.sector_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id AND public.can_manage_sector(p.sector_id)));

CREATE POLICY "Authenticated users can view published articles"
ON public.knowledge_articles FOR SELECT TO authenticated
USING (status = 'published' OR public.can_manage_sector(sector_id));

CREATE POLICY "Sector editors can create articles"
ON public.knowledge_articles FOR INSERT TO authenticated
WITH CHECK (public.can_manage_sector(sector_id) AND created_by = auth.uid());

CREATE POLICY "Sector editors can update articles"
ON public.knowledge_articles FOR UPDATE TO authenticated
USING (public.can_manage_sector(sector_id))
WITH CHECK (public.can_manage_sector(sector_id));

CREATE POLICY "Sector editors can delete articles"
ON public.knowledge_articles FOR DELETE TO authenticated
USING (public.can_manage_sector(sector_id));

CREATE POLICY "Users can view own and sector notifications"
ON public.notifications FOR SELECT TO authenticated
USING (recipient_user_id = auth.uid() OR sector_id = public.get_user_sector(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own notification read state"
ON public.notifications FOR UPDATE TO authenticated
USING (recipient_user_id = auth.uid() OR sector_id = public.get_user_sector(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (recipient_user_id = auth.uid() OR sector_id = public.get_user_sector(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sector editors can create notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK ((sector_id IS NOT NULL AND public.can_manage_sector(sector_id) AND created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_sector_id ON public.profiles(sector_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_announcements_sector_status ON public.announcements(sector_id, status);
CREATE INDEX idx_people_sector_active ON public.people(sector_id, active);
CREATE INDEX idx_processes_sector_status ON public.processes(sector_id, status);
CREATE INDEX idx_process_steps_process_order ON public.process_steps(process_id, step_order);
CREATE INDEX idx_knowledge_articles_sector_status ON public.knowledge_articles(sector_id, status);
CREATE INDEX idx_notifications_recipient_read ON public.notifications(recipient_user_id, read_at);
CREATE INDEX idx_notifications_sector_read ON public.notifications(sector_id, read_at);

INSERT INTO public.sectors (name, acronym, leader_name, description) VALUES
('Diretoria', 'DIR', 'Higor Borges', 'Governança, decisões estratégicas e alinhamento institucional da Lunks Feel.'),
('Marketing e Comunicação', 'MKT', 'Entrementes HB', 'Comunicação integrada, campanhas, boletins e padronização de mensagens.'),
('Comercial', 'COM', 'Coordenação Comercial', 'Relacionamento B2B, propostas MVNO/M2M e acompanhamento de oportunidades.'),
('Suporte Técnico', 'SUP', 'Coordenação de Suporte', 'Atendimento técnico, incidentes, ativação e suporte a SIM Cards M2M/IoT.'),
('Operações', 'OPS', 'Coordenação Operacional', 'Fluxos operacionais, integração de áreas e monitoramento de processos críticos.'),
('Jurídico e Compliance', 'JUR', 'Jurídico & Compliance', 'Normas regulatórias, homologações, LGPD e requisitos Anatel.'),
('Recursos Humanos', 'RH', 'Recursos Humanos', 'Clima organizacional, cultura, capacitação e comunicação com colaboradores.');