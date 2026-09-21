# FitHub — Backend: Tenancy, Admin e Notifications

**Etapa 5d de 10** — ... → Backend: Students ✅ → Backend: Assessments/Workouts ✅ → **Backend: Tenancy/Admin/Notifications** → Backend: build ✅ → Frontend → Mobile → Testes → Docker → Deploy

> Fecha o backend descrito em `CLAUDE.md`: `TenancyModule` e `AdminModule` nasceram do zero (as pastas estavam vazias), e `NotificationsModule` — que já tinha entidade, repositório, mapper e 3 use cases — ganhou os event handlers, o controller e o module que faltavam. Esta etapa também é a primeira vez que o projeto inteiro roda (`npm install`, `npm run build`, `npm run start:dev`) — por isso a maior parte deste documento é sobre correções descobertas nesse processo, não só sobre os módulos novos.

## Sumário

1. TenancyModule — auto-gestão do personal
2. AdminModule — Platform Admin e acesso assistido
3. NotificationsModule — completando a cadeia de eventos
4. Correções descobertas rodando o projeto pela primeira vez
5. Decisões desta etapa — pontos que merecem sua confirmação
6. Próxima etapa

---

## 1. TenancyModule — auto-gestão do personal

Cobre exatamente o que `CLAUDE.md` pediu: `GET /tenancy/me` e `PUT /tenancy/profile`. Nada de criar tenant nem trocar plano — isso são ações diferentes, fora do escopo desta etapa.

- `Tenant` e `TrainerProfile` são `Entity`, não `AggregateRoot` — nenhum dos dois emite evento aqui. `TenantCreatedEvent`/`TenantPlanChangedEvent` (catálogo do `DDD-MODEL.md`) continuam nascendo em `RegisterTrainerUseCase` (Auth), que resolve o bootstrap circular tenant↔user numa transação direta no Prisma (`BACKEND-AUTH.md`, seção 4) — reconstruir esse fluxo em cima de um agregado novo estava fora do pedido desta etapa. Quando existir uma ação real de "trocar plano", `Tenant` deveria migrar pra `AggregateRoot` nesse momento.
- `TrainerProfile.create()` não devolve `Result` — não existe nenhuma invariante própria pra checar (cref/specialty/bio são texto livre; `phone` já chega validado como `PhoneNumber` antes de entrar no Use Case, mesmo padrão do `Student`). Mesmo raciocínio já usado em `RefreshToken.create()` e `Notification.create()`.
- `PUT /tenancy/profile` faz upsert: a maior parte dos personais que já existem no banco (criados via `RegisterTrainerUseCase`) não tem nenhuma linha em `trainer_profiles` ainda — `RegisterTrainerUseCase` nunca criou uma. Em vez de mudar o fluxo de registro (fora do escopo), `UpdateTrainerProfileUseCase` cria o perfil na primeira chamada e atualiza nas seguintes.
- `ITenantRepository` só tem `findById` — nenhum Use Case desta etapa escreve em `Tenant`, então um `save()` seria código morto. Mesmo raciocínio do `IFeedbackRepository` já existente (só tem o que os Use Cases realmente usam, não um CRUD completo por padrão).

## 2. AdminModule — Platform Admin e acesso assistido

Cobre `GET /admin/tenants` e `POST /admin/assisted-access`, como pedido.

- **Sem agregado `Tenant` duplicado.** `AdminTenantSummary` é uma projeção de leitura simples (mesmo raciocínio do Dashboard — `DDD-MODEL.md`, seção 7: sem regra de negócio, sem ganho em modelar agregado). `IAdminTenantRepository` é do próprio `AdminModule`, não importa nada de `TenancyModule` — os dois têm necessidades de leitura genuinamente diferentes (um lê o próprio tenant, o outro lista todos).
- **`AuditLog`** é a única entidade de domínio "de verdade" nova aqui — `Entity` simples, append-only (o repositório usa `.create()`, nunca `.upsert()`, batendo com o comentário já existente em `schema.prisma`: "Append-only por convenção de aplicação").
- **Acesso assistido — decisão que merece atenção (seção 5).** `POST /admin/assisted-access` emite um JWT de 5 minutos (`TokenService.signAssistedAccessToken`, novo) com `role: 'PLATFORM_ADMIN'` e `tenantId` = tenant alvo, e grava o grant em `audit_logs` **antes** de devolver o token. O ator continua sendo o admin (não uma identidade forjada de personal) — mas isso tem uma consequência real: os controllers tenant-scoped de hoje (`StudentsController`, `WorkoutsController`, etc.) exigem `@Roles('PERSONAL_TRAINER')`, e um token com `role: 'PLATFORM_ADMIN'` **não passa** nesse guard. Ou seja: o endpoint cumpre exatamente o que foi pedido (emitir o token de acesso assistido, auditado) mas usar esse token pra efetivamente navegar dados de um tenant específico através dos controllers existentes é trabalho que ainda não existe. Não mexi em `RolesGuard` nem em nenhum `@Roles(...)` existente pra resolver isso — seria um blast radius bem maior que o pedido desta etapa (tocaria em todo controller tenant-scoped). Ver seção 5, item 1.

