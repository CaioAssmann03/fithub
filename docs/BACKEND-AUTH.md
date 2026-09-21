# FitHub — Backend: Auth/Identity

**Etapa 5a de 10** (Backend quebrado em sub-partes) — Arquitetura ✅ → DDD ✅ → Banco ✅ → Prisma ✅ → **Backend: Auth** → Backend: Students → ... → Frontend → Mobile → Testes → Docker → Deploy

> Primeiro módulo do Backend, porque tudo mais depende dele: sem login não existe `TenantContext`, sem `TenantContext` não existe isolamento de tenant em nenhum outro módulo.

## Sumário

1. Duas correções descobertas implementando o fluxo real
2. O que foi implementado
3. Middleware vs. Guard para o TenantContext — por que isso importa
4. O Unit of Work resolvendo o bootstrap circular
5. Rotação de refresh token com detecção de reuso
6. Decisões desta etapa
7. Próxima etapa

## 1. Duas correções descobertas implementando o fluxo real

Isso é o tipo de coisa que só aparece quando o código de verdade é escrito, não na modelagem em prosa — por isso vale registrar explicitamente em vez de silenciar:

**a) `DomainEvent.tenantId` não podia ser obrigatório.** A Etapa 2 assumiu (implicitamente) que todo evento tem um tenant. `User`/`PLATFORM_ADMIN` quebra essa premissa. Corrigido em `core/domain/domain-event.ts`: `tenantId: string | null`.

**b) A regra de unicidade de e-mail da Etapa 3 tinha um buraco real.** `uq_users_email_per_tenant` (ou a versão anterior `uq_users_email_admin`, só para `PLATFORM_ADMIN`) não protegia `PERSONAL_TRAINER`: como cada personal novo cria um **tenant novo**, o par `(tenant_id, email)` nunca colide entre dois cadastros de trainer diferentes — o mesmo e-mail poderia, em teoria, abrir infinitas contas de personal. Corrigido em `database/schema.sql`: `uq_users_email_trainer_admin`, único **global** por e-mail quando `role IN ('PERSONAL_TRAINER', 'PLATFORM_ADMIN')`. `STUDENT` continua único só por tenant — faz sentido a mesma pessoa ser aluna de dois personais diferentes com o mesmo e-mail.

## 2. O que foi implementado

Vertical completo, das 4 camadas:

```
modules/auth/
├── domain/          # User (aggregate), RefreshToken (entity), Role/PasswordHash (VOs), eventos, repository interface
├── infrastructure/  # PrismaUserRepository + UserMapper
├── application/     # RegisterTrainerUseCase, LoginUseCase, RefreshTokenUseCase, DTOs
├── presentation/    # AuthController
└── auth.module.ts

infra/
├── security/         # PasswordHasherService (Argon2id), TokenService (JWT + refresh opaco)
├── events/           # DomainEventPublisherService (ponte pro EventEmitter2)
└── prisma/           # PrismaService, TenantContextService, TransactionContextService, PrismaUnitOfWork

shared/
├── middleware/       # TenantContextMiddleware
├── guards/           # JwtAuthGuard, RolesGuard
└── decorators/       # @Roles, @CurrentUser
```

## 3. Middleware vs. Guard para o TenantContext — por que isso importa

Erro fácil de cometer (quase cometi): colocar a montagem do `TenantContext` (`AsyncLocalStorage`) dentro de um `Guard.canActivate()`. Não funciona — um Guard retorna um `boolean` e sai; o handler da rota roda **depois**, fora da chamada de `als.run()`, então o contexto já teria sido encerrado antes do controller sequer executar.

A correção: `TenantContextMiddleware` (que roda antes, no pipeline HTTP puro, com acesso a `next()`) envolve o `next()` inteiro dentro do `als.run()` — assim guards, interceptors e o handler do controller, todos rodam dentro do mesmo contexto. `JwtAuthGuard` fica reduzido a só confirmar que o middleware já rodou (`request.user` existe); a autenticação de verdade já aconteceu antes.

## 4. O Unit of Work resolvendo o bootstrap circular

`RegisterTrainerUseCase` é o motivo de o Unit of Work (prometido desde a Etapa 2) precisar ser implementado de verdade, não só de esqueleto: criar `Tenant` (com `ownerUserId` nulo) → criar `User` → `UPDATE Tenant.ownerUserId` precisa ser atômico. Se o segundo passo falhar, o primeiro não pode ter ficado gravado.

Detalhe que quebra fácil em implementações ingênuas: só envolver o código num `$transaction(async () => {...})` **não basta** se os repositórios chamados lá dentro usarem o client Prisma normal em vez do `tx` da transação — a operação roda fora da transação, **silenciosamente**, sem nenhum erro. `TransactionContextService` (espelhando o `TenantContextService`) resolve isso via `AsyncLocalStorage`: `PrismaUnitOfWork.run()` propaga o `tx`, e todo repositório lê `PrismaService.currentClient` (que prefere o `tx` corrente) em vez de `.client` direto.

## 5. Rotação de refresh token com detecção de reuso

Todo `/auth/refresh` bem-sucedido **consome** o token apresentado (marca `revokedAt`) e emite um novo da mesma `familyId`. Se um token já revogado for reapresentado — sinal de que foi roubado e outra parte já o usou — a resposta não é só negar: `RefreshTokenUseCase` revoga a família inteira e publica `RefreshTokenReuseDetectedEvent`, que a Etapa 5 seguinte liga num alerta de segurança via Notifications.

## 6. Decisões desta etapa

1. **Correções da seção 1** — peço confirmação de que fazem sentido antes de propagar o padrão pros próximos módulos.
2. **Middleware, não Guard, pro TenantContext** (seção 3) — infraestrutura compartilhada por todo módulo daqui pra frente.
3. **`TenantContextService`/`PrismaService` exportados do `AuthModule`, mas com nota de que migram pra um `InfraModule` global** na Etapa 5 completa — não repetir esses providers em cada módulo de domínio.
4. **Refresh token é valor opaco (não JWT), só o hash SHA-256 vai pro banco** — um vazamento do banco não autentica ninguém sozinho.

## 7. Próxima etapa

Etapa 5b — Backend: Students. Primeiro módulo de negócio de verdade, consumindo a entidade `Student` já pronta desde a Etapa 2: `PrismaStudentRepository`, os Use Cases (`CreateStudentUseCase`, `DeactivateStudentUseCase`...), o `StudentsController`, e o primeiro handler de Domain Event de ponta a ponta (`StudentCreatedEvent` → atualiza um contador simples no Dashboard) — validando que toda a cadeia Domain → Application → Infrastructure → Presentation → Events, desenhada desde a Etapa 1, realmente fecha.
