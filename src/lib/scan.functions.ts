import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeSite, normalizeUrl, rdapDomain, rdapIp } from "./scan.server";

export const runScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().trim().min(3).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      const result = await analyzeSite(data.url);
      const { data: row, error } = await context.supabase
        .from("scans")
        .insert({ user_id: context.userId, url: result.host, score: result.score, result: result as any })
        .select("id")
        .single();
      if (error) console.error(error);
      return { ok: true as const, id: row?.id ?? null, result };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message || "Falha na análise" };
    }
  });

export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        url: z.string().trim().min(3).max(500),
        category: z.enum(["phishing", "burla", "spam", "malware", "conteudo_sensivel", "roubo_identidade"]),
        description: z.string().trim().min(10).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let host: string;
    try {
      host = normalizeUrl(data.url).hostname.replace(/^www\./, "");
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
    const rdap = await rdapDomain(host.split(".").slice(-2).join("."));
    let hostAbuse: string | null = null;
    let hostName: string | null = null;
    try {
      const r = await fetch(`https://dns.google/resolve?name=${host}&type=A`);
      const j: any = await r.json();
      const ip = (j.Answer || []).map((a: any) => a.data).find((x: string) => /^\d+\.\d+\.\d+\.\d+$/.test(x));
      if (ip) {
        const ipr = await rdapIp(ip);
        hostAbuse = ipr?.abuseEmail ?? null;
        hostName = ipr?.name ?? null;
      }
    } catch {}
    const abuse = [rdap?.abuseEmail, hostAbuse].filter(Boolean).join(", ") || null;
    const { error } = await context.supabase.from("reports").insert({
      user_id: context.userId,
      url: data.url,
      domain: host,
      category: data.category,
      description: data.description,
      registrar: rdap?.registrar ?? hostName,
      abuse_email: abuse,
    });
    if (error) return { ok: false as const, error: "Não foi possível registar a denúncia" };
    return { ok: true as const, domain: host, registrar: rdap?.registrar ?? null, registrarAbuse: rdap?.abuseEmail ?? null, hostName, hostAbuse };
  });

export const lookupDocument = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ type: z.enum(["nif", "bi"]), number: z.string().trim().regex(/^[A-Za-z0-9]{6,20}$/) }).parse(d))
  .handler(async ({ data }) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 45000);
    try {
      const r = await fetch(`https://angolaapi.onrender.com/api/v1/validate/${data.type}/${encodeURIComponent(data.number.toUpperCase())}`, { signal: ctrl.signal });
      const j: any = await r.json().catch(() => null);
      if (!j) return { ok: false as const, error: "Serviço de validação indisponível" };
      const flat: Record<string, string> = {};
      const walk = (o: any, p = "") => {
        if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, k);
        else if (o != null && p) flat[p.toLowerCase()] = String(o);
      };
      walk(j);
      const find = (...keys: string[]) => {
        for (const k of Object.keys(flat)) if (keys.some((x) => k.includes(x))) return flat[k];
        return "";
      };
      const failed = j.success === false || j.sucess === false || j.valid === false;
      const name = find("nome", "name", "contribuinte", "razao");
      if (failed && !name) return { ok: false as const, error: j.message && !/status code/i.test(j.message) ? j.message : "Documento não encontrado" };
      return {
        ok: true as const,
        data: {
          name,
          birthDate: find("nascimento", "birth", "data_nasc"),
          company: find("empresa", "company", "entidade", "razao_social"),
          address: find("morada", "endereco", "address", "residencia"),
          raw: flat,
        },
      };
    } catch {
      return { ok: false as const, error: "O serviço de validação demorou demasiado. Tente novamente." };
    } finally {
      clearTimeout(t);
    }
  });
