-- Migration: Feedback Loop tables
-- Adds feedback_entries and feature_checklist for build mode

-- ============================================
-- TABLE: feedback_entries
-- Stream of individual observations during build
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'note', -- 'win' | 'gap' | 'question' | 'pivot' | 'note'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_entries_version ON feedback_entries(version_id);
CREATE INDEX IF NOT EXISTS idx_feedback_entries_project ON feedback_entries(project_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_feedback_entries_updated_at ON feedback_entries;
CREATE TRIGGER update_feedback_entries_updated_at
  BEFORE UPDATE ON feedback_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: feature_checklist
-- Per-version feature tracking
-- ============================================
CREATE TABLE IF NOT EXISTS feature_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  feature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started', -- 'working' | 'partial' | 'not_started'
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_checklist_version ON feature_checklist(version_id);
CREATE INDEX IF NOT EXISTS idx_feature_checklist_project ON feature_checklist(project_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_feature_checklist_updated_at ON feature_checklist;
CREATE TRIGGER update_feature_checklist_updated_at
  BEFORE UPDATE ON feature_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
