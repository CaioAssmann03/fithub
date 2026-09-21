-- ============================================================
-- Migration: constraints_and_rls
-- Tudo que o schema.prisma não expressa de forma declarativa — CHECK
-- constraints não-enum, índices únicos parciais, e Row-Level Security
-- completa (Etapa 3). `prisma migrate deploy` roda esta migration em
-- sequência depois da init, então o banco fica com o schema inteiro num
-- só comando.
-- ============================================================

ALTER TABLE users ADD CONSTRAINT chk_admin_no_tenant CHECK (
  (role = 'PLATFORM_ADMIN' AND tenant_id IS NULL) OR (role <> 'PLATFORM_ADMIN' AND tenant_id IS NOT NULL)
);

ALTER TABLE assessments ADD CONSTRAINT chk_assessments_weight CHECK (weight_kg > 0 AND weight_kg <= 400);

ALTER TABLE feedbacks ADD CONSTRAINT chk_feedback_scales CHECK (
  general_rating BETWEEN 0 AND 10 AND muscle_soreness BETWEEN 0 AND 10 AND
  difficulty BETWEEN 0 AND 10 AND mood BETWEEN 0 AND 10 AND
  energy BETWEEN 0 AND 10 AND sleep_quality BETWEEN 0 AND 10
);

CREATE UNIQUE INDEX uq_users_email_trainer_admin ON users(email) WHERE role IN ('PERSONAL_TRAINER', 'PLATFORM_ADMIN');
CREATE UNIQUE INDEX uq_workouts_active_label ON workouts(student_id, label) WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX uq_diets_active_name ON diets(student_id, name) WHERE status = 'ACTIVE';

-- ------------------------------------------------------------
-- Row-Level Security — última linha de defesa do isolamento de tenant.
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

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_exercises ON exercises
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_foods ON foods
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

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

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tenants ON tenants
  USING (
    id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.is_platform_admin', true)::boolean IS TRUE
  );
