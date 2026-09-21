-- ============================================================
-- FitHub — Database Schema (Etapa 3/10)
-- PostgreSQL 14+. gen_random_uuid() é nativo desde o PG13.
-- Convenção: snake_case aqui. Prisma (Etapa 4) mapeia pra
-- camelCase via @map/@@map — nome de coluna real não muda.
-- Ordem das tabelas segue dependência de FK.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TENANCY
-- ------------------------------------------------------------

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID, -- FK adicionada só depois de criar users (bootstrap circular, ver DATABASE-MODEL.md)
  name VARCHAR(120) NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'FREE',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_tenant_plan CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE')),
  CONSTRAINT chk_tenant_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED'))
);

-- ------------------------------------------------------------
-- 2. IDENTITY
-- ------------------------------------------------------------

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id), -- NULL só para PLATFORM_ADMIN
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_users_role CHECK (role IN ('PLATFORM_ADMIN', 'PERSONAL_TRAINER', 'STUDENT')),
  CONSTRAINT chk_admin_no_tenant CHECK (
    (role = 'PLATFORM_ADMIN' AND tenant_id IS NULL) OR (role <> 'PLATFORM_ADMIN' AND tenant_id IS NOT NULL)
  )
);

-- E-mail único por tenant (cobre STUDENT — mesma pessoa pode ser aluna de dois personais diferentes)...
CREATE UNIQUE INDEX uq_users_email_per_tenant ON users(tenant_id, email) WHERE tenant_id IS NOT NULL;
-- ...mas PERSONAL_TRAINER e PLATFORM_ADMIN precisam de e-mail único GLOBALMENTE: cada trainer novo
-- cria um tenant novo, então (tenant_id, email) nunca colidiria entre dois cadastros de trainer
-- diferentes — sem isso, o mesmo e-mail poderia abrir infinitas contas de personal. Descoberto
-- implementando RegisterTrainerUseCase na Etapa 5 (correção em relação à Etapa 3 original).
CREATE UNIQUE INDEX uq_users_email_trainer_admin ON users(email) WHERE role IN ('PERSONAL_TRAINER', 'PLATFORM_ADMIN');
CREATE INDEX idx_users_tenant ON users(tenant_id);

ALTER TABLE tenants ADD CONSTRAINT fk_tenants_owner FOREIGN KEY (owner_user_id) REFERENCES users(id);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id), -- espelha users.tenant_id (denormalizado — ver DATABASE-MODEL.md seção 4)
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
-- 3. FILES (Object Storage — metadado só; binário fica no S3)
-- ------------------------------------------------------------

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  uploaded_by_user_id UUID REFERENCES users(id),
  storage_key VARCHAR(500) NOT NULL, -- caminho no bucket; URL assinada é gerada em runtime, nunca guardada aqui
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_tenant ON files(tenant_id);

CREATE TABLE trainer_profiles (
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
-- 4. STUDENTS (Core Domain)
-- ------------------------------------------------------------

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID UNIQUE REFERENCES users(id), -- opcional: só quando o aluno tem acesso ao app (Etapa 2, seção 6)
  name VARCHAR(160) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  birth_date DATE NOT NULL,
  height_cm NUMERIC(5,2),
  goal_type VARCHAR(30),
  goal_detail TEXT,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  notes TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_students_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  CONSTRAINT chk_students_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_students_tenant ON students(tenant_id);
CREATE INDEX idx_students_tenant_status ON students(tenant_id, status);
CREATE UNIQUE INDEX uq_students_email_per_tenant ON students(tenant_id, email) WHERE email IS NOT NULL;

CREATE TABLE student_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id),
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_photos_student ON student_photos(student_id);

-- ------------------------------------------------------------
-- 5. ASSESSMENTS (Core Domain)
-- ------------------------------------------------------------

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessed_at DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  height_cm NUMERIC(5,2) NOT NULL, -- snapshot: garante BMI histórico estável mesmo se students.height_cm mudar depois
  bmi_value NUMERIC(4,1) NOT NULL,
  bmi_classification VARCHAR(20) NOT NULL,
  body_fat_percent NUMERIC(4,1),
  body_fat_method VARCHAR(20),
  circumferences JSONB, -- {"waist": 80.5, "hip": 95.0, ...} em cm
  skinfolds JSONB,      -- {"triceps": 12.5, "chest": 8.0, ...} em mm
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_assessments_weight CHECK (weight_kg > 0 AND weight_kg <= 400)
);

CREATE INDEX idx_assessments_tenant ON assessments(tenant_id);
CREATE INDEX idx_assessments_student_date ON assessments(student_id, assessed_at DESC);

CREATE TABLE assessment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id),
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_photos_assessment ON assessment_photos(assessment_id);

