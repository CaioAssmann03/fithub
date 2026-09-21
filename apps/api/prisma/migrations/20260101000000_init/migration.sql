-- ============================================================
-- Migration: init
-- Gerada manualmente a partir de database/schema.sql (Etapa 3), com um
-- ajuste sistemático: todo campo que era VARCHAR+CHECK virou enum nativo
-- do Postgres, porque é isso que schema.prisma (Etapa 4) declara e o
-- Prisma Client espera. CHECK constraints que não eram enum (faixa
-- numérica, regra cruzada entre colunas) e os índices únicos parciais
-- ficam na migration seguinte (constraints_and_rls) — Prisma não
-- expressa nenhum dos dois de forma declarativa.
-- ============================================================

CREATE TYPE "TenantPlan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'PERSONAL_TRAINER', 'STUDENT');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "StudentGoalType" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'CONDITIONING', 'REHABILITATION', 'GENERAL_HEALTH', 'OTHER');
CREATE TYPE "BmiClassification" AS ENUM ('UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESE');
CREATE TYPE "BodyFatMethod" AS ENUM ('MANUAL', 'BIOIMPEDANCE', 'SKINFOLD_FORMULA');
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'FULL_BODY', 'CARDIO', 'GLUTES', 'CALVES');
CREATE TYPE "Equipment" AS ENUM ('BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT', 'CABLE', 'BAND', 'KETTLEBELL');
CREATE TYPE "LifecycleStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "LoadType" AS ENUM ('FIXED_WEIGHT', 'BODYWEIGHT', 'PERCENTAGE_1RM');
CREATE TYPE "AppointmentType" AS ENUM ('ASSESSMENT', 'CONSULTATION', 'WORKOUT_SESSION', 'OTHER');
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'WHATSAPP');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- ------------------------------------------------------------
-- 1. TENANCY
-- ------------------------------------------------------------

CREATE TABLE "tenants" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID,
  name VARCHAR(120) NOT NULL,
  plan "TenantPlan" NOT NULL DEFAULT 'FREE',
  status "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. IDENTITY
-- ------------------------------------------------------------

CREATE TABLE "users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role "UserRole" NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_users_email_per_tenant ON users(tenant_id, email) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_users_tenant ON users(tenant_id);

ALTER TABLE tenants ADD CONSTRAINT fk_tenants_owner FOREIGN KEY (owner_user_id) REFERENCES users(id);
-- Um User possui no máximo um Tenant (relação 1:1 "TenantOwner" em
-- schema.prisma exige @unique do lado que carrega a FK) — corrigido ao
-- rodar `prisma generate` pela primeira vez, ver
-- docs/BACKEND-TENANCY-ADMIN-NOTIFICATIONS.md.
CREATE UNIQUE INDEX uq_tenants_owner_user ON tenants(owner_user_id);

CREATE TABLE "refresh_tokens" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  family_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);

-- ------------------------------------------------------------
-- 3. FILES
-- ------------------------------------------------------------

CREATE TABLE "files" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  uploaded_by_user_id UUID REFERENCES users(id),
  storage_key VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_tenant ON files(tenant_id);

CREATE TABLE "trainer_profiles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  cref VARCHAR(20),
  specialty VARCHAR(120),
  bio TEXT,
  avatar_file_id UUID REFERENCES files(id),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trainer_profiles_tenant ON trainer_profiles(tenant_id);

-- ------------------------------------------------------------
-- 4. STUDENTS
-- ------------------------------------------------------------

CREATE TABLE "students" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID UNIQUE REFERENCES users(id),
  name VARCHAR(160) NOT NULL,
  gender "Gender" NOT NULL,
  birth_date DATE NOT NULL,
  height_cm NUMERIC(5,2),
  goal_type "StudentGoalType",
  goal_detail TEXT,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  notes TEXT,
  status "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_tenant ON students(tenant_id);
CREATE INDEX idx_students_tenant_status ON students(tenant_id, status);
CREATE UNIQUE INDEX uq_students_email_per_tenant ON students(tenant_id, email) WHERE email IS NOT NULL;

CREATE TABLE "student_photos" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id),
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_photos_student ON student_photos(student_id);

-- ------------------------------------------------------------
-- 5. ASSESSMENTS
-- ------------------------------------------------------------

