import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bug, Search, Globe, Lock, Flag, Server, UserX, Mail, ArrowRight, TrendingUp } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GuardaWeb — Scanner de vulnerabilidades, SEO e denúncia de sites" },
      { name: "description", content: "Analise qualquer site: vulnerabilidades, erros, SEO, domínio, certificado SSL e spam. Denuncie burlas diretamente ao registrador." },
      { property: "og:title", content: "GuardaWeb — Segurança de sites em Angola" },
      { property: "og:description", content: "Vulnerabilidades, SEO, domínio, SSL e deteção de spam num só relatório." },
    ],
  }),
  component: Home,
});

const apps = [
  { icon: Bug, tone: "red", t: "Vulnerabilidades", d: "Cabeçalhos, cookies, ficheiros expostos, bibliotecas antigas." },
  { icon: TrendingUp, tone: "blue", t: "SEO", d: "Título, descrição, H1, sitemap, robots e telemóvel." },
  { icon: Globe, tone: "navy", t: "Domínio", d: "Registrador, idade, expiração e servidores DNS." },
  { icon: Lock, tone: "green", t: "Certificado SSL", d: "Emissor, validade e cifra da ligação." },
  { icon: UserX, tone: "amber", t: "Spam & Phishing", d: "Imitação de marcas, palavras de burla, código ofuscado." },
  { icon: Server, tone: "sky", t: "Servidor / VPS", d: "IP, fornecedor, país e tecnologia exposta." },
  { icon: Mail, tone: "blue", t: "E-mail (SPF/DMARC)", d: "Proteção contra falsificação de remetente." },
  { icon: Flag, tone: "red", t: "Denunciar", d: "Enviamos ao registrador e ao alojamento do site." },
] as const;

function Home() {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <section className="border-b-2 border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <p className="mb-5 inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
              Segurança · SEO · Domínios · Engenharia social
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.02] md:text-7xl">
              Veja o que está <span className="text-primary">errado</span> no seu site antes dos atacantes.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Um relatório claro com vulnerabilidades, erros, SEO, certificado e domínio. Se o site for burla, denuncie-o
              diretamente a quem o registou e alojou.
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); navigate({ to: "/painel", search: { url: url || undefined } }); }}
              className="mt-8 flex max-w-xl gap-2 rounded-2xl border-2 border-foreground/80 bg-background p-2"
            >
              <Search className="ml-2 mt-3 shrink-0 text-muted-foreground" size={22} strokeWidth={2.75} />
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="exemplo.co.ao" className="min-w-0 flex-1 bg-transparent px-2 text-lg outline-none" />
              <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">
                Analisar <ArrowRight size={18} strokeWidth={2.75} />
              </button>
            </form>
          </div>
          <div className="grid grid-cols-3 content-center gap-x-4 gap-y-8 justify-items-center">
            {apps.slice(0, 6).map((a) => (
              <div key={a.t} className="flex flex-col items-center gap-3">
                <AppIcon icon={a.icon} tone={a.tone} size="xl" />
                <span className="text-center text-sm font-bold">{a.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-4xl font-extrabold">Tudo o que verificamos</h2>
        <p className="mt-2 text-muted-foreground">Cada análise corre em tempo real contra o site, o DNS, o RDAP e os registos públicos de certificados.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {apps.map((a) => (
            <div key={a.t} className="rounded-3xl border-2 border-border bg-card p-6">
              <AppIcon icon={a.icon} tone={a.tone} size="md" />
              <h3 className="mt-6 text-xl font-bold">{a.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-primary p-10 text-primary-foreground md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold">Crie a sua conta com NIF ou BI</h2>
            <p className="mt-2 opacity-90">Os seus dados são preenchidos automaticamente a partir do número do documento.</p>
          </div>
          <Link to="/auth" search={{ mode: "signup" }} className="rounded-xl bg-card px-6 py-3.5 font-bold text-primary">Começar agora</Link>
        </div>
      </section>
    </>
  );
}
