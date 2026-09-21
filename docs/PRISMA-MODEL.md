# FitHub — Prisma

**Etapa 4 de 10** — Arquitetura ✅ → DDD ✅ → Banco de Dados ✅ → **Prisma** → Backend → Frontend → Mobile → Testes → Docker → Deploy

> Continuação de `DATABASE-MODEL.md`. `schema.prisma` é a tradução 1:1 do `database/schema.sql`, com um refinamento: enums nativos do Postgres no lugar de `VARCHAR + CHECK`.

## Sumário

1. O que mudou desde a Etapa 3
2. Convenções de mapeamento
3. O que o Prisma schema não consegue expressar
4. Fluxo de migration real (o que acontece na Etapa 5)
5. A Prisma Client Extension de tenant
6. Decisões desta etapa
7. Próxima etapa

## 1. O que mudou desde a Etapa 3

Toda coluna que era `VARCHAR(N) + CHECK (valor IN (...))` no `schema.sql` virou `enum` no `schema.prisma` — é o que o Prisma gera nativamente (`CREATE TYPE ... AS ENUM`) e é mais correto e mais barato em storage que `VARCHAR` com constraint. Efeito prático: a migration real (Etapa 5) diverge um pouco do `schema.sql` original nesses campos — troca localizada, documentada aqui para não virar surpresa.

`Workout.status` e `Diet.status` compartilham o mesmo enum (`LifecycleStatus`) em vez de dois enums idênticos — mesma state machine, sem motivo pra duplicar o tipo.

## 2. Convenções de mapeamento

| Postgres (Etapa 3) | Prisma (Etapa 4) |
|---|---|
| `snake_case` (tabela e coluna) | `camelCase` no client, com `@map`/`@@map` preservando o nome real no banco |
| `UUID DEFAULT gen_random_uuid()` | `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` — não usei o `uuid()` nativo do Prisma de propósito, pra manter a geração no banco, não na aplicação |
| `VARCHAR(N) + CHECK` | `enum` nativo (seção 1) |
| `NUMERIC(p,s)` | `Decimal @db.Decimal(p, s)` |
| `SMALLINT` / `INTEGER` | `Int @db.SmallInt` / `Int` |
| `JSONB` | `Json @db.JsonB` |
| `TIMESTAMPTZ` | `DateTime @db.Timestamptz` |
| `DATE` | `DateTime @db.Date` |
| `TIME` | `DateTime @db.Time` |
| `VARCHAR(N)[]` | `String[]` (ou `Enum[]` pra `equipment`) |

## 3. O que o Prisma schema não consegue expressar

Prisma não tem `CHECK` constraint nem índice único parcial (`WHERE`) na sintaxe declarativa. Isso já estava todo escrito em `database/schema.sql` (Etapa 3) — não é código novo, é código que fica **fora** do `schema.prisma` e precisa ir como SQL manual na migration (seção 4):

| Item | Por quê o Prisma não cobre |
|---|---|
| `chk_admin_no_tenant` (role=ADMIN ⇒ tenant_id NULL) | Checagem cruzada entre duas colunas — Prisma não tem `CHECK` |
| `chk_assessments_weight` (0 < peso ≤ 400) | Faixa numérica — mesma limitação |
| `chk_feedback_scales` (0–10 em 6 colunas) | Mesma limitação |
| `uq_users_email_admin` (único WHERE tenant_id IS NULL) | Índice único parcial — Prisma `@@unique` não tem `WHERE` |
| `uq_workouts_active_label` (único WHERE status='ACTIVE') | Mesma limitação |
| `uq_diets_active_name` (único WHERE status='ACTIVE') | Mesma limitação |
| Todo `row-level-security.sql` | RLS não existe na sintaxe do Prisma, ponto final |

Note que `uq_students_email_per_tenant` **não** está nessa lista — como o `NULL` fica na coluna `email` (não em `tenantId`), o comportamento padrão do Postgres (`NULL` nunca colide com `NULL`) já dá o resultado certo com um `@@unique` comum, sem precisar de `WHERE`. Só o caso do `User` (onde o `NULL` fica em `tenantId`, a coluna que "âncora" o grupo de unicidade) exige o índice parcial.

## 4. Fluxo de migration real (o que acontece na Etapa 5)

Não vou inventar uma pasta `migrations/xxxxx_init/` agora — os timestamps são gerados pela CLI do Prisma de verdade, fabricar isso aqui só criaria inconsistência. O fluxo real na Etapa 5:

1. `prisma migrate dev --create-only` gera a migration inicial a partir do `schema.prisma` (tabelas, colunas, enums, FKs, índices "normais").
2. Antes de aplicar, o arquivo gerado é complementado com os itens da seção 3 acima — na prática, `database/schema.sql` já contém tudo isso desde a Etapa 3, então é colar os `CONSTRAINT chk_*` e os índices únicos parciais que faltarem.
3. `database/row-level-security.sql` entra como uma segunda migration, sempre depois da primeira (RLS pressupõe que as tabelas já existem).
4. Só depois disso `prisma migrate deploy` (produção) ou `prisma migrate dev` (local) aplicam de fato.

Resultado: `schema.prisma` continua sendo a fonte da verdade pro *client* TypeScript; `database/schema.sql` + `row-level-security.sql` continuam sendo a fonte da verdade pro *banco*. As duas ficam sincronizadas manualmente nos pontos da seção 3 — é o preço de usar RLS com Prisma, não tem como fugir disso com nenhum ORM atual.

## 5. A Prisma Client Extension de tenant

`tenant-scoped.extension.ts` implementa os 3 padrões da seção 10 do `DATABASE-MODEL.md` em código: `STANDARD_TENANT_MODELS` (Padrão A), `HYBRID_CATALOG_MODELS` (Padrão B, `OR tenant_id IS NULL`), `ADMIN_AWARE_MODELS` (Padrão C, respeita `ctx.isPlatformAdmin`). `tenant-context.service.ts` é o `AsyncLocalStorage` que a extension consulta — populado por um Guard na Etapa 5, não aqui.

Limitação registrada no próprio código: o merge de `where` é raso (`{...where, tenantId}`). Cobre bem o caso comum de repositório (filtro simples), mas uma query que já monte um `OR`/`AND` complexo no `where` merece revisão manual pra garantir que o filtro de tenant não acabe "dentro" do OR de um jeito que enfraqueça a condição. Vale um teste de integração específico pra isso na Etapa 8.

## 6. Decisões desta etapa

1. **Enum nativo em vez de VARCHAR+CHECK** (seção 1) — divergência pequena e deliberada do `schema.sql` original.
2. **`@default(dbgenerated("gen_random_uuid()"))` em vez de `@default(uuid())`** — geração do UUID fica no banco (Postgres), não na aplicação; mantém `schema.sql` e `schema.prisma` gerando o mesmo tipo de valor.
3. **Nenhuma migration "fake" foi criada** — a real sai rodando a CLI na Etapa 5, seguindo o fluxo da seção 4.
4. **Merge raso no `where` da extension** — funcional pro caso comum, com a limitação documentada em vez de escondida.

## 7. Próxima etapa

Etapa 5 — Backend: aqui entra o grosso do NestJS — os Use Cases da Application layer consumindo os repositórios (implementando as interfaces da Etapa 2 com Prisma de verdade), os Controllers, Guards (incluindo o `JwtAuthGuard` que popula o `TenantContextService`), a migration real rodando, o `EventEmitter2` publicando os Domain Events da Etapa 2, e os primeiros endpoints REST funcionando de ponta a ponta pro módulo Students.
