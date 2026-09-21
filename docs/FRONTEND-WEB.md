# FitHub — Frontend: Web

**Etapa 6 de 10** — ... → Backend: Tenancy/Admin/Notifications ✅ → **Frontend: Web** → Mobile → Testes → Docker → Deploy

> `apps/web` não existia — construído do zero (Next.js 16, React 19, Tailwind CSS 4 CSS-first). Cobre o painel do personal trainer (alunos, avaliações, treinos, dietas, exercícios, alimentos, agenda, notificações, configurações), o painel do Platform Admin, e a tela de check-in do aluno — os três papéis que a API já suporta.

## Sumário

1. O que foi implementado
2. Arquitetura do frontend
3. Correções e decisões descobertas construindo contra a API real
4. Verificação — o que foi testado de verdade, não só compilado
5. Limitações conhecidas
6. Próxima etapa

---

## 1. O que foi implementado

```
apps/web/src/
├── app/
│   ├── login/, register/           # públicas
│   ├── (trainer)/                  # layout com sidebar, guard PERSONAL_TRAINER
│   │   ├── dashboard/
│   │   ├── students/               # lista, novo, detalhe com 7 abas
│   │   ├── exercises/, foods/
│   │   ├── appointments/           # agenda global
│   │   ├── notifications/
│   │   └── settings/               # perfil do tenant/personal
│   ├── admin/                      # guard PLATFORM_ADMIN — tenants + acesso assistido
│   └── checkin/                    # guard STUDENT — check-in de feedback + avisos
├── lib/
│   ├── api-client.ts                # fetch wrapper com refresh silencioso em 401
│   ├── api/*.ts                     # uma função tipada por endpoint, um arquivo por módulo da API
│   ├── auth-context.tsx, token-storage.ts
│   └── use-api-data.ts, date-utils.ts
└── components/ui/, components/nav/, components/require-role.tsx
```

`packages/shared-types` ganhou um arquivo por módulo (`assessment.ts`, `workout.ts`, `exercise.ts`, `food.ts`, `diet.ts`, `appointment.ts`, `feedback.ts`, `notification.ts`, `tenancy.ts`, `admin.ts`) — só tinha `auth.ts`/`student.ts` antes. `apps/web` consome de lá; `apps/api` continua sem importar o pacote (só define suas próprias DTOs, como já fazia).

Tokens ficam em `localStorage` (a API devolve no corpo do JSON, não como cookie httpOnly) — `apiFetch` tenta um refresh silencioso uma vez antes de desistir e redirecionar pro login, então o access token de 15min não derruba uma sessão de uso normal do painel.

## 2. Arquitetura do frontend

- **Client Components em quase tudo.** O token de auth só existe no browser (`localStorage`), então qualquer página que precise dele — praticamente todas, exceto `/login`/`/register` antes de autenticar — precisa rodar no cliente. Não há Server Components buscando dado da API neste app; é uma decisão consciente, não um descuido — trocar por Server Components exigiria repassar o token via cookie httpOnly, o que muda o contrato da API (fora do escopo desta etapa).
- **Um arquivo por recurso em `lib/api/`** (`students.ts`, `diets.ts`, etc.), espelhando os módulos do `apps/api` — mesmo find-ability que o próprio backend já usa.
- **`useApiData`** (hook próprio, não uma lib externa) resolve o padrão repetido de toda tela: buscar ao montar, `{data, isLoading, error, refetch}`. Deliberadamente simples — sem cache entre navegações, sem invalidação automática; `refetch()` manual depois de cada mutação é suficiente pro tamanho deste app.
- **Sem componente de biblioteca de UI externa** — `components/ui/` é um kit mínimo (Button, Input, Card, Badge, Alert, PageHeader) usado consistentemente, não uma dependência nova.

## 3. Correções e decisões descobertas construindo contra a API real

Nenhuma delas veio de "achismo" — cada uma apareceu rodando o app de verdade contra o `apps/api` já no ar.

