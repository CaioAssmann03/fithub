# FitHub

SaaS multi-tenant para Personal Trainers gerenciarem alunos, treinos, avaliações físicas, dietas, feedback e agenda — tudo em uma plataforma só, com cada personal operando um ambiente isolado.

> Para o estado real do código, o que compila e o que falta, ver **`CLAUDE.md`** — este README é sobre o produto e as decisões, não sobre o progresso da implementação.

## Sumário

1. O que estamos construindo
2. Por que essas decisões de arquitetura
3. Stack
4. Como estamos construindo
5. Estrutura do repositório
6. Status atual
7. Onde ler mais

## 1. O que estamos construindo

Três perfis de usuário, uma plataforma:

- **Personal Trainer** — dono do tenant. Cadastra e gerencia alunos, cria e versiona treinos, registra avaliações físicas (peso, IMC, dobras cutâneas, circunferências), monta dietas, agenda sessões, recebe feedback dos alunos, gerencia catálogo de exercícios e alimentos.
- **Aluno** — acesso opcional (o personal decide se habilita). Quando habilitado, o aluno vê os próprios treinos e dietas e envia check-ins de feedback (dor muscular, dificuldade, humor, energia, sono).
- **Admin da Plataforma** — não pertence a nenhum tenant. Gerencia o catálogo global de exercícios/alimentos e tem acesso assistido (auditado, com token de curta duração) a um tenant específico para suporte.

Módulos: Identidade/Auth, Tenancy, Alunos, Avaliações, Treinos, Catálogo de Exercícios, Dietas, Catálogo de Alimentos, Feedback, Agenda, Notificações, Dashboard, Admin.

## 2. Por que essas decisões de arquitetura

Duas restrições não-negociáveis guiaram (quase) toda decisão técnica:

1. **Isolamento de tenant é absoluto.** Nenhum dado de um personal pode vazar para outro — nem por bug de aplicação, nem por query mal escrita. Por isso: defesa em 4 camadas independentes (convenção de schema, `TenantContext` via `AsyncLocalStorage`, Prisma Client Extension que injeta o filtro automaticamente, Row-Level Security no Postgres como última linha).
2. **O sistema precisa nascer pronto pra produção**, não como protótipo — testabilidade, segurança e observabilidade são requisito desde o design, não algo adicionado depois.

Escala assumida (revisável): dezenas a poucas centenas de personal trainers ativos no primeiro ano, cada um com até algumas centenas de alunos. Essa premissa é o que justifica multi-tenancy *pooled* (banco único + RLS) em vez de banco ou schema por tenant — melhor custo-benefício pra muitos tenants pequenos. Se a expectativa mudar pra centenas de milhares de tenants ou contratos enterprise com isolamento físico obrigatório, essa decisão específica precisaria ser revisitada.

Estilo arquitetural: **monólito modular** — deploy único, mas fronteiras internas tratadas como se fossem fronteiras de serviço (um módulo nunca importa o repositório de outro diretamente). Isso é o que transformaria uma eventual extração pra microsserviços, no futuro, em problema de infraestrutura, não de re-arquitetura. Dentro de cada módulo, **Clean Architecture** (domain/application/infrastructure/presentation) com **DDD tático** (Entities, Value Objects, Aggregates, Domain Events, Repository Pattern) nos módulos onde a regra de negócio é real demais pra CRUD anêmico — é o caso de Treinos e Dietas, que usam **versionamento** (editar um treino publicado não sobrescreve, cria uma nova versão e arquiva a anterior).

Decisões completas e a razão de cada uma: `docs/ARCHITECTURE.md`.

## 3. Stack

| Camada | Tecnologia | Nota |
|---|---|---|
| Backend | NestJS + TypeScript | Clean Architecture + DDD, monólito modular |
| Banco | PostgreSQL | multi-tenancy pooled + Row-Level Security |
| ORM | Prisma `^6.14.0` | não é a v7 (atual) de propósito — v7 exige ESM no projeto inteiro, todo o código daqui usa import relativo CommonJS |
| Cache / filas | Redis | agregados do dashboard, rate limiting, base pra BullMQ (ainda não implementado) |
| Frontend web | Next.js + React + Tailwind CSS 4 | painel do personal + painel do aluno |
| Mobile | Expo / React Native `~54.0.0` | SDK 54, não o mais novo — única versão com combinação testada com NativeWind |
| Autenticação | JWT curto + Refresh Token rotativo, Argon2id | revogação por família de token em caso de reuso detectado |
| Comunicação entre módulos | Domain Events in-process (`@nestjs/event-emitter`) | trocável por message broker depois sem tocar no domínio |
| Monorepo | pnpm workspaces | `apps/api`, `apps/web`, `apps/mobile`, `packages/shared-types` |
| Containerização | Docker multi-stage | migrations reais do Prisma aplicadas automaticamente no start do container |

## 4. Como estamos construindo

Construção em etapas sequenciais, cada uma com um documento em `docs/` registrando o que foi decidido e por quê — inclusive quando uma etapa posterior corrige ou ajusta algo de uma etapa anterior. A ideia é que a arquitetura e as decisões fiquem rastreáveis, não só o código.

Ordem: Arquitetura → DDD tático → Modelo de banco → Prisma → Backend (módulo por módulo) → Frontend web → Mobile → Testes → Docker → Deploy.

Isso está sendo feito com assistência de IA de forma incremental — o que significa que partes do projeto podem estar mais maduras que outras num dado momento. `CLAUDE.md` existe especificamente pra dar contexto a um agente de código continuando esse trabalho: o que já foi decidido, o que não pode ser quebrado, e o que falta.

## 5. Estrutura do repositório

```
apps/
  api/               NestJS — a API
  web/               Next.js — painel do personal + do aluno
  mobile/            Expo/React Native — apenas painel do aluno
packages/
  shared-types/      tipos TypeScript compartilhados entre os apps
database/            SQL de referência conceitual (schema, RLS)
docs/                um documento por etapa — decisões e razões
docker-compose.dev.yml   Postgres + Redis pra desenvolvimento local
docker-compose.yml       aplicação inteira containerizada
CLAUDE.md            contexto pra um agente de código continuando o projeto
```

## 6. Status atual

Ver `CLAUDE.md` para o detalhamento exato (o que compila, o que falta, débito técnico conhecido). Em linhas gerais: arquitetura, modelo de domínio, banco de dados e a maior parte do backend estão implementados; frontend e mobile ainda não foram construídos nesta versão do repositório.

## 7. Onde ler mais

- `docs/ARCHITECTURE.md` — visão completa, C4, as 12 decisões arquiteturais e por quê.
- `docs/DDD-MODEL.md` — modelagem tática: entidades, agregados, eventos de domínio.
- `docs/DATABASE-MODEL.md` — modelo relacional e a estratégia de isolamento de tenant em detalhe.
- `docs/PRISMA-MODEL.md` — como o schema Prisma mapeia pro banco, e o que o Prisma não expressa de forma declarativa.
- `docs/BACKEND-*.md` — decisões por módulo do backend.
- `CLAUDE.md` — estado atual do código e regras de arquitetura para quem for continuar a implementação.
