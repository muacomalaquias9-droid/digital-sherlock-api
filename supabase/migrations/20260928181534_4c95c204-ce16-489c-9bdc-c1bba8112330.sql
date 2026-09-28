CREATE TABLE public.blocked_domains (
  domain text PRIMARY KEY,
  reason text NOT NULL,
  spam_score int NOT NULL DEFAULT 0,
  reports int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.blocked_domains TO service_role;
ALTER TABLE public.blocked_domains ENABLE ROW LEVEL SECURITY;