# CLAUDE.md

Este arquivo orienta o Claude Code ao trabalhar neste repositório.

## O que é o FitHub

SaaS multi-tenant para Personal Trainers gerenciarem alunos, treinos, avaliações físicas, dietas, feedback e agenda. Cada personal trainer é um tenant isolado — **isolamento de tenant é a restrição mais importante do projeto**, repetida em todo `docs/ARCHITECTURE.md`.

## Estado real do código — leia isto antes de qualquer coisa

**Este projeto está em construção ativa, não é um MVP completo.** Foi interrompido no meio da implementação do backend. Especificamente:

- ❌ **`apps/api` não compila no estado atual.** `app.module.ts` importa `TenancyModule` e `AdminModule` de `./modules/tenancy/tenancy.module` e `./modules/admin/admin.module` — **esses arquivos não existem**, as pastas `modules/tenancy/` e `modules/admin/` estão vazias.
- ⚠️ **Módulo `notifications` está incompleto**: existem entidade, repositório, mapper e 3 use cases (`create`, `list`, `mark-read`), mas faltam os event handlers (que reagem a eventos de outros módulos como `StudentCreatedEvent`, `WorkoutAssignedEvent`, `FeedbackSubmittedEvent`, `AppointmentScheduledEvent`, `RefreshTokenReuseDetectedEvent`), o controller, e o `notifications.module.ts` em si.
- ❌ **`apps/web` (frontend Next.js) não existe.** Nenhum arquivo foi criado ainda.
- ❌ **`apps/mobile` (Expo/React Native) não existe.** Nenhum arquivo foi criado ainda.
- ✅ Os módulos **auth, students, assessments, workouts, exercises, feedback, appointments, foods, diets, dashboard, health** estão implementados (domain → application → infrastructure → presentation completos).
- ✅ As duas migrations reais do Prisma existem em `apps/api/prisma/migrations/` e devem aplicar sem erro (`npx prisma migrate deploy`).
- ✅ Testes de domínio existem para Student, Workout, BodyMetricsCalculator, e um teste de integração crítico (`test/tenant-isolation.e2e-spec.ts`) que valida isolamento de tenant contra a Prisma Client Extension real.
- ⚠️ **Nada disso foi executado ainda** — nenhum `npm install` rodou, nenhum Postgres real foi conectado. Espere erros de compilação além dos já conhecidos acima.

`docs/` só tem os documentos das etapas iniciais (`ARCHITECTURE.md`, `DDD-MODEL.md`, `DATABASE-MODEL.md`, `PRISMA-MODEL.md`, `BACKEND-AUTH.md`, `BACKEND-CORE-DOMAIN.md`, `BACKEND-STUDENTS.md`) — não existem docs de Frontend, Mobile, Testes, Docker ou Deploy porque essas etapas ainda não foram (re)construídas nesta cópia do projeto.

## Sua missão, nesta ordem de prioridade

1. **Fazer `apps/api` compilar.** Construa `TenancyModule` e `AdminModule` (domain → application → infrastructure → presentation, mesmo padrão dos módulos já existentes — veja `apps/api/src/modules/students/` como referência mais completa de exemplo). Complete `notifications` (event handlers, controller, module). Depois disso, `npm run build` em `apps/api` deve passar.
2. **Rodar os testes existentes** (`npm test` e `npm run test:e2e`, este último precisa do Postgres do `docker-compose.dev.yml` rodando) e corrigir o que aparecer.
3. **Construir `apps/web`** (Next.js) — painel do personal trainer (alunos, avaliações, treinos, dietas, exercícios, alimentos, agenda, notificações, configurações) e uma tela mínima de painel do aluno (check-in de feedback). Next.js 16, React 19, Tailwind CSS 4 (CSS-first, `@theme`). Consumir a API via `NEXT_PUBLIC_API_URL`.
4. **Mobile fica por último e é opcional** — só entre nisso se o backend e o web já estiverem funcionando de ponta a ponta. Se for construir, use Expo SDK 54 especificamente (não a versão mais nova) porque é a única combinação oficialmente testada com NativeWind, que você deve usar pra reaproveitar os tokens de design do web.

