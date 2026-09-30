# 🚀 Guia de Deploy Automático - Digital Sherlock API

## Deploy na Vercel com guardaweb.info

### ✅ O que foi configurado automaticamente

- ✅ `vercel.json` - Configuração do domínio e variáveis de ambiente
- ✅ `scripts/setup-vercel-env.sh` - Script para configurar variáveis do Supabase
- ✅ Auto-deploy em cada push para `main`

---

## 🔧 Passo 1: Instalar Vercel CLI (primeira vez)

```bash
npm install -g vercel
```

---

## 🔑 Passo 2: Configurar Variáveis de Ambiente do Supabase

### Opção A: Automática (Recomendado) ⚡

```bash
bash scripts/setup-vercel-env.sh
```

Você será solicitado para inserir:
1. **URL do Supabase** (ex: `https://dihzcnfysysszztyaynr.supabase.co`)
2. **SERVICE ROLE KEY** (da aba Settings → API → Service role secret)
3. **PUBLISHABLE KEY** (da aba Settings → API → anon public)

### Opção B: Manual (Dashboard Vercel)

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto `digital-sherlock-api`
3. Vá para **Settings → Environment Variables**
4. Adicione as 4 variáveis:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 📤 Passo 3: Deploy Automático

Simples! Basta fazer push para a branch `main`:

```bash
git add .
git commit -m "feat: novo recurso"
git push origin main
```

**O Vercel fará o deploy automaticamente!** 🎉

---

## ✨ Passo 4: Conectar Domínio guardaweb.info (opcional)

Se o domínio ainda não está conectado:

1. Na dashboard do Vercel
2. Seu projeto → **Settings → Domains**
3. Adicione `guardaweb.info` e `www.guardaweb.info`
4. Configure os registros DNS conforme instruído

---

## 🔍 Verificar Status do Deploy

```bash
# Ver deployments recentes
vercel ls

# Ver status do último deploy
vercel inspect
```

---

## 📋 Checklist Final

- [ ] Vercel CLI instalado (`vercel --version`)
- [ ] Variáveis de ambiente configuradas
- [ ] `git push` executado
- [ ] Deploy concluído (check em https://vercel.com/dashboard)
- [ ] Site acessível em `https://guardaweb.info`

---

## 🚨 Troubleshooting

### ❌ "Missing Supabase environment variables"

**Solução**: Rode novamente:
```bash
bash scripts/setup-vercel-env.sh
```

### ❌ Domínio não funciona

Verifique registros DNS em:
- Seu painel de DNS do domínio
- Confirme que aponta para `cname.vercel-dns.com`

### ❌ Deploy falha na build

1. Verifique logs: `vercel logs`
2. Confirme variáveis: `vercel env ls`
3. Tente redeploy: `vercel deploy --prod`

---

**Pronto! 🎉 Seu site está em deploy automático!**

Para mais info: https://vercel.com/docs