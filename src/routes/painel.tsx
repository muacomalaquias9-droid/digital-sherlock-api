import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Radar, Flag, History, UserRound, Loader2, ShieldAlert, ShieldCheck, TrendingUp, Globe, Server, Bug, AlertTriangle,
  CheckCircle2, Lock, UserX, Mail, Printer, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { runScan, submitReport } from "@/lib/scan.functions";
import type { ScanResult, Finding } from "@/lib/scan.server";
import { AppIcon } from "@/components/AppIcon";

export const Route = createFileRoute("/painel")({
  validateSearch: (s: Record<string, unknown>) => ({ url: typeof s.url === "string" ? s.url : undefined }),
  head: () => ({
    meta: [
      { title: "Painel — GuardaWeb" },
      { name: "description", content: "Analise sites, veja relatórios de segurança e SEO e denuncie burlas." },
      { property: "og:title", content: "Painel GuardaWeb" },
      { property: "og:description", content: "Scanner de vulnerabilidades, SEO e denúncias." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Painel,
});

type Tab = "scan" | "report" | "history" | "profile";

function Painel() {
  const { user, loading } = useAuth();
  const { url } = Route.useSearch();
  const [tab, setTab] = useState<Tab>("scan");

  if (loading) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!user)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <AppIcon icon={Lock} size="xl" className="mx-auto" />
        <h1 className="mt-8 text-3xl font-extrabold">Entre para usar o scanner</h1>
        <p className="mt-2 text-muted-foreground">As análises e denúncias ficam guardadas na sua conta.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/auth" search={{ mode: "login" }} className="rounded-xl border-2 border-border px-5 py-3 font-bold">Entrar</Link>
          <Link to="/auth" search={{ mode: "signup" }} className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Criar conta</Link>
        </div>
      </div>
    );

  const tabs = [
    { id: "scan", icon: Radar, label: "Scanner", tone: "blue" },
    { id: "report", icon: Flag, label: "Denunciar", tone: "red" },
    { id: "history", icon: History, label: "Histórico", tone: "navy" },
    { id: "profile", icon: UserRound, label: "Perfil", tone: "sky" },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-4 gap-3 sm:flex sm:gap-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-2 rounded-3xl p-2 transition ${tab === t.id ? "" : "opacity-50 hover:opacity-80"}`}>
            <AppIcon icon={t.icon} tone={t.tone} size="lg" />
            <span className={`text-sm font-bold ${tab === t.id ? "text-primary" : ""}`}>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-10">
        {tab === "scan" && <Scanner initialUrl={url} onReport={() => setTab("report")} />}
        {tab === "report" && <ReportForm />}
        {tab === "history" && <HistoryView />}
        {tab === "profile" && <Profile />}
      </div>
    </div>
  );
}

const sevStyle: Record<Finding["severity"], string> = {
  critico: "bg-destructive text-destructive-foreground",
  alto: "bg-warning text-navy",
  medio: "bg-accent text-accent-foreground",
  baixo: "bg-muted text-muted-foreground",
  ok: "bg-success text-primary-foreground",
};
const sevLabel: Record<Finding["severity"], string> = { critico: "Crítico", alto: "Alto", medio: "Médio", baixo: "Baixo", ok: "OK" };
const catMeta = {
  seguranca: { icon: Bug, label: "Segurança", tone: "red" },
  erros: { icon: AlertTriangle, label: "Erros", tone: "amber" },
  seo: { icon: TrendingUp, label: "SEO", tone: "blue" },
  dominio: { icon: Globe, label: "Domínio & E-mail", tone: "navy" },
  servidor: { icon: Server, label: "Servidor", tone: "sky" },
  spam: { icon: UserX, label: "Spam & Phishing", tone: "amber" },
} as const;

function Scanner({ initialUrl, onReport }: { initialUrl?: string; onReport: () => void }) {
  const scan = useServerFn(runScan);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function go(target = url) {
    if (!target.trim()) return;
    setBusy(true);
    setResult(null);
    const r = await scan({ data: { url: target } }).catch((e) => ({ ok: false as const, error: String(e.message ?? e) }));
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setResult(r.result);
  }
  useEffect(() => { if (initialUrl) go(initialUrl); }, []); // eslint-disable-line

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); go(); }} className="flex gap-2 rounded-2xl border-2 border-foreground/80 bg-card p-2 print:hidden">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://site-a-analisar.com" className="min-w-0 flex-1 bg-transparent px-3 text-lg outline-none" />
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground disabled:opacity-60">
          {busy ? <Loader2 className="animate-spin" size={20} /> : <Radar size={20} strokeWidth={2.75} />} Analisar
        </button>
      </form>
      {busy && <p className="mt-6 text-center text-muted-foreground">A analisar cabeçalhos, páginas, DNS, domínio e certificado… (10–30 s)</p>}
      {result && <Report r={result} onReport={onReport} />}
    </div>
  );
}

export function Report({ r, onReport }: { r: ScanResult; onReport?: () => void }) {
  const tone = r.score >= 80 ? "text-success" : r.score >= 50 ? "text-warning" : "text-destructive";
  const counts = (s: Finding["severity"]) => r.findings.filter((f) => f.severity === s).length;
  const verdictUi = {
    legitimo: { icon: ShieldCheck, tone: "green", t: "Parece legítimo" },
    suspeito: { icon: AlertTriangle, tone: "amber", t: "Suspeito" },
    perigoso: { icon: ShieldAlert, tone: "red", t: "Perigoso — spam/burla" },
  }[r.spam.verdict as "legitimo" | "suspeito" | "perigoso"];

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="rounded-3xl border-2 border-border bg-card p-6 text-center">
          <p className="text-sm font-bold text-muted-foreground">Pontuação</p>
          <p className={`font-display text-8xl font-extrabold ${tone}`}>{r.score}</p>
          <p className="truncate font-bold">{r.host}</p>
          <p className="text-xs text-muted-foreground">{new Date(r.scannedAt).toLocaleString("pt-PT")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-3xl border-2 border-border bg-card p-5">
            <AppIcon icon={verdictUi.icon} tone={verdictUi.tone} size="md" />
            <div><p className="text-xs font-bold text-muted-foreground">Spam / fraude ({r.spam.score}/100)</p><p className="text-lg font-bold">{verdictUi.t}</p></div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl border-2 border-border bg-card p-5">
            <AppIcon icon={Lock} tone={r.certificate ? "green" : "red"} size="md" />
            <div className="min-w-0"><p className="text-xs font-bold text-muted-foreground">Certificado</p><p className="truncate font-bold">{r.certificate ? `${r.certificate.issuer}` : "Não encontrado"}</p>{r.certificate && <p className="text-xs text-muted-foreground">até {r.certificate.validTo.slice(0, 10)}</p>}</div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl border-2 border-border bg-card p-5">
            <AppIcon icon={Globe} tone="navy" size="md" />
            <div className="min-w-0"><p className="text-xs font-bold text-muted-foreground">Domínio {r.domain}</p><p className="truncate font-bold">{r.domainInfo?.registrar ?? "Registrador desconhecido"}</p><p className="text-xs text-muted-foreground">{r.domainInfo?.created ? `criado ${r.domainInfo.created.slice(0, 10)}` : "sem dados RDAP"}{r.domainInfo?.expires ? ` · expira ${r.domainInfo.expires.slice(0, 10)}` : ""}</p></div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl border-2 border-border bg-card p-5">
            <AppIcon icon={Server} tone="sky" size="md" />
            <div className="min-w-0"><p className="text-xs font-bold text-muted-foreground">Servidor {r.server.ip ?? ""}</p><p className="truncate font-bold">{r.server.isp ?? "Desconhecido"}</p><p className="text-xs text-muted-foreground">{[r.server.city, r.server.country, r.server.software].filter(Boolean).join(" · ")}</p></div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {(["critico", "alto", "medio", "baixo", "ok"] as const).map((s) => (
          <span key={s} className={`rounded-lg px-3 py-1 text-sm font-bold ${sevStyle[s]}`}>{sevLabel[s]}: {counts(s)}</span>
        ))}
        <button onClick={() => window.print()} className="ml-auto inline-flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2 font-bold"><Printer size={18} strokeWidth={2.75} /> Relatório PDF</button>
        {onReport && r.spam.verdict !== "legitimo" && (
          <button onClick={onReport} className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 font-bold text-destructive-foreground"><Flag size={18} strokeWidth={2.75} /> Denunciar</button>
        )}
      </div>

      {(Object.keys(catMeta) as (keyof typeof catMeta)[]).map((c) => {
        const list = r.findings.filter((f) => f.category === c).sort((a, b) => order(a.severity) - order(b.severity));
        if (!list.length) return null;
        const m = catMeta[c];
        return (
          <section key={c} className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-4"><AppIcon icon={m.icon} tone={m.tone} size="md" /><h3 className="text-2xl font-bold">{m.label}</h3></div>
            <ul className="mt-5 divide-y-2 divide-border">
              {list.map((f) => (
                <li key={f.id} className="flex gap-4 py-3">
                  <span className={`h-fit shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${sevStyle[f.severity]}`}>{sevLabel[f.severity]}</span>
                  <div className="min-w-0"><p className="font-bold">{f.title}</p><p className="break-words text-sm text-muted-foreground">{f.detail}</p></div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
const order = (s: Finding["severity"]) => ["critico", "alto", "medio", "baixo", "ok"].indexOf(s);

const categories = [
  ["phishing", "Phishing (roubo de dados)"],
  ["burla", "Burla / fraude financeira"],
  ["spam", "Spam"],
  ["malware", "Malware / vírus"],
  ["conteudo_sensivel", "Conteúdo sensível / ilegal"],
  ["roubo_identidade", "Imitação de empresa / identidade"],
] as const;

function ReportForm() {
  const send = useServerFn(submitReport);
  const [f, setF] = useState({ url: "", category: "phishing" as (typeof categories)[number][0], description: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { domain: string; registrar: string | null; registrarAbuse: string | null; hostName: string | null; hostAbuse: string | null }>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (f.description.trim().length < 10) return toast.error("Descreva o problema (mín. 10 caracteres)");
    setBusy(true);
    const r = await send({ data: f }).catch((err) => ({ ok: false as const, error: String(err.message ?? err) }));
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setDone(r);
    toast.success("Denúncia registada");
  }

  const mail = (to: string) => {
    const cat = categories.find((c) => c[0] === f.category)?.[1];
    const subject = `Abuse report: ${done?.domain} — ${cat}`;
    const body = `Hello,\n\nI would like to report the following website for abuse (${cat}):\n\nURL: ${f.url}\nDomain: ${done?.domain}\n\nDetails:\n${f.description}\n\nPlease investigate and take appropriate action (suspension / takedown).\n\nReported via GuardaWeb`;
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_380px]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border-2 border-border bg-card p-6">
        <h2 className="text-3xl font-extrabold">Denunciar um site</h2>
        <p className="text-muted-foreground">Identificamos o registrador do domínio e a empresa de alojamento, e preparamos a denúncia para os contactos oficiais de abuso.</p>
        <input required className="w-full rounded-xl border-2 border-input bg-background px-4 py-3" placeholder="URL do site" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <select className="w-full rounded-xl border-2 border-input bg-background px-4 py-3 font-semibold" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as any })}>
          {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <textarea required maxLength={2000} rows={5} className="w-full rounded-xl border-2 border-input bg-background px-4 py-3" placeholder="O que aconteceu? Ex.: o site pede dados do cartão fingindo ser o banco…" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-destructive px-6 py-3.5 font-bold text-destructive-foreground disabled:opacity-60">
          {busy ? <Loader2 className="animate-spin" size={20} /> : <Flag size={20} strokeWidth={2.75} />} Enviar denúncia
        </button>
      </form>
      <div className="space-y-4">
        {!done ? (
          <div className="rounded-3xl bg-secondary p-6">
            <AppIcon icon={ShieldAlert} tone="red" size="md" />
            <p className="mt-4 font-bold text-secondary-foreground">Como funciona</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-secondary-foreground">
              <li>Consultamos o RDAP do domínio e do IP.</li>
              <li>Obtemos os e-mails oficiais de abuso.</li>
              <li>Registamos a denúncia na sua conta.</li>
              <li>Envia a denúncia pronta ao registrador e ao alojamento.</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-4 rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3"><CheckCircle2 className="text-success" size={28} strokeWidth={2.75} /><p className="text-lg font-bold">Denúncia registada</p></div>
            <Contact title="Registrador do domínio" name={done.registrar} email={done.registrarAbuse} href={done.registrarAbuse ? mail(done.registrarAbuse) : null} />
            <Contact title="Alojamento / servidor" name={done.hostName} email={done.hostAbuse} href={done.hostAbuse ? mail(done.hostAbuse) : null} />
            <p className="text-xs text-muted-foreground">Para burlas em Angola pode também contactar o INACOM e o SIC.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Contact({ title, name, email, href }: { title: string; name: string | null; email: string | null; href: string | null }) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <p className="text-xs font-bold text-muted-foreground">{title}</p>
      <p className="font-bold">{name ?? "Não identificado"}</p>
      {email ? (
        <a href={href!} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Mail size={16} strokeWidth={2.75} /> Enviar para {email}</a>
      ) : (
        <p className="text-sm text-muted-foreground">Sem e-mail de abuso público.</p>
      )}
    </div>
  );
}

type ScanRow = { id: string; url: string; score: number; created_at: string; result: any };
type ReportRow = { id: string; domain: string; category: string; status: string; abuse_email: string | null; created_at: string };

function HistoryView() {
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [open, setOpen] = useState<ScanRow | null>(null);

  async function load() {
    const [s, r] = await Promise.all([
      supabase.from("scans").select("id,url,score,created_at,result").order("created_at", { ascending: false }).limit(50),
      supabase.from("reports").select("id,domain,category,status,abuse_email,created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    setScans((s.data as ScanRow[]) ?? []);
    setReports((r.data as ReportRow[]) ?? []);
  }
  useEffect(() => {
    load();
    const ch = supabase
      .channel("history")
      .on("postgres_changes", { event: "*", schema: "public", table: "scans" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (open) return (<div><button onClick={() => setOpen(null)} className="rounded-xl border-2 border-border px-4 py-2 font-bold">← Voltar</button><Report r={open.result} /></div>);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="text-2xl font-extrabold">Análises</h2>
        <ul className="mt-4 space-y-3">
          {scans.length === 0 && <li className="text-muted-foreground">Ainda não fez nenhuma análise.</li>}
          {scans.map((s) => (
            <li key={s.id} className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4">
              <span className={`font-display text-3xl font-extrabold ${s.score >= 80 ? "text-success" : s.score >= 50 ? "text-warning" : "text-destructive"}`}>{s.score}</span>
              <button onClick={() => setOpen(s)} className="min-w-0 flex-1 text-left"><p className="truncate font-bold">{s.url}</p><p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-PT")}</p></button>
              <button aria-label="Apagar" onClick={() => supabase.from("scans").delete().eq("id", s.id).then(load)} className="text-muted-foreground hover:text-destructive"><Trash2 size={18} strokeWidth={2.5} /></button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-extrabold">Denúncias</h2>
        <ul className="mt-4 space-y-3">
          {reports.length === 0 && <li className="text-muted-foreground">Nenhuma denúncia enviada.</li>}
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border-2 border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2"><p className="truncate font-bold">{r.domain}</p><span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{r.status}</span></div>
              <p className="text-xs text-muted-foreground">{r.category.replace("_", " ")} · {new Date(r.created_at).toLocaleString("pt-PT")}{r.abuse_email ? ` · ${r.abuse_email}` : ""}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Profile() {
  const { user } = useAuth();
  const [p, setP] = useState<any>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setP(data));
  }, [user]);
  if (!p) return <Loader2 className="animate-spin text-primary" />;
  const rows = [
    ["Nome", p.full_name], ["E-mail", p.email], [p.doc_type, p.doc_number], ["Data de nascimento", p.birth_date], ["Idade", p.age], ["Empresa", p.company_name],
  ];
  return (
    <div className="max-w-xl rounded-3xl border-2 border-border bg-card p-6">
      <div className="flex items-center gap-4"><AppIcon icon={UserRound} tone="sky" size="lg" /><h2 className="text-3xl font-extrabold">{p.full_name || "O meu perfil"}</h2></div>
      <dl className="mt-6 divide-y-2 divide-border">
        {rows.map(([k, v]) => (<div key={k} className="flex justify-between gap-4 py-3"><dt className="font-bold text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v || "—"}</dd></div>))}
      </dl>
    </div>
  );
}