## 3. NotificationsModule — completando a cadeia de eventos

Os 5 handlers pedidos, um arquivo por módulo de origem (mesmo naming do handler que já existia, `StudentDashboardStatsHandler`):

| Handler | Evento | Destinatário resolvido como |
|---|---|---|
| `StudentEventsHandler` | `StudentCreatedEvent` | Dono do tenant (evento não carrega nenhum userId) |
| `WorkoutEventsHandler` | `WorkoutAssignedEvent` | `Student.userId` (aluno com acesso ao app) |
| `FeedbackEventsHandler` | `FeedbackSubmittedEvent` | Dono do tenant, só se dor/dificuldade ≥ 8 |
| `AppointmentEventsHandler` | `AppointmentScheduledEvent` | `Student.userId` |
| `AuthEventsHandler` | `RefreshTokenReuseDetectedEvent` | O próprio usuário afetado (`event.aggregateId`) |

Dois pontos que exigiram decisão, não só "ligar o fio":

- **`FeedbackSubmittedEvent` não existia.** `Feedback` (módulo Feedback) era `Entity`, não `AggregateRoot`, e não emitia nenhum evento — provavelmente porque nada ainda consumia. Como o pedido desta etapa é justamente reagir a esse evento, completei a outra ponta: `Feedback` agora estende `AggregateRoot`, `FeedbackSubmittedEvent` foi criado em `modules/feedback/domain/events/feedback.events.ts`, e `SubmitFeedbackUseCase` publica o evento após salvar (mesmo padrão de `CreateStudentUseCase`). O limiar de dor/dificuldade que decide se vira notificação **não** está no agregado — é política do `FeedbackEventsHandler`, exatamente como `DDD-MODEL.md` (seção 5, "Feedback") já previa.
- **`StudentCreatedEvent`/`FeedbackSubmittedEvent` não carregam userId do destinatário** — só `tenantId`. Resolvido com uma porta nova e mínima, `ITenantOwnerRepository` (`tenantId → ownerUserId`), implementada com uma query direta em `tenant` — não reaproveita o `ITenantRepository` do `TenancyModule` porque o shape que cada um precisa é diferente (mesmo raciocínio da seção 2). `WorkoutAssignedEvent`/`AppointmentScheduledEvent` resolvem o destinatário via `STUDENT_REPOSITORY`, a mesma exceção pragmática que `FeedbackModule` já usa (documentada em `CLAUDE.md`) — Notifications agora é o segundo módulo a usá-la, pelo mesmo motivo (leitura síncrona, não dá pra resolver por evento).
- **`RefreshTokenReuseDetectedEvent` com `tenantId: null`** (caso de um `PLATFORM_ADMIN`) não gera notificação — `notifications.tenant_id` é `NOT NULL` no schema, então não tem como representar isso no mecanismo atual. Handler faz um guard clause e sai, mesmo padrão que `StudentDashboardStatsHandler` já usava pro mesmo motivo estrutural. Fica como débito conhecido, não escondido.
- **`MarkNotificationReadUseCase` ganhou checagem de dono.** Antes só recebia `notificationId` — qualquer usuário autenticado podia marcar como lida a notificação de qualquer outro usuário (bastava acertar o UUID). Agora recebe também `recipientUserId` (o usuário do token) e falha com o mesmo erro genérico de "não encontrada" tanto pra ID inexistente quanto pra notificação de outro usuário — não revela a existência do recurso alheio, mesmo raciocínio já usado em `LoginUseCase` pra não revelar se um e-mail existe.

