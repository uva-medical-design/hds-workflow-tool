-- HDS Workflow Tool - Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Based on: docs/2026-02-05-workflow-tool-data-model.md

-- ============================================
-- TABLE: users
-- Roster-based, pre-populated by instructor
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  campus TEXT, -- 'UVA Cville' or 'INOVA'
  role TEXT DEFAULT 'student', -- 'student' | 'instructor' | 'ta'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: projects
-- One row per student project
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT, -- Project name (set in Phase 7, nullable until then)
  slug TEXT, -- URL-safe identifier, auto-generated from name
  current_phase INTEGER DEFAULT 1, -- 1-7
  current_step TEXT, -- e.g., 'input', 'synthesis', 'decision'
  status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, slug)
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============================================
-- TABLE: phase_data
-- Stores all inputs and AI responses for each phase
-- This is the core autosave table
-- ============================================
CREATE TABLE IF NOT EXISTS phase_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL, -- 1-7

  -- User inputs (JSONB for flexibility)
  inputs JSONB DEFAULT '{}',

  -- AI synthesis results
  synthesis JSONB DEFAULT '{}',

  -- Iteration history (array of previous synthesis attempts)
  iteration_history JSONB DEFAULT '[]',

  -- Status
  status TEXT DEFAULT 'in_progress', -- 'in_progress' | 'accepted' | 'skipped'
  accepted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, phase)
);

-- Indexes for phase_data
CREATE INDEX IF NOT EXISTS idx_phase_data_project ON phase_data(project_id);
CREATE INDEX IF NOT EXISTS idx_phase_data_status ON phase_data(status);

-- ============================================
-- TABLE: versions
-- Tracks finalized artifact versions (mirrored to GitHub)
-- ============================================
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL, -- 'v1.0', 'v1.1', 'v2.0'

  -- What triggered this version
  trigger TEXT NOT NULL, -- 'phase_7_complete' | 'build_feedback' | 'manual_revision'
  trigger_details JSONB DEFAULT '{}',

  -- Artifact references (GitHub URLs)
  prd_url TEXT,
  story_url TEXT,

  -- Artifact content (cached for quick access)
  prd_content TEXT,
  story_content TEXT,

  -- Diff from previous version
  diff_summary JSONB DEFAULT '{}', -- {"added": [], "changed": [], "removed": []}

  -- GitHub commit info
  github_commit_sha TEXT,
  github_commit_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, version_number)
);

-- Index for versions
CREATE INDEX IF NOT EXISTS idx_versions_project ON versions(project_id);

-- ============================================
-- TABLE: build_feedback
-- Post-build feedback from students
-- ============================================
CREATE TABLE IF NOT EXISTS build_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Feedback content
  screenshots JSONB DEFAULT '[]', -- Array of file IDs from storage
  quick_wins TEXT,
  gaps_struggles TEXT,
  goal_alignment TEXT, -- 'nailed_it' | 'partially' | 'missed'
  feature_status JSONB DEFAULT '[]', -- [{"feature": "string", "status": "working|partial|not_done"}]
  prd_change_suggestions TEXT,

  -- AI analysis
  ai_analysis JSONB DEFAULT '{}',
  suggested_updates JSONB DEFAULT '[]',

  -- Did this trigger a new version?
  triggered_version_id UUID REFERENCES versions(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for build_feedback
CREATE INDEX IF NOT EXISTS idx_feedback_project ON build_feedback(project_id);

-- ============================================
-- TABLE: files
-- Tracks uploaded files (stored in Supabase Storage)
-- ============================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage

  -- Context
  phase INTEGER, -- Which phase was this uploaded in?
  purpose TEXT, -- 'research', 'screenshot', 'reference'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for files
CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id);

-- ============================================
-- TABLE: sessions (optional)
-- Track user sessions for analytics
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- What happened this session
  phases_touched INTEGER[], -- e.g., [3, 4]
  actions_count INTEGER DEFAULT 0
);

-- ============================================
-- SEED DATA: Initial roster (10 people)
-- ============================================
INSERT INTO users (name, email, campus, role) VALUES
  ('Christopher Baiocco', 'cb@virginia.edu', NULL, 'student'),
  ('Danielle Jones', 'dj@virginia.edu', NULL, 'student'),
  ('Farah Kabir', 'fk@virginia.edu', NULL, 'student'),
  ('Magdalene Kwarteng', 'mk@virginia.edu', NULL, 'student'),
  ('Matthew Nguyen', 'mn@virginia.edu', NULL, 'student'),
  ('Kevin Shannon', 'ks@virginia.edu', NULL, 'student'),
  ('Joselyne Tessa Tonleu', 'jtt@virginia.edu', NULL, 'student'),
  ('Matt Trowbridge', 'mtrowbridge@virginia.edu', 'UVA Cville', 'instructor'),
  ('Farah Turkistani', 'ft@virginia.edu', NULL, 'ta'),
  ('Jonathan Swap', 'js@virginia.edu', NULL, 'ta')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_phase_data_updated_at ON phase_data;
CREATE TRIGGER update_phase_data_updated_at
  BEFORE UPDATE ON phase_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
