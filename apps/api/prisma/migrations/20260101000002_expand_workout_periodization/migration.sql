-- ============================================================
-- Migration: expand_workout_periodization
-- Gerada manualmente a partir de `prisma migrate diff` (CLI recusa
-- `migrate dev` em ambiente não-interativo) — só as partes genuinamente
-- novas foram extraídas. O diff automático recriava TODAS as foreign
-- keys do banco (porque as migrations `init`/`constraints_and_rls` usam
-- nomes manuais de constraint, diferentes do padrão que o Prisma
-- gera) — ruído descartado aqui. Também descartadas as linhas
-- `CREATE UNIQUE INDEX uq_students_email_per_tenant` / `uq_users_email_per_tenant`
-- que o diff sugeriu: essas já existem fisicamente como ÍNDICE ÚNICO
-- PARCIAL (`WHERE email IS NOT NULL` / `WHERE tenant_id IS NOT NULL`,
-- criados em constraints_and_rls — Prisma não expressa WHERE em
-- @@unique, ver PRISMA-MODEL.md seção 3) — recriar sem o WHERE colidiria
-- de nome com o índice parcial já existente.
-- ============================================================

CREATE TYPE "SetTechnique" AS ENUM ('STANDARD', 'FEEDER_SET', 'WORKING_SET', 'TOP_SET', 'BACK_OFF_SET', 'DROP_SET', 'REST_PAUSE', 'OTHER');

-- Blocos de série (técnica/sets/reps/carga/descanso) migram de
-- workout_exercises pra tabela própria set_blocks — um exercício pode
-- ter múltiplos blocos agora.
ALTER TABLE "workout_exercises" DROP COLUMN "load_type",
DROP COLUMN "load_value",
DROP COLUMN "reps_max",
DROP COLUMN "reps_min",
DROP COLUMN "rest_seconds",
DROP COLUMN "sets",
ADD COLUMN "freeform_prescription" TEXT,
ADD COLUMN "video_url" TEXT,
ADD COLUMN "weekly_frequency_max" SMALLINT,
ADD COLUMN "weekly_frequency_min" SMALLINT;

ALTER TABLE "workouts" ADD COLUMN "default_rest_seconds_max" INTEGER,
ADD COLUMN "default_rest_seconds_min" INTEGER,
ADD COLUMN "microcycle_id" UUID;

CREATE TABLE "set_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "workout_exercise_id" UUID NOT NULL,
    "order" SMALLINT NOT NULL,
    "technique" "SetTechnique" NOT NULL DEFAULT 'STANDARD',
    "sets" SMALLINT NOT NULL,
    "reps_min" SMALLINT NOT NULL,
    "reps_max" SMALLINT NOT NULL,
    "load_type" "LoadType" NOT NULL,
    "load_value" DECIMAL(6,2),
    "rest_seconds_min" INTEGER,
    "rest_seconds_max" INTEGER,
    "notes" TEXT,

    CONSTRAINT "set_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "microcycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "order" SMALLINT NOT NULL,
    "weeks" SMALLINT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "microcycles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_set_blocks_workout_exercise" ON "set_blocks"("workout_exercise_id");
CREATE UNIQUE INDEX "uq_set_blocks_order" ON "set_blocks"("workout_exercise_id", "order");
CREATE INDEX "idx_microcycles_tenant" ON "microcycles"("tenant_id");
CREATE UNIQUE INDEX "uq_microcycles_student_order" ON "microcycles"("student_id", "order");
CREATE INDEX "idx_workouts_microcycle" ON "workouts"("microcycle_id");

ALTER TABLE "workouts" ADD CONSTRAINT "workouts_microcycle_id_fkey" FOREIGN KEY ("microcycle_id") REFERENCES "microcycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "set_blocks" ADD CONSTRAINT "set_blocks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "set_blocks" ADD CONSTRAINT "set_blocks_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "microcycles" ADD CONSTRAINT "microcycles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "microcycles" ADD CONSTRAINT "microcycles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (camada 4 de defesa, mesmo padrão de constraints_and_rls) pras duas tabelas novas.
ALTER TABLE set_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_set_blocks ON set_blocks
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE microcycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_microcycles ON microcycles
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
