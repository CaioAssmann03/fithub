# FitHub — Backend: Assessments e Workouts

**Etapa 5c de 10** — ... → Backend: Students ✅ → **Backend: Assessments/Workouts** → Backend: módulos restantes → ... → Frontend → Mobile → Testes → Docker → Deploy

> Fecha o Core Domain (Students ✅, Assessments ✅, Workouts ✅) — os três módulos que a Etapa 1 elegeu como onde investir mais rigor de modelagem.

## Sumário

1. Dois ajustes no domínio da Etapa 2, descobertos ao persistir de verdade
2. Assessments: o `BodyMetricsCalculatorService` finalmente chamado
3. Workouts: o primeiro agregado com entidade filha persistida à parte
4. O Unit of Work na prática — `VersionWorkoutUseCase`
5. Decisões desta etapa
6. Próxima etapa

## 1. Dois ajustes no domínio da Etapa 2, descobertos ao persistir de verdade

**`Bmi` só sabia calcular, não reconstruir.** `Bmi.fromWeightAndHeight()` (Etapa 2) sempre recalcula — correto para criar, errado para reidratar: um registro histórico não pode ficar sujeito a recálculo silencioso se a fórmula de classificação mudar um dia. Adicionado `Bmi.fromPersistedValue(value, classification)`, que só reconstrói o snapshot já gravado.

**`reconstitute()` propagado pra `Assessment` e `Workout`**, exatamente como decidido na Etapa 5b — nenhuma surpresa nova aqui, só aplicação do padrão já corrigido.

## 2. Assessments: o `BodyMetricsCalculatorService` finalmente chamado

`CreateAssessmentUseCase` é o primeiro lugar em que o domain service da Etapa 2 realmente roda: se vierem dobras cutâneas no payload, calcula `% de gordura` via fórmula (Jackson-Pollock, com o `biologicalSexForFormula` estreito de propósito — ver comentário no próprio service); senão, aceita o valor manual/bioimpedância informado direto. BMI é sempre calculado ali (nunca aceito como input — evita o personal mandar um valor inconsistente com peso/altura enviados).

## 3. Workouts: o primeiro agregado com entidade filha persistida à parte

`WorkoutExercise` não é JSON embutido nem uma tabela devassada por fora do agregado — é uma tabela própria (`workout_exercises`, Etapa 3), mas sempre lida e regravada junto do `Workout` pai, nunca isolada. `PrismaWorkoutRepository.save()` resolve isso com a estratégia mais simples que continua correta: apaga todas as `WorkoutExercise` daquele treino e recria a partir do estado atual do agregado em memória — não há cenário em que só uma exercise mude sem o agregado inteiro ter sido carregado primeiro, então não existe risco de perda de dado nessa troca.

## 4. O Unit of Work na prática — `VersionWorkoutUseCase`

Primeira vez, desde a Etapa 5a, que o `PrismaUnitOfWork` é usado fora do bootstrap de registro de trainer. `Workout.createNewVersion()` (Etapa 2) devolve uma **nova** instância e marca a atual como arquivada — duas linhas de `workouts` (mais o replace de `workout_exercises` da nova versão) que precisam commitar juntas. `uow.run()` garante isso; os dois `repository.save()` chamados lá dentro usam `PrismaService.currentClient`, que dentro da transação aponta pro `tx` correto (Etapa 5a, `TransactionContextService`) — exatamente o mecanismo desenhado pra esse caso.

## 5. Decisões desta etapa

1. **`Bmi.fromPersistedValue()`** (seção 1) — snapshot histórico nunca recalcula.
2. **Estratégia "apagar e recriar" pras `WorkoutExercise`** (seção 3) em vez de diff incremental — mais simples, correta dado que o agregado sempre é lido/gravado inteiro.
3. **BMI sempre calculado no Use Case, nunca aceito como input do personal** — evita inconsistência entre peso/altura enviados e o BMI "gravado por engano".
4. **Rota de versionamento é `POST /workouts/:id/versions`**, não `PUT /workouts/:id` — reforça na própria API que "editar" um treino publicado é criar algo novo, não mutar o existente.

## 6. Próxima etapa

Etapa 5d — Backend: os módulos de Suporte restantes (Exercises, Diets, Feedback, Appointments) e os Genéricos que faltam (Notifications completo, Tenancy/Admin). Esses são majoritariamente CRUD — sem CQRS, sem versionamento, sem domain service — então tendem a ser rápidos de implementar repetindo exatamente o padrão já estabelecido nas três etapas anteriores.