## 4. Correções descobertas rodando o projeto pela primeira vez

CLAUDE.md já avisava: "nada disso foi executado ainda". Esta foi a primeira vez que `npm install`, `npx prisma generate` e `npm run build` rodaram de verdade. O que apareceu:

1. **`Tenant.ownerUserId` sem `@unique`** — `schema.prisma` declarava a relação 1:1 `TenantOwner` sem o `@unique` que Prisma exige do lado que carrega a FK. `npx prisma generate` nem validava o schema sem isso. Corrigido em `schema.prisma` **e** na migration `init` (nunca tinha sido aplicada em nenhum Postgres real, então editei o SQL direto em vez de empilhar uma migration de correção em cima de uma migration que nunca existiu de fato em produção).
2. **`@nestjs/jwt`, `@nestjs/event-emitter`, `@nestjs/throttler`, `@nestjs/terminus`, `@nestjs/config` pinados em versões que só suportam Nest ≤10** — o projeto inteiro usa `@nestjs/core@^11`. `npm install` falhava com `ERESOLVE` antes de instalar qualquer coisa. Subi as cinco pras versões mínimas compatíveis com Nest 11 (`CLAUDE.md` já deixa claro que só Prisma e Expo são pinados de propósito; Nest "atuais, sem restrição").
3. **`TenantContextMiddleware` nunca era registrado como provider em nenhum módulo.** `AppModule.configure()` chama `consumer.apply(TenantContextMiddleware)`, mas o Nest só consegue instanciar uma classe de middleware se ela for resolvível pelo container de DI do módulo — e essa classe não estava em nenhum `providers[]`. Sem isso o bootstrap falha ("Nest can't resolve dependencies of TenantContextMiddleware"). Registrado agora direto no `AppModule`, junto com `TokenService`/`TenantContextService` (suas dependências) e um `JwtModule.register(...)` local.
4. **`tenant-scoped.extension.ts` não compilava.** `$allOperations` cobre toda operação de todo model — inclusive `create`, que não tem `where` — então `args.where = ...` não tipava. Corrigido com um cast local e comentado (`scopedArgs = args as { where?: ... }`), só onde o código já garantia (via os três `Set`s) que a operação realmente tem `where`.
5. **`PrismaService.currentClient` inferia uma união que quebrava `.upsert()` em cascata.** O getter combinava `Prisma.TransactionClient` (tipo genérico do client base) com o client já estendido — a união fazia TypeScript inferir `never` pro parâmetro `create` de várias operações (`Appointment`, `Assessment`, `Student`, `Workout`, `Notification` — todos os repositórios que fazem upsert). Corrigido fixando o tipo de retorno do getter em `typeof this.client`: o `tx` que chega ali sempre nasce de `this.client.$transaction(...)` (`PrismaUnitOfWork`), então o client estendido já é a verdade em runtime — o cast só alinha o tipo.
6. **`DIET_INCLUDE` usava `mealFoods` como nome do include/relação em `Meal`, mas o campo real em `schema.prisma` é `foods`.** Isso não só quebrava a compilação do include — o mapper (`DietMapper.toDomain`, com `raw: any`) lia `meal.mealFoods` silenciosamente como `undefined` e sempre reidratava uma `Diet` com todo `Meal.foods` vazio, mesmo com dados no banco. Bug real, silencioso, corrigido nos dois lugares.
7. **`FeedbackController` tipava `@CurrentUser()` como `RequestContext` (`{userId, ...}`), mas `request.user` é sempre um `AccessTokenPayload` (`{sub, ...}`)** — descoberto completando o Notifications, que precisava do fluxo de feedback funcionando de ponta a ponta pra testar `FeedbackSubmittedEvent`. `user.userId` era sempre `undefined` em runtime (`createParamDecorator` devolve `any`, TypeScript não pega isso), então `findByUserId` buscava um UUID aleatório e o check-in de feedback do aluno nunca encontrava o `Student` vinculado — sempre 404. Corrigido pro tipo certo (`AccessTokenPayload`) e `user.sub`.
8. **`NotificationMapper.toPersistence` não tipava `payload` pro Prisma `Json`** — `Record<string, unknown>` não é automaticamente `Prisma.InputJsonValue`. Cast adicionado, mesmo padrão usado em `AuditLogMapper` (novo).
9. **`login.use-case.ts`: `let user = null`** sem anotação de tipo — sob `strictNullChecks`, TypeScript infere `null` (não `any`) pra essa declaração, e toda reatribuição subsequente (`User | null`) quebrava. Anotado explicitamente.