-- ------------------------------------------------------------
-- 6. EXERCISES (catálogo híbrido) + WORKOUTS (Core Domain)
-- ------------------------------------------------------------

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id), -- NULL = catálogo global
  name VARCHAR(160) NOT NULL,
  muscle_group VARCHAR(30) NOT NULL,
  equipment VARCHAR(30)[] NOT NULL DEFAULT '{}',
  description TEXT,
  video_file_id UUID REFERENCES files(id),
  image_file_id UUID REFERENCES files(id),
  tags VARCHAR(40)[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_tenant ON exercises(tenant_id);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  label VARCHAR(80) NOT NULL, -- "Treino A", "Treino B"...
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES workouts(id),
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_workouts_status CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE INDEX idx_workouts_tenant ON workouts(tenant_id);
CREATE INDEX idx_workouts_student_status ON workouts(student_id, status);
-- Só 1 versão ACTIVE por (student, label) — a regra da Etapa 2 (createNewVersion) reforçada no banco
CREATE UNIQUE INDEX uq_workouts_active_label ON workouts(student_id, label) WHERE status = 'ACTIVE';

CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  "order" SMALLINT NOT NULL,
  sets SMALLINT NOT NULL,
  reps_min SMALLINT NOT NULL,
  reps_max SMALLINT NOT NULL,
  load_type VARCHAR(20) NOT NULL,
  load_value NUMERIC(6,2),
  rest_seconds INTEGER NOT NULL,
  notes TEXT,
  CONSTRAINT chk_workout_exercises_load_type CHECK (load_type IN ('FIXED_WEIGHT', 'BODYWEIGHT', 'PERCENTAGE_1RM'))
);

CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE UNIQUE INDEX uq_workout_exercises_order ON workout_exercises(workout_id, "order");

-- ------------------------------------------------------------
-- 7. FOOD CATALOG + DIETS
-- ------------------------------------------------------------

CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id), -- NULL = catálogo global, mesmo padrão de exercises
  name VARCHAR(160) NOT NULL,
  calories_per_100g NUMERIC(6,2),
  protein_g NUMERIC(5,2),
  carbs_g NUMERIC(5,2),
  fat_g NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_foods_tenant ON foods(tenant_id);

CREATE TABLE diets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES diets(id),
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  pdf_file_id UUID REFERENCES files(id), -- populado pelo worker (Etapa 5) depois de gerar o PDF
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_diets_status CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE INDEX idx_diets_tenant ON diets(tenant_id);
CREATE INDEX idx_diets_student_status ON diets(student_id, status);
CREATE UNIQUE INDEX uq_diets_active_name ON diets(student_id, name) WHERE status = 'ACTIVE';

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  diet_id UUID NOT NULL REFERENCES diets(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL, -- "Café da manhã", "Almoço"...
  time TIME NOT NULL,
  "order" SMALLINT NOT NULL,
  notes TEXT
);

CREATE INDEX idx_meals_diet ON meals(diet_id);

CREATE TABLE meal_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id),
  quantity_value NUMERIC(6,2) NOT NULL,
  quantity_unit VARCHAR(10) NOT NULL, -- g | ml | unidade
  notes TEXT
);

CREATE INDEX idx_meal_foods_meal ON meal_foods(meal_id);

-- ------------------------------------------------------------
-- 8. FEEDBACK
-- ------------------------------------------------------------

CREATE TABLE feedbacks (
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
  self_reported_weight_kg NUMERIC(5,2), -- separado de assessments.weight_kg (Etapa 2, seção 5)
  notes TEXT,
  CONSTRAINT chk_feedback_scales CHECK (
    general_rating BETWEEN 0 AND 10 AND muscle_soreness BETWEEN 0 AND 10 AND
    difficulty BETWEEN 0 AND 10 AND mood BETWEEN 0 AND 10 AND
    energy BETWEEN 0 AND 10 AND sleep_quality BETWEEN 0 AND 10
  )
);

CREATE INDEX idx_feedbacks_tenant ON feedbacks(tenant_id);
CREATE INDEX idx_feedbacks_student_date ON feedbacks(student_id, submitted_at DESC);

-- ------------------------------------------------------------
-- 9. APPOINTMENTS
-- ------------------------------------------------------------

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes SMALLINT NOT NULL DEFAULT 60,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_appointments_type CHECK (type IN ('ASSESSMENT', 'CONSULTATION', 'WORKOUT_SESSION', 'OTHER')),
  CONSTRAINT chk_appointments_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'))
);

CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_tenant_scheduled ON appointments(tenant_id, scheduled_at);
CREATE INDEX idx_appointments_student ON appointments(student_id);

-- ------------------------------------------------------------
-- 10. NOTIFICATIONS + AUDIT
-- ------------------------------------------------------------

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  recipient_user_id UUID NOT NULL REFERENCES users(id),
  channel VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_notifications_channel CHECK (channel IN ('PUSH', 'EMAIL', 'WHATSAPP')),
  CONSTRAINT chk_notifications_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ'))
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id, status);

-- Append-only por convenção de aplicação — sem updated_at de propósito.
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id), -- NULL em ação verdadeiramente cross-tenant do Platform Admin
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