## Estrutura do monorepo

```
apps/
  api/       NestJS — Clean Architecture + DDD, monólito modular
  web/       (não existe ainda — a construir)
  mobile/    (não existe ainda — opcional, por último)
packages/
  shared-types/   tipos TS compartilhados (Auth + Student)
database/    SQL de referência conceitual
docs/        docs das etapas já feitas — leia antes de mexer na arquitetura
```

Workspace: pnpm (`pnpm-workspace.yaml` na raiz).

## Regras de arquitetura que não podem ser quebradas

1. **Isolamento de tenant.** Toda tabela tenant-scoped tem `tenant_id`. Toda query passa pela Prisma Client Extension (`apps/api/src/infra/prisma/tenant-scoped.extension.ts`), que injeta o filtro automaticamente — nunca remova isso nem crie um repositório com `new PrismaClient()` direto. RLS no Postgres é a camada redundante (aplicada via a migration `constraints_and_rls`).
2. **Um módulo nunca importa o repositório Prisma de outro módulo diretamente** — só a interface de domínio via injeção de dependência, ou reage a Domain Events. Exceção pragmática já existente: `FeedbackModule` injeta `STUDENT_REPOSITORY` (comentado no próprio código) porque precisa resolver `studentId` a partir do `userId` do token de forma síncrona.
3. **Clean Architecture**: `domain/` não importa NestJS nem Prisma. `application/` (Use Cases) só depende de interfaces definidas em `domain/`. `infrastructure/` implementa essas interfaces. `presentation/` (controllers) chama Use Cases, nunca repositório direto.
4. **Result pattern** para erro de negócio esperado (`core/domain/result.ts`, classe `Result<T, DomainError>`) — exception fica reservada pra falha de infra ou bug real.
5. **`reconstitute()` vs `create()`**: toda entidade reidratada do banco usa `reconstitute()` (sem validação, sem domain event); `create()` é só pro nascimento de uma entidade nova.
6. **Aggregates estendem `AggregateRoot<Props>`** (`core/domain/aggregate-root.ts`), que já traz `domainEvents`, `addDomainEvent()` e `pullDomainEvents()` prontos — não reimplemente esse mecanismo numa entidade nova (já aconteceu uma vez nesta base de código com `Appointment` e foi corrigido).
7. **`IDomainEventPublisher`** se importa de `infra/events/domain-event-publisher.service.ts` (que reexporta a interface definida em `core/domain/domain-event.ts`) — não do arquivo de `core/` diretamente, por convenção já estabelecida em todos os Use Cases existentes.

## Stack e versões — pinadas de propósito

| Peça | Versão | Por que não é a mais recente |
|---|---|---|
| Prisma | `^6.14.0` | Prisma 7 exige ESM no projeto inteiro; todo o código usa import relativo CommonJS. |
| Expo (se/quando construir mobile) | `~54.0.0` | NativeWind só tem combinação testada oficialmente com SDK 54. |
| NestJS / Next.js / React | atuais | sem restrição |

## Comandos

```bash
# infra local
docker compose -f docker-compose.dev.yml up -d

# backend
cd apps/api && npm install && npx prisma generate
npx prisma migrate deploy
npm run build        # ainda vai falhar até Tenancy/Admin/Notifications serem completados
npm run start:dev
npm test
npm run test:e2e     # precisa do Postgres rodando

# frontend (depois de construído)
cd apps/web && npm install && npm run dev
```

## Convenção de nomenclatura

Código (entidades, variáveis, rotas, nomes de módulo) em inglês. Documentação, comentários de regra de negócio e mensagens de erro pro usuário final em português.