Depois dessas nove correções, `npm run build` roda limpo e `npm test` (as 25 unit tests que já existiam, nenhuma nova) passa sem regressão.

### 4.1. Correções descobertas subindo a infra local e rodando a API de verdade

`npm run build` limpo não prova que a API sobe — só prova que compila. Depois de `docker compose up`, `prisma migrate deploy` e `npm run start:dev`, mais três problemas reais apareceram (nenhum deles visível em `tsc`, porque nenhum é erro de tipo):

10. **Nada no projeto carregava `.env` pra dentro de `process.env` da aplicação em si.** `PrismaService`/Prisma Client carrega `.env` sozinho (mecanismo interno do `@prisma/client`, só pra `DATABASE_URL`) — mas todo o resto (`JWT_SECRET` em *todo* `JwtModule.register(...)`, `PORT`, `REDIS_URL`, `CORS_ORIGIN`) é lido via `process.env.X` puro, sem nada que rode `dotenv.config()`. Sintoma visível: a API sempre subia na porta 3000 mesmo com `PORT=3333` no `.env`. Sintoma real e mais grave: `JWT_SECRET` chegava `undefined` em **todo** `JwtModule.register({ secret: process.env.JWT_SECRET })` do projeto (Auth, Students, Workouts, Tenancy, Admin, Notifications, Dashboard, e agora `AppModule`) — login/registro emitiriam token assinado com `undefined`. Corrigido com `import 'dotenv/config'` como **primeiro** import de `main.ts` (precisa vir antes de `./app.module` — todo `@Module({...})` do projeto lê `process.env.JWT_SECRET` na avaliação do arquivo, que acontece antes de qualquer linha dentro de `bootstrap()` rodar) e `dotenv` promovido de dependência transitiva (via `@nestjs/config`) pra dependência direta no `package.json`. `test/jest-e2e.json` precisou do mesmo tratamento à parte (`"setupFiles": ["dotenv/config"]`) — o processo do Jest nunca importa `main.ts`, então tem seu próprio ponto de carregamento de env.
11. **`TenantContextMiddleware.exclude(...)` nunca excluía nada — `POST /auth/register`/`login`/`refresh` devolviam 401 "Token ausente".** Os paths de exclude estavam escritos com o prefixo (`'api/v1/auth/register'`), mas o Nest já soma o `setGlobalPrefix('api/v1')` sozinho antes de comparar tanto o `forRoutes('*')` quanto o `exclude(...)` com o path recebido — dá pra confirmar isso pelo aviso de boot `[LegacyRouteConverter] Unsupported route path: "/api/v1/*"`. Path com o prefixo escrito à mão vira `/api/v1/api/v1/auth/register` na comparação interna, nunca bate com a requisição real, e a rota pública acaba protegida pelo middleware do mesmo jeito que qualquer rota tenant-scoped. Corrigido removendo o prefixo dos quatro paths de `exclude(...)` (`'auth/register'`, `'auth/login'`, `'auth/refresh'`, `'health'` — este último já estava certo, por isso `GET /health` sempre funcionou). Sem essa correção, **nenhum** fluxo autenticado do projeto seria testável — login é o pré-requisito de tudo.
12. **Porta 5432 (Postgres) e 3000 (API) já ocupadas neste ambiente por outros projetos** do usuário (`clinica_postgres`, um container Postgres de outra aplicação, e um dev server Next.js não relacionado). Não mexi em nenhum dos dois — só remapeei `docker-compose.dev.yml` (Postgres do FitHub agora expõe `5433:5432` no host) e `apps/api/.env` (`DATABASE_URL` porta 5433, `PORT=3333`). `.env.example` continua com os valores "de fábrica" (5432/3000) — a mudança é só deste ambiente local, não da convenção do projeto.

