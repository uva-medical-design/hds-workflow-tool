// Database types based on Supabase schema

export type UserRole = "student" | "instructor" | "ta";

export interface User {
  id: string;
  name: string;
  email: string | null;
  campus: string | null;
  role: UserRole;
  created_at: string;
}

export type ProjectStatus = "active" | "completed" | "archived";

export interface Project {
  id: string;
  user_id: string;
  name: string | null;
  slug: string | null;
  current_phase: number;
  current_step: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type PhaseStatus = "in_progress" | "accepted" | "skipped";

export interface PhaseData {
  id: string;
  project_id: string;
  phase: number;
  inputs: Record<string, unknown>;
  synthesis: Record<string, unknown>;
  iteration_history: Record<string, unknown>[];
  status: PhaseStatus;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type VersionTrigger = "phase_7_complete" | "build_feedback" | "manual_revision";

export interface Version {
  id: string;
  project_id: string;
  version_number: string;
  trigger: VersionTrigger;
  trigger_details: Record<string, unknown>;
  prd_url: string | null;
  story_url: string | null;
  prd_content: string | null;
  story_content: string | null;
  diff_summary: {
    added: string[];
    changed: string[];
    removed: string[];
  };
  github_commit_sha: string | null;
  github_commit_url: string | null;
  created_at: string;
}

export type GoalAlignment = "nailed_it" | "partially" | "missed";
export type FeatureStatus = "working" | "partial" | "not_done";

export interface BuildFeedback {
  id: string;
  version_id: string;
  project_id: string;
  screenshots: string[];
  quick_wins: string | null;
  gaps_struggles: string | null;
  goal_alignment: GoalAlignment | null;
  feature_status: Array<{
    feature: string;
    status: FeatureStatus;
  }>;
  prd_change_suggestions: string | null;
  ai_analysis: Record<string, unknown>;
  suggested_updates: Record<string, unknown>[];
  triggered_version_id: string | null;
  created_at: string;
}

export type FilePurpose = "research" | "screenshot" | "reference";

export interface FileRecord {
  id: string;
  project_id: string;
  user_id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  phase: number | null;
  purpose: FilePurpose | null;
  created_at: string;
}

// Phase-specific input types

export interface Phase1Inputs {
  topic_description: string;
  personal_connection: string;
  observations: string;
  research_notes: string;
  file_ids: string[];
}

export interface Phase2Inputs {
  stakeholders: string[];
  primary_user_description: string;
  user_context: string;
  goals: string;
  frustrations: string;
  coping_strategies: string;
  secondary_users: Array<{
    name: string;
    notes: string;
  }>;
}

export interface Phase3Inputs {
  job_statement: string;
  functional_dimension: string;
  emotional_dimension: string;
  social_dimension: string;
  current_tools: Array<{
    name: string;
    strengths: string;
    gaps: string;
  }>;
  cross_field_inspiration: string;
}

export interface Phase4Inputs {
  journey_steps: Array<{
    step: string;
    label: "friction" | "neutral" | "delight";
    notes: string;
  }>;
  opportunities: string[];
  hmw_statements: string[];
  selected_opportunity: string;
}

export interface Phase5Inputs {
  insight_to_feature: Array<{
    insight: string;
    need: string;
    jtbd_connection: string;
    feature: string;
    rationale: string;
  }>;
  feature_priorities: Array<{
    feature: string;
    impact: 1 | 2 | 3 | 4 | 5;
    feasibility: 1 | 2 | 3 | 4 | 5;
    in_mvp: boolean;
  }>;
  product_personality: string;
  reference_apps: Array<{
    name: string;
    what_to_borrow: string;
  }>;
}

export interface Phase6Inputs {
  technical_constraints: string;
  success_criteria: string[];
  accessibility_requirements: string;
  security_requirements: string;
  tradeoff_decisions: Array<{
    question: string;
    choice: string;
    rationale: string;
  }>;
}

export type PlatformTarget = "claude_code" | "replit" | "lovable" | "other";

export interface Phase7Inputs {
  platform: PlatformTarget;
  deployment_goal: string;
  time_constraint: string;
  edge_cases: Array<{
    scenario: string;
    expected_behavior: string;
  }>;
  project_name: string;
  branding: {
    primary_color: string;
    tagline: string;
  };
  safety_guardrails: {
    never_do: string[];
    always_do: string[];
  };
}

export type PhaseInputs =
  | Phase1Inputs
  | Phase2Inputs
  | Phase3Inputs
  | Phase4Inputs
  | Phase5Inputs
  | Phase6Inputs
  | Phase7Inputs;