CREATE TABLE "assessments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessed_at DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  height_cm NUMERIC(5,2) NOT NULL,
  bmi_value NUMERIC(4,1) NOT NULL,
  bmi_classification "BmiClassification" NOT NULL,
  body_fat_percent NUMERIC(4,1),
  body_fat_method "BodyFatMethod",
  circumferences JSONB,
  skinfolds JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_tenant ON assessments(tenant_id);
CREATE INDEX idx_assessments_student_date ON assessments(student_id, assessed_at DESC);

CREATE TABLE "assessment_photos" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id),
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_photos_assessment ON assessment_photos(assessment_id);

-- ------------------------------------------------------------
-- 6. EXERCISES + WORKOUTS
-- ------------------------------------------------------------

CREATE TABLE "exercises" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(160) NOT NULL,
  muscle_group "MuscleGroup" NOT NULL,
  equipment "Equipment"[] NOT NULL DEFAULT '{}',
  description TEXT,
  video_file_id UUID REFERENCES files(id),
  image_file_id UUID REFERENCES files(id),
  tags VARCHAR(40)[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_tenant ON exercises(tenant_id);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);

CREATE TABLE "workouts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  label VARCHAR(80) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES workouts(id),
  status "LifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workouts_tenant ON workouts(tenant_id);
CREATE INDEX idx_workouts_student_status ON workouts(student_id, status);

CREATE TABLE "workout_exercises" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  "order" SMALLINT NOT NULL,
  sets SMALLINT NOT NULL,
  reps_min SMALLINT NOT NULL,
  reps_max SMALLINT NOT NULL,
  load_type "LoadType" NOT NULL,
  load_value NUMERIC(6,2),
  rest_seconds INTEGER NOT NULL,
  notes TEXT
);

CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE UNIQUE INDEX uq_workout_exercises_order ON workout_exercises(workout_id, "order");

-- ------------------------------------------------------------
-- 7. FOOD CATALOG + DIETS
-- ------------------------------------------------------------

CREATE TABLE "foods" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(160) NOT NULL,
  calories_per_100g NUMERIC(6,2),
  protein_g NUMERIC(5,2),
  carbs_g NUMERIC(5,2),
  fat_g NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_foods_tenant ON foods(tenant_id);

CREATE TABLE "diets" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES diets(id),
  status "LifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  pdf_file_id UUID REFERENCES files(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diets_tenant ON diets(tenant_id);
CREATE INDEX idx_diets_student_status ON diets(student_id, status);

CREATE TABLE "meals" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  diet_id UUID NOT NULL REFERENCES diets(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  time TIME NOT NULL,
  "order" SMALLINT NOT NULL,
  notes TEXT
);

CREATE INDEX idx_meals_diet ON meals(diet_id);

CREATE TABLE "meal_foods" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id),
  quantity_value NUMERIC(6,2) NOT NULL,
  quantity_unit VARCHAR(10) NOT NULL,
  notes TEXT
);

CREATE INDEX idx_meal_foods_meal ON meal_foods(meal_id);

-- ------------------------------------------------------------
-- 8. FEEDBACK
-- ------------------------------------------------------------

CREATE TABLE "feedbacks" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  general_rating SMALLINT,
  muscle_soreness SMALLINT,
  difficulty SMALLINT,
  mood SMALLINT,
  energy SMALLINT,
  sleep_quality SMALLINT,
  water_intake_l NUMERIC(3,1),
  self_reported_weight_kg NUMERIC(5,2),
  notes TEXT
);

CREATE INDEX idx_feedbacks_tenant ON feedbacks(tenant_id);
CREATE INDEX idx_feedbacks_student_date ON feedbacks(student_id, submitted_at DESC);

-- ------------------------------------------------------------
-- 9. APPOINTMENTS
-- ------------------------------------------------------------

CREATE TABLE "appointments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type "AppointmentType" NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes SMALLINT NOT NULL DEFAULT 60,
  status "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_tenant_scheduled ON appointments(tenant_id, scheduled_at);
CREATE INDEX idx_appointments_student ON appointments(student_id);

-- ------------------------------------------------------------
-- 10. NOTIFICATIONS + AUDIT
-- ------------------------------------------------------------

CREATE TABLE "notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  recipient_user_id UUID NOT NULL REFERENCES users(id),
  channel "NotificationChannel" NOT NULL,
  type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id, status);

CREATE TABLE "audit_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
