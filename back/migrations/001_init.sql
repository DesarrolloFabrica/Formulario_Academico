CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  google_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  picture TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_programs (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_semesters (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cycles (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO cycles (name)
VALUES ('Profesional'), ('Tecnico'), ('Tecnologo')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  program_id INTEGER NOT NULL REFERENCES academic_programs(id) ON DELETE CASCADE,
  semester_id INTEGER NOT NULL REFERENCES academic_semesters(id) ON DELETE CASCADE,
  cycle_id INTEGER NOT NULL REFERENCES cycles(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_schedules (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professors (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_modalities (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO class_modalities (name)
VALUES ('Presencial'), ('Hibrida'), ('Virtual')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS campuses (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO shifts (name)
VALUES ('Diurna'), ('Nocturna')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  document_number TEXT NOT NULL,
  academic_program TEXT NOT NULL,
  student_semester TEXT NOT NULL,
  shift TEXT,
  class_program TEXT NOT NULL,
  class_semester TEXT NOT NULL,
  subject TEXT NOT NULL,
  class_schedule TEXT NOT NULL,
  class_start_time TIME NOT NULL,
  class_end_time TIME NOT NULL,
  class_date DATE NOT NULL,
  professor_name TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('Presencial', 'Virtual', 'Hibrida')),
  campus_or_room TEXT,
  virtual_class_link TEXT,
  clarity_rating INTEGER NOT NULL CHECK (clarity_rating BETWEEN 1 AND 5),
  topic_mastery_rating INTEGER NOT NULL CHECK (topic_mastery_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER NOT NULL CHECK (punctuality_rating BETWEEN 1 AND 5),
  class_dynamics_rating INTEGER NOT NULL CHECK (class_dynamics_rating BETWEEN 1 AND 5),
  resources_rating INTEGER NOT NULL CHECK (resources_rating BETWEEN 1 AND 5),
  interaction_rating INTEGER NOT NULL CHECK (interaction_rating BETWEEN 1 AND 5),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  best_part_comment TEXT NOT NULL,
  improvement_comment TEXT NOT NULL,
  general_comment TEXT NOT NULL,
  would_recommend BOOLEAN NOT NULL,
  recommendation_reason TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_program_semester_name
  ON subjects (program_id, semester_id, lower(trim(name)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_program_semester_code
  ON subjects (program_id, semester_id, lower(trim(code)));

CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_subject ON evaluations(subject);

CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluations_once_per_subject_professor_day
  ON evaluations (
    user_id,
    lower(trim(subject)),
    lower(trim(professor_name)),
    class_date
  );