Depois dessas três correções: `npm run start:dev` sobe limpo, `GET /health` responde `{"status":"ok",...,"database":{"status":"up"}}`, e todo o fluxo `POST /auth/register` → `POST /auth/login` → `GET /tenancy/me` → `PUT /tenancy/profile` → `POST /students` (dispara `StudentCreatedEvent`) → `GET /notifications` foi exercitado manualmente contra o Postgres real, ponta a ponta, com sucesso. Fui além do check de `/health` e também testei manualmente (via token forjado com o mesmo `JWT_SECRET` do `.env`, já que não existe endpoint de criação de Platform Admin nem fluxo de "habilitar acesso ao app" pro aluno — ambos pré-existentes, fora do escopo desta etapa) os outros 4 event handlers do Notifications e o fluxo completo do Admin:

| Fluxo testado | Resultado |
|---|---|
| `POST /students` → `StudentEventsHandler` → notificação `STUDENT_CREATED` pro dono do tenant | ✅ |
| `POST /workouts` + `PATCH /workouts/:id/publish` → `WorkoutEventsHandler` → `WORKOUT_ASSIGNED` pro aluno | ✅ |
| `POST /feedback` (dor=9) → `FeedbackEventsHandler` → `FEEDBACK_THRESHOLD_ALERT` pro personal | ✅ |
| `POST /appointments` → `AppointmentEventsHandler` → `APPOINTMENT_SCHEDULED` pro aluno | ✅ |
| Reuso de refresh token revogado → `AuthEventsHandler` → `REFRESH_TOKEN_REUSE_DETECTED` | ✅ |
| `PATCH /notifications/:id/read` — dono vs. não-dono | ✅ (404 pro não-dono, mesma mensagem de "não encontrada") |
| `GET /admin/tenants`, `POST /admin/assisted-access` (token 5min + `audit_logs`) | ✅ (audit log conferido direto no banco) |
| `RolesGuard` rejeitando token de personal em rota `PLATFORM_ADMIN` | ✅ (403) |

Depois disso, `npm test` (25/25) e `npm run test:e2e` (3/3, incluindo `tenant-isolation`) confirmados verdes.

### 4.2. Duas correções a mais, descobertas construindo `apps/web` contra a API real

13. **`POST /diets` não validava o corpo da requisição — nenhum campo.** `DietsController.create()` tipava `@Body() dto: CreateDietDto & { studentId: string }`. Tipo interseção não tem classe em runtime; o `ValidationPipe` do Nest decide se valida um `@Body()` olhando o tipo declarado via reflection (`design:paramtypes`), e uma interseção não resolve pra uma classe válida — o Nest simplesmente pulava `class-validator` inteiro nessa rota. Confirmado ao vivo: um corpo com `meals: "not-an-array"` e um campo inventado (`totalGarbageField`) passava direto pro Use Case sem nenhum erro de validação (só travava depois, no `Diet.create()`, e só quando o campo que ele checa — `name` — vinha ausente; um `meals` malformado teria estourado mais fundo, num `TypeError`, não num 400 limpo). Mais grave: como `studentId` nunca era um campo real do DTO, um `studentId` ausente não seria rejeitado — viraria um `UniqueEntityId` **aleatório** (`new UniqueEntityId(undefined)` gera um uuid novo), ou seja, dado de aluno errado gravado silenciosamente. Corrigido: `studentId` virou campo de verdade em `CreateDietDto` (com `@IsString()`), e o controller voltou a tipar `@Body()` como `CreateDietDto` puro. Reconfirmado ao vivo: corpo válido cria (201), `meals` malformado e campo extra agora são rejeitados com erro de `class-validator` (400).
14. **Não existia nenhum jeito de um aluno logar.** `Student.linkToUser()` já existia no domínio (Etapa 2) e `StudentLinkedToUserEvent` já estava no catálogo, mas nenhum Use Case/Controller os expunha — sem isso, a tela de check-in do aluno (pedida no `CLAUDE.md`, passo 3) seria permanentemente não-funcional (nenhum aluno teria `userId`, nenhum aluno conseguiria um token). Adicionado `POST /students/:id/enable-access` (`EnableStudentAccessUseCase`, no próprio `StudentsModule`): cria um `User` (role `STUDENT`) e vincula ao `Student` existente, numa transação (`UNIT_OF_WORK`) — mesmo raciocínio do bootstrap circular tenant↔user do `RegisterTrainerUseCase`. Cross-module (`Students` injeta `USER_REPOSITORY`/`UNIT_OF_WORK` do `Auth`) pelo mesmo motivo pragmático já registrado em `CLAUDE.md` pro caso inverso (`Feedback` → `Students`). Testado ao vivo, ponta a ponta, com senha real: `POST /students/:id/enable-access` → `POST /auth/login` (com `tenantId`, exigido pra `STUDENT` — e-mail não é único globalmente) → token `STUDENT` válido.

