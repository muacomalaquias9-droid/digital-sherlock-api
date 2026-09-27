CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_email_idx ON public.login_attempts (email, created_at DESC);
CREATE INDEX login_attempts_ip_idx ON public.login_attempts (ip, created_at DESC);
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_sessions_ip (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ip text NOT NULL,
  country text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_sessions_ip TO authenticated;
GRANT ALL ON public.user_sessions_ip TO service_role;
ALTER TABLE public.user_sessions_ip ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own session ip" ON public.user_sessions_ip FOR SELECT TO authenticated USING (auth.uid() = user_id);