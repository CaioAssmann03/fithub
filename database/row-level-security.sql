-- ============================================================
-- FitHub — Row-Level Security (Etapa 3/10)
-- Última linha de defesa do isolamento de tenant. A Prisma Client
-- Extension (Etapa 5) executa SET LOCAL app.tenant_id = '<uuid>'
-- no início de cada transação. Para o fluxo de "acesso assistido"
-- do Platform Admin (seção 11 do ARCHITECTURE.md), a mesma
-- extension seta SET LOCAL app.is_platform_admin = true — só
-- depois de validar o role no JWT e gravar em audit_logs.
-- ============================================================

-- ------------------------------------------------------------
-- Padrão A — tenant_id NOT NULL, sem exceção de catálogo global
-- ------------------------------------------------------------

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_files ON files
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_trainer_profiles ON trainer_profiles
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_students ON students
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE student_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_student_photos ON student_photos
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_assessments ON assessments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE assessment_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_assessment_photos ON assessment_photos
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_workouts ON workouts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_workout_exercises ON workout_exercises
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE diets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_diets ON diets
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_meals ON meals
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE meal_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_meal_foods ON meal_foods
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_feedbacks ON feedbacks
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_appointments ON appointments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_notifications ON notifications
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ------------------------------------------------------------
-- Padrão B — tenant_id NULLABLE (catálogo híbrido: global + tenant)
-- ------------------------------------------------------------

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_exercises ON exercises
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_foods ON foods
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- ------------------------------------------------------------
-- Padrão C — tenant_id NULLABLE por causa do PLATFORM_ADMIN
-- ------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_users ON users
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.is_platform_admin', true)::boolean IS TRUE
  );

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_refresh_tokens ON refresh_tokens
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.is_platform_admin', true)::boolean IS TRUE
  );

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.is_platform_admin', true)::boolean IS TRUE
  );

-- tenants é o único caso onde o filtro é por id, não por tenant_id
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tenants ON tenants
  USING (
    id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.is_platform_admin', true)::boolean IS TRUE
  );
