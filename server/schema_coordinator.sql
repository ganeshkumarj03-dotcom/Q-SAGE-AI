-- ============================================================
-- Q-SAGE AI — Year Coordinator Schema Additions
-- Run this in your Neon SQL Editor ONCE
-- ============================================================

-- 1. Add coordinator flag to users (faculty who are also coordinators)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_coordinator BOOLEAN DEFAULT false;

-- 2. Extend question_banks status values for full workflow
-- Statuses: 'draft' | 'submitted_to_coordinator' | 'coordinator_approved' |
--           'coordinator_rejected' | 'forwarded_to_admin' | 'admin_approved' | 'admin_rejected'
-- No constraint change needed — existing VARCHAR(20) allows these values

-- 3. Coordinator reviews table
CREATE TABLE IF NOT EXISTS coordinator_reviews (
  id             SERIAL PRIMARY KEY,
  qbank_id       INT          NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
  coordinator_id INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action         VARCHAR(50)  NOT NULL CHECK (action IN ('approve','reject','forward')),
  remarks        TEXT,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- 4. Update existing question_banks rows that have null status
UPDATE question_banks SET status = 'draft' WHERE status IS NULL OR status = '';
