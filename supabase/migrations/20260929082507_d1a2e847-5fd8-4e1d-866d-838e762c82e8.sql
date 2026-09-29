CREATE TABLE public.hosted_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  custom_domain text UNIQUE,
  verify_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(12),'hex'),
  domain_verified boolean NOT NULL DEFAULT false,
  storage_used bigint NOT NULL DEFAULT 0,
  deploys integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hosted_sites TO authenticated;
GRANT ALL ON public.hosted_sites TO service_role;
ALTER TABLE public.hosted_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sites" ON public.hosted_sites FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.site_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.hosted_sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_files TO authenticated;
GRANT ALL ON public.site_files TO service_role;
ALTER TABLE public.site_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own files" ON public.site_files FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Chave',
  prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own keys read" ON public.api_keys FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "own keys delete" ON public.api_keys FOR DELETE TO authenticated USING (auth.uid()=user_id);