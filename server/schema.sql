-- ============================================================
-- Q-SAGE AI  –  PostgreSQL Schema  (run once in Neon SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  email       VARCHAR(255)  NOT NULL,
  password    VARCHAR(255)  NOT NULL,
  role        VARCHAR(50)   NOT NULL CHECK (role IN ('admin','faculty','student')),
  department  VARCHAR(255)  DEFAULT NULL,
  status      VARCHAR(50)   DEFAULT 'active',
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (email, role)
);

CREATE TABLE IF NOT EXISTS syllabi (
  id          SERIAL PRIMARY KEY,
  faculty_id  INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_name VARCHAR(255)  NOT NULL,
  course_code VARCHAR(50)   NOT NULL,
  semester    VARCHAR(50),
  file_path   VARCHAR(500),
  status      VARCHAR(20)   DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS syllabus_modules (
  id          SERIAL PRIMARY KEY,
  syllabus_id INT           NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
  module_no   INT           NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  topics      JSONB
);

CREATE TABLE IF NOT EXISTS questions (
  id               SERIAL PRIMARY KEY,
  syllabus_id      INT          REFERENCES syllabi(id) ON DELETE SET NULL,
  faculty_id       INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_bank_id INT          DEFAULT NULL,
  text             TEXT         NOT NULL,
  type             VARCHAR(50)  NOT NULL DEFAULT 'Short Answer',
  difficulty       VARCHAR(20)  NOT NULL DEFAULT 'Medium',
  module_no        INT          DEFAULT 1,
  marks            INT          DEFAULT 2,
  answer           TEXT,
  btl              VARCHAR(50)  DEFAULT NULL,
  co               VARCHAR(20)  DEFAULT NULL,
  options          JSONB        DEFAULT NULL,
  status           VARCHAR(20)  DEFAULT 'pending',
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_papers (
  id             SERIAL PRIMARY KEY,
  faculty_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution    VARCHAR(255),
  course_name    VARCHAR(255) NOT NULL,
  exam_type      VARCHAR(100),
  total_marks    INT          DEFAULT 100,
  exam_date      DATE,
  status         VARCHAR(20)  DEFAULT 'pending',
  file_url       VARCHAR(500) DEFAULT NULL,
  question_count INT          DEFAULT 0,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_sections (
  id            SERIAL PRIMARY KEY,
  paper_id      INT          NOT NULL REFERENCES question_papers(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  section_order INT          DEFAULT 1
);

CREATE TABLE IF NOT EXISTS paper_questions (
  id          SERIAL PRIMARY KEY,
  section_id  INT NOT NULL REFERENCES paper_sections(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INT          REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(255) NOT NULL,
  details    JSONB,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qbank_files (
  id            SERIAL PRIMARY KEY,
  faculty_id    INT          NOT NULL,
  course_name   VARCHAR(255) NOT NULL,
  course_code   VARCHAR(50)  NOT NULL,
  file_path     VARCHAR(255),
  original_name VARCHAR(255),
  status        VARCHAR(20)  DEFAULT 'active',
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_banks (
  id             SERIAL PRIMARY KEY,
  faculty_id     INT          NOT NULL,
  syllabus_id    INT          DEFAULT NULL,
  course_name    VARCHAR(255) NOT NULL,
  course_code    VARCHAR(100) DEFAULT '',
  faculty_name   VARCHAR(255) DEFAULT '',
  college        VARCHAR(255) DEFAULT '',
  department     VARCHAR(255) DEFAULT '',
  status         VARCHAR(20)  DEFAULT 'pending',
  file_url       VARCHAR(500) DEFAULT NULL,
  question_count INT          DEFAULT 0,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);