1. **`GET /students` e `GET /students/:id` só devolviam `{id, name, status, goal}`** — faltava tudo que uma tela de perfil/edição de aluno precisa (nascimento, altura, contato, notas, se já tem acesso ao app), mesmo esses campos já existindo como getter na entidade desde a Etapa 5b. `StudentsController.toResponse()` enriquecido (`apps/api`) — sem mudança de schema, só resposta mais completa.
2. **`POST /diets` não validava o corpo nenhum pouco.** O parâmetro do controller era tipado `CreateDietDto & { studentId: string }` — tipo interseção não vira uma classe em runtime, e o `ValidationPipe` do Nest só roda `class-validator` quando reconhece o tipo declarado como uma classe de DTO de verdade. Resultado: `class-validator` inteiro pulado nessa rota — confirmado ao vivo enviando `meals: "não é array"` e um campo inventado, ambos aceitos sem erro (só travava depois, no `Diet.create()`, e só porque `name` também estava ausente). Mais grave: sem `studentId` no DTO, um valor ausente virava um `UniqueEntityId` **aleatório**, não um erro — dado de aluno errado gravado silenciosamente. Corrigido em `apps/api`: `studentId` agora é campo de verdade no DTO; controller voltou a tipar `@Body()` como `CreateDietDto` puro.
3. **Nenhum endpoint pra "habilitar acesso ao app" de um aluno.** `Student.linkToUser()` já existia no domínio, mas sem controller a tela de check-in não tinha como ser testada com um login de verdade. Adicionado `POST /students/:id/enable-access` (`apps/api`, módulo Students — detalhes e decisão de design em `docs/BACKEND-TENANCY-ADMIN-NOTIFICATIONS.md`, seção 4.2). A tela de Acesso ao App (aba do detalhe do aluno) gera um link (`/login?tenantId=...&email=...`) pro personal compartilhar — não existe envio de e-mail automático, nem endpoint de "esqueci minha senha" ainda.
4. **`CORS_ORIGIN` no `.env` do `apps/api` apontava pra porta 3001, mas o Next.js roda em 3000 por padrão.** Bloqueava toda chamada do frontend com erro de CORS. Corrigido no `.env` local (não no `.env.example`, que continua com os valores de fábrica).
5. **Bug de fuso horário exibindo datas erradas (nascimento, data de avaliação) — um dia a menos.** `new Date('2026-09-10').toLocaleDateString('pt-BR')` interpreta a string como meia-noite **UTC**; num fuso atrás de UTC (como o de quem está testando isso), o `toLocaleDateString` seguinte mostra o dia anterior. Afeta qualquer campo que seja uma data pura (`@db.Date` no Postgres — nascimento, data de avaliação), nunca um timestamp de verdade (`createdAt`, `scheduledAt` já tinham fuso embutido na string ISO e exibiam certo). Corrigido com `lib/date-utils.ts` (`formatDateOnly`/`todayDateOnly`, que leem os componentes literais da string em vez de deixar o parser de `Date` aplicar fuso) — aplicado em `profile-tab.tsx` e `assessments-tab.tsx`.
6. **Next.js 16 gera `AGENTS.md`/`CLAUDE.md` automaticamente em `apps/web`** na primeira vez que `next dev` roda (feature nova da versão, documentada no próprio arquivo gerado). Deixado como está — o próprio Next.js re-cria esse bloco a cada `next dev`, então removê-lo não teria efeito duradouro.

## 4. Verificação — o que foi testado de verdade

`npm run build` limpo prova tipos e bundling, não que a experiência funciona. Testado manualmente no browser, com dado real (Postgres rodando), não mockado:

| Fluxo | Resultado |
|---|---|
| Registro de personal → login → dashboard | ✅ |
| Alunos: listar, cadastrar, editar perfil, desativar | ✅ |
| Avaliações: criar, ver histórico com IMC calculado | ✅ (pego e corrigido bug de data neste teste) |
| Treinos: criar com múltiplos exercícios, publicar pro aluno | ✅ |
| Dietas: criar com refeições e alimentos aninhados, publicar | ✅ (o form mais complexo da UI — validou a correção do item 3.2) |
| Exercícios/Alimentos: criar, listar, badge de catálogo global | ✅ |
| Agenda: agendar, concluir (ver seção 5) | ✅ |
| Notificações: listar, marcar como lida | ✅ |
| Configurações: editar perfil do personal, acentuação/UTF-8 | ✅ (round-trip completo, sem corrupção) |
| Habilitar acesso do aluno → aluno loga de verdade → envia check-in | ✅ ponta a ponta |
| Platform Admin: login real, listar tenants, gerar token de acesso assistido | ✅ |

## 5. Limitações conhecidas

- **`GET /appointments/upcoming` só devolve compromissos futuros/agendados** — não existe endpoint de histórico no `apps/api`. Um compromisso some da Agenda assim que concluído ou cancelado. Não é bug desta etapa: é o contrato que já existia; um "histórico de agenda" exigiria um endpoint novo no backend.
- **Sem "esqueci minha senha"** — nem para personal, nem para aluno. Fora do escopo pedido.
- **Sem paginação** em nenhuma listagem (alunos, exercícios, alimentos, notificações) — aceitável no volume de teste, pode doer com uma base de alunos grande.
- **Painel de Admin é mínimo de propósito** — só o que a API expõe (`GET /admin/tenants`, `POST /admin/assisted-access`). Não há tela pra usar o token de acesso assistido gerado (ver `docs/BACKEND-TENANCY-ADMIN-NOTIFICATIONS.md`, seção 5, item 1 — o próprio backend ainda não aceita esse token nos controllers tenant-scoped).

## 6. Próxima etapa

`apps/mobile` (Expo SDK 54 + NativeWind) — opcional e só depois de web/backend validados, que é o estado atual. Reaproveitar `packages/shared-types` (já populado nesta etapa) e o mesmo padrão de `lib/api/*.ts` — a camada de API do mobile deveria ser praticamente uma cópia adaptada da de `apps/web`, já que o contrato HTTP é idêntico.
