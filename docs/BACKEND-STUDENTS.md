# FitHub — Backend: Students

**Etapa 5b de 10** — ... → Prisma ✅ → Backend: Auth ✅ → **Backend: Students** → Backend: Assessments/Workouts → ... → Frontend → Mobile → Testes → Docker → Deploy

## Sumário

1. Correção de propagação: `reconstitute()` no lugar do truque em `User`
2. O que foi implementado
3. Primeiro Domain Event de ponta a ponta — Student → Redis → Dashboard
4. Decisão: DELETE HTTP mapeado pra soft-delete
5. Decisões desta etapa
6. Próxima etapa

## 1. Correção de propagação: `reconstitute()` no lugar do truque em `User`

Ao escrever `StudentMapper`, ficou claro que reusar `Student.create()` pra reidratar do banco (como fiz em `UserMapper` na Etapa 5a, contando com `isNew = !id` pra não reemitir evento) era mais frágil do que parecia — `create()` roda toda a validação de negócio de novo a cada leitura, sem necessidade, e o mapper precisa saber demais sobre o funcionamento interno da entidade.

Correção aplicada nos dois lugares: `Student.reconstitute(props, id)` e `User.reconstitute(props, id)`, métodos estáticos separados que só constroem o objeto — sem validação, sem eventos. `create()` fica reservado pro que ele deveria sempre ter sido: nascimento de verdade de uma entidade nova. Padrão que os próximos mappers (Assessment, Workout) já seguem de saída.

## 2. O que foi implementado

```
modules/students/
├── domain/            # já existia (Etapa 2) — só ganhou getters e reconstitute()
├── infrastructure/     # PrismaStudentRepository + StudentMapper
├── application/         # 4 Use Cases (Create, Update, ChangeStatus, List/GetById) + DTOs
├── presentation/         # StudentsController — POST/GET/PUT/PATCH/DELETE completos
└── students.module.ts

modules/dashboard/
├── application/event-handlers/  # StudentDashboardStatsHandler
├── presentation/                 # DashboardController (GET /dashboard/stats)
└── dashboard.module.ts

infra/cache/
└── redis.service.ts
```

## 3. Primeiro Domain Event de ponta a ponta — Student → Redis → Dashboard

Fecha o ciclo desenhado desde a Etapa 1 (seção 10) e implementado na Etapa 5a (`DomainEventPublisherService`):

```
CreateStudentUseCase
  → student.pullDomainEvents() → [StudentCreatedEvent]
  → events.publishAll(...) → EventEmitter2.emit('StudentCreatedEvent', event)
  → StudentDashboardStatsHandler.onStudentCreated() (@OnEvent)
  → Redis INCR tenant:{id}:dashboard:activeStudentCount
```

`GET /dashboard/stats` lê o mesmo contador — é possível, hoje, criar um aluno via `POST /students` e ver o número mudar em `GET /dashboard/stats` sem nenhum código adicional. Essa validação de ponta a ponta é o motivo de o Dashboard entrar nesta etapa, mesmo sendo um módulo "genérico" de baixa prioridade — provar a cadeia inteira cedo é mais barato que descobrir uma quebra nela depois de 8 módulos publicando eventos que ninguém consome.

Cache de agregados mais pesados (avaliações pendentes, aniversariantes, próximas consultas — seção do briefing "Painel do Personal") entra conforme os módulos de origem (Assessments, Appointments) existirem.

## 4. Decisão: DELETE HTTP mapeado pra soft-delete

O briefing original pede `DELETE /students/:id`. Implementado, mas apontando pro mesmo `ChangeStudentStatusUseCase` com `DEACTIVATE` — não um `DELETE FROM students` físico. Histórico de avaliação e treino de um aluno não deveria desaparecer por um clique acidental; um hard-delete de verdade (ex: direito ao esquecimento) merece um fluxo próprio, com confirmação e auditoria, não a semântica padrão de um verbo HTTP.

## 5. Decisões desta etapa

1. **`reconstitute()` em vez de reusar `create()`** (seção 1) — padrão que se propaga pros próximos mappers.
2. **Dashboard entrou nesta etapa**, fora de ordem, só pra fechar a validação do event handler — não é o módulo Dashboard completo (isso vem depois de Assessments/Feedback/Appointments existirem).
3. **DELETE = soft-delete** (seção 4).
4. **`existsByEmail` verificado no Use Case antes de `Student.create()`** — é checagem de unicidade contra o banco (cross-aggregate na prática, já que consulta outros registros de Student), então não cabia dentro da entidade; fica no Application layer, que já tem acesso ao repositório.

## 6. Próxima etapa

Etapa 5c — Backend: Assessments e Workouts, o resto do Core Domain. `Workout` é o mais interessante dos dois: os Use Cases precisam manipular o agregado inteiro (Workout + WorkoutExercise) de uma vez, e `createNewVersion()` (Etapa 2) exige persistir duas linhas de `workouts` atomicamente — primeira aplicação real do `PrismaUnitOfWork` fora do fluxo de registro de trainer.