## 5. Decisões desta etapa — preciso da sua confirmação

1. **Token de acesso assistido com `role: PLATFORM_ADMIN` não é aceito pelos controllers `@Roles('PERSONAL_TRAINER')` existentes** (seção 2). O endpoint faz exatamente o que foi pedido — emite o token de 5 minutos, audita o grant — mas "usar esse token pra ver dado de um tenant" ainda não tem onde acontecer. Duas direções possíveis quando isso for retomado: (a) criar rotas próprias de leitura sob `/admin/tenants/:id/...` que aceitam esse token com `@Roles('PLATFORM_ADMIN')`, sem tocar nos controllers do personal; ou (b) fazer `RolesGuard` aceitar `PLATFORM_ADMIN` como passe-livre em qualquer rota `@Roles('PERSONAL_TRAINER')` quando o token carregar `assistedAccess: true`. Não escolhi nenhuma das duas agora — (b) tem blast radius bem maior (mexe no guard compartilhado por 8 módulos) pra uma etapa que só pediu os dois endpoints do Admin.
2. **`Tenant`/`TrainerProfile` como `Entity`, não `AggregateRoot`** (seção 1) — diverge do texto de `DDD-MODEL.md` (que chama os dois de "aggregate root"), mas bate com o que o código de fato faz (nenhum evento emitido nesta etapa). Se/quando existir uma ação de criar tenant ou trocar plano através deste módulo, valeria migrar `Tenant` pra `AggregateRoot` nesse momento.
3. **Notificação de `StudentCreatedEvent` vai pro dono do tenant** (seção 3) — o evento não carrega nenhum userId, então essa foi a única leitura que fez sentido (confirmação in-app de que o cadastro foi concluído). Se a intenção original era outra, é uma troca pequena e local (só o handler).
4. **Limiar de alerta de feedback fixado em 8** (dor OU dificuldade, escala 0–10) — `DDD-MODEL.md` já previa "limiar configurável" mas não especificava o valor nem de onde viria a configuração (por tenant? global?). Um valor fixo, comentado no código, foi o que não exigia inventar uma camada de configuração nova fora do escopo pedido.
5. **`uq_tenants_owner_user` adicionado na migration `init`** (seção 4, item 1) — sem isso `prisma generate` nem roda. Sinalizando explicitamente porque é uma mudança em uma migration já existente, mesmo que nunca aplicada de verdade.

## 6. Próxima etapa

Com `apps/api` compilando, os três módulos completos, a infra local rodando (Postgres na porta 5433 neste ambiente, Redis na 6379), migrations aplicadas, a API respondendo em `GET /health`, os 25 unit tests e os 3 e2e tests (`tenant-isolation`) verdes, e os oito fluxos da tabela da seção 4.1 verificados manualmente ponta a ponta — o backend está no estado que o `CLAUDE.md` pede como pré-requisito. Próximo passo: `apps/web` (Next.js) — painel do personal trainer cobrindo alunos, avaliações, treinos, dietas, exercícios, alimentos, agenda e notificações, mais uma tela de check-in pro aluno. `apps/mobile` (Expo) fica por último e é opcional.

Um ponto resolvido nesta mesma etapa, ao começar `apps/web` (seção 4.2): o endpoint de "habilitar acesso ao app" pro aluno (`POST /students/:id/enable-access`) não existia — foi adicionado porque bloqueava diretamente a tela de check-in.

Um ponto que ainda fica em aberto pra quem mexer no painel de Admin do `apps/web`:

- **Não existe endpoint pra criar um Platform Admin.** Testei `AdminModule` criando o usuário direto no banco (seção 4.1). Se o painel de Admin for parte do escopo do `apps/web`, alguma forma de provisionar o primeiro admin (seed script, migration de dados, ou endpoint protegido por segredo de infra) vai ser necessária.
