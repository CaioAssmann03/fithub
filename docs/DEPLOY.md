# FitHub — Deploy

**Etapa 7 (fora da ordem original)** — ... → Frontend: Web ✅ → Treino: blocos de série e periodização ✅ → **Deploy: preparação** → Dieta → Mobile (opcional) → Testes formais → Docker (imagens de produção)

> Usuário perguntou "quando podemos subir pro Vercel?" antes de a Dieta estar pronta. Esta etapa cobre só a **preparação** — repositório git, `.gitignore`, e o mapeamento de qual peça vai em qual serviço — não a execução completa, porque criar conta/projeto em Vercel/Railway e autorizar OAuth são ações que só o próprio usuário pode fazer (login real, cartão em alguns casos). O que dá pra automatizar (git init, commit, criação do repo no GitHub) foi feito; o resto é um checklist manual guiado abaixo.

## 1. Por que "subir pro Vercel" não é a resposta inteira

Vercel serve bem o `apps/web` (Next.js — é o caso de uso nativo da plataforma). Mas `apps/api` é uma API NestJS com conexão persistente ao Postgres via Prisma — rodar isso como função serverless da Vercel é o cenário clássico de esgotar o pool de conexões do banco a cada cold start. A arquitetura recomendada separa as três peças:

| Peça | Onde | Por quê |
|---|---|---|
| `apps/web` | **Vercel** | Next.js nativo, zero config além do Root Directory |
| `apps/api` | **Railway** (ou Render/Fly, equivalentes) | Processo Node persistente; já existe `apps/api/Dockerfile` pronto (multi-stage, roda `prisma migrate deploy` no boot) |
| Postgres + Redis | **Railway** (addons do mesmo projeto) | Menor fricção — um único projeto/dashboard pro backend inteiro. Neon/Supabase/Upstash são alternativas válidas se preferir separar |

## 2. Descobertas ao preparar (não são código novo, são o estado real do projeto)

1. **`pnpm-workspace.yaml` existe na raiz mas nunca foi usado de verdade.** Cada app tem seu próprio `package-lock.json` (`apps/api`, `apps/web`) gerado via `npm install` rodado dentro da própria pasta — não há lockfile na raiz, e `pnpm` nem está instalado nesta máquina. Isso não bloqueia o deploy (documentado abaixo, a configuração da Vercel funciona com `npm` puro), só é uma divergência entre o `CLAUDE.md`/`ARCHITECTURE.md` (que descrevem o workspace como pnpm) e a prática real. Não removi o arquivo — não é decisão minha trocar a ferramenta de workspace por conta própria.
2. **`RedisService` (`apps/api/src/infra/cache/redis.service.ts`) criava o client do `ioredis` sem listener de erro.** Uma queda de conexão — situação normal em produção, não hipotética — emite `error` sem ninguém ouvindo, e isso derruba o processo Node inteiro (comportamento padrão de `EventEmitter`). Corrigido: um listener mínimo que loga e deixa o `ioredis` reconectar sozinho (já é o comportamento dele por trás). Sem isso, a API ficaria reiniciando em loop toda vez que o Redis gerenciado tivesse uma hiccup de rede.
3. **`.env`/`.env.local` reais existiam mas não havia `.gitignore`** — antes de qualquer commit, criado `.gitignore` na raiz cobrindo `node_modules`, `.env*` (exceto `.env.example`), builds (`dist`, `.next`), e `.claude/` (config local do Claude Code, não é do projeto).

## 3. O que já foi feito

- `git init` na raiz + `.gitignore` + commit inicial (309 arquivos, confirmado que nenhum `.env` real ou `node_modules` entrou).
- Correção do `RedisService` acima.
- Este documento.

## 4. Variáveis de ambiente em produção

**`apps/api`** (Railway):

| Variável | Valor em produção |
|---|---|
| `DATABASE_URL` | Fornecida automaticamente pelo addon Postgres do Railway |
| `REDIS_URL` | Fornecida automaticamente pelo addon Redis do Railway |
| `JWT_SECRET` | **Gerar um novo** (`openssl rand -base64 32` ou similar) — nunca reusar o valor de exemplo do `.env.example` |
| `CORS_ORIGIN` | Domínio da Vercel depois de criado (ex: `https://fithub-web.vercel.app`) — sem isso, `main.ts` reflete qualquer origem, aceitável só em dev |
| `PORT` | Railway injeta sozinho — não precisa setar |

**`apps/web`** (Vercel):

| Variável | Valor em produção |
|---|---|
| `NEXT_PUBLIC_API_URL` | Domínio da API no Railway + `/api/v1` (ex: `https://fithub-api.up.railway.app/api/v1`) |

Ordem de configuração importa: subir a API primeiro (pra ter o domínio), depois a Vercel com esse domínio, depois voltar na API e trocar `CORS_ORIGIN` pelo domínio real da Vercel.

## 5. Configuração da Vercel para o monorepo

`packages/shared-types` não tem build próprio — é consumido como TS fonte via `transpilePackages` (já configurado em `apps/web/next.config.ts`), e fica **fora** de `apps/web` (`../../packages/shared-types`). Isso exige um ajuste manual no projeto Vercel, porque por padrão a Vercel só enxerga arquivos dentro do Root Directory:

1. **Root Directory**: `apps/web`
2. **Settings → General → marcar "Include files outside the Root Directory in the Build Step"** — sem isso, o build falha ao resolver `@fithub/shared-types` (que é um `file:../../packages/shared-types` no `package.json`)
3. Framework Preset: Next.js (auto-detectado). Build/Install command: default (`npm run build` / `npm install`) — não precisa de `vercel.json`.

## 6. Checklist manual (só o usuário pode fazer — login/conta em serviço externo)

- [ ] Criar repositório no GitHub e dar `git push` (posso fazer a parte de criar+enviar com o `gh` já autenticado nesta máquina, assim que confirmar nome e visibilidade — pushing é uma ação que preciso de autorização explícita pra cada vez)
- [ ] Criar projeto na Vercel, importar o repo, aplicar a config da seção 5, setar `NEXT_PUBLIC_API_URL` (placeholder até a API existir)
- [ ] Criar projeto no Railway, adicionar addons Postgres + Redis, apontar deploy pro `apps/api/Dockerfile`, setar `JWT_SECRET`/`CORS_ORIGIN`
- [ ] Depois de ambos no ar: atualizar `CORS_ORIGIN` na API e `NEXT_PUBLIC_API_URL` na Vercel com os domínios reais, redeploy dos dois

## 7. Limitações conhecidas / não incluído nesta etapa

- Tokens de auth continuam em `localStorage` (não httpOnly cookie) — funciona em produção, mas é a mesma decisão de segurança já registrada em `docs/FRONTEND-WEB.md`, não mudou aqui.
- Sem CI (GitHub Actions) rodando `npm test`/`npm run build` a cada push — Vercel/Railway rodam o build deles próprios, mas não os testes. Fica pra uma etapa de "Testes formais" se o usuário quiser esse gate.
- Sem domínio próprio configurado (usa os subdomínios `*.vercel.app`/`*.up.railway.app` de cada plataforma).

## 8. Próxima etapa

Dieta (macros, substituições, tabela de equivalência, refeição livre, suplementos) — combinado com o usuário como a próxima etapa de domínio, antes de Mobile. O checklist da seção 6 pode ser executado em paralelo, já que não depende da Dieta.
