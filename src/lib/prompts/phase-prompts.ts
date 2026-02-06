// Phase-specific synthesis prompt templates
// Each function takes the phase inputs and returns the user message content

export function phase1Prompt(inputs: Record<string, any>): string {
  return `You are a healthcare design thinking coach helping a medical student synthesize their problem discovery research.

The student has provided the following inputs about a healthcare problem they want to explore:

**Topic Description:** ${inputs.topic_description || "(not provided)"}

**Personal Connection:** ${inputs.personal_connection || "(not provided)"}

**Observations:** ${inputs.observations || "(not provided)"}

**Research Notes:** ${inputs.research_notes || "(not provided)"}

Synthesize these inputs into a structured analysis. Preserve the student's voice and any specific quotes or stories they shared. Help them see patterns and sharpen their problem focus.

Respond with valid JSON in this exact format:
{
  "summary": "A 2-3 sentence synthesis of the problem area",
  "key_themes": ["theme 1", "theme 2", "theme 3"],
  "problem_statement": "A clear, specific problem statement derived from their inputs",
  "questions_to_explore": ["question 1", "question 2", "question 3"]
}`;
}

export function phase2Prompt(inputs: Record<string, any>): string {
  const stakeholderList = (inputs.stakeholders || []).join(", ") || "(none listed)";
  const secondaryUsers = (inputs.secondary_users || [])
    .map((u: any) => `${u.name}: ${u.notes}`)
    .join("\n  ") || "(none listed)";

  return `You are a healthcare design thinking coach helping a medical student build empathy for their users.

The student has identified these stakeholders and user details:

**Stakeholders:** ${stakeholderList}

**Primary User Description:** ${inputs.primary_user_description || "(not provided)"}

**User Context:** ${inputs.user_context || "(not provided)"}

**Goals:** ${inputs.goals || "(not provided)"}

**Frustrations:** ${inputs.frustrations || "(not provided)"}

**Coping Strategies:** ${inputs.coping_strategies || "(not provided)"}

**Secondary Users:**
  ${secondaryUsers}

Synthesize these into a rich user understanding. Help the student see their primary user as a real person with specific needs.

Respond with valid JSON in this exact format:
{
  "persona_summary": "A vivid 3-4 sentence persona description of the primary user",
  "stakeholder_map": ["stakeholder 1 - their role and relationship to the problem", "stakeholder 2 - ..."],
  "key_frustrations": ["frustration 1", "frustration 2", "frustration 3"],
  "key_goals": ["goal 1", "goal 2", "goal 3"],
  "empathy_insights": ["insight about what the student might not have considered 1", "insight 2"]
}`;
}

export function phase3Prompt(inputs: Record<string, any>): string {
  const tools = (inputs.current_tools || [])
    .map((t: any) => `${t.name} — Strengths: ${t.strengths} | Gaps: ${t.gaps}`)
    .join("\n  ") || "(none listed)";

  return `You are a healthcare design thinking coach helping a medical student apply Jobs to Be Done (JTBD) theory.

The student has analyzed the jobs their user is trying to accomplish:

**Job Statement:** ${inputs.job_statement || "(not provided)"}

**Functional Dimension:** ${inputs.functional_dimension || "(not provided)"}

**Emotional Dimension:** ${inputs.emotional_dimension || "(not provided)"}

**Social Dimension:** ${inputs.social_dimension || "(not provided)"}

**Current Tools & Workarounds:**
  ${tools}

**Cross-Field Inspiration:** ${inputs.cross_field_inspiration || "(not provided)"}

Synthesize these into a clear JTBD analysis. Identify where current solutions fall short and where the biggest opportunities lie.

Respond with valid JSON in this exact format:
{
  "job_statement_refined": "A polished version of their job statement in the format: When [situation], I want to [motivation], so I can [outcome]",
  "functional_job": "Summary of the functional dimension",
  "emotional_job": "Summary of the emotional dimension",
  "social_job": "Summary of the social dimension",
  "opportunity_gaps": ["gap between current tools and ideal solution 1", "gap 2", "gap 3"]
}`;
}

export function phase4Prompt(inputs: Record<string, any>): string {
  const steps = (inputs.journey_steps || [])
    .map((s: any) => `[${s.label.toUpperCase()}] ${s.step} — ${s.notes}`)
    .join("\n  ") || "(none listed)";
  const opportunities = (inputs.opportunities || []).join(", ") || "(none listed)";
  const hmw = (inputs.hmw_statements || []).join("\n  ") || "(none listed)";

  return `You are a healthcare design thinking coach helping a medical student map the user journey and identify opportunities.

The student has mapped these journey steps:

**Journey Steps:**
  ${steps}

**Opportunities Identified:** ${opportunities}

**How Might We Statements:**
  ${hmw}

**Selected Opportunity:** ${inputs.selected_opportunity || "(not provided)"}

Synthesize the journey into clear insights. Highlight the most impactful friction points and help the student focus on the strongest opportunity.

Respond with valid JSON in this exact format:
{
  "journey_summary": "A 2-3 sentence narrative of the current user journey",
  "friction_points": ["the most significant friction point 1", "point 2", "point 3"],
  "top_opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "hmw_recommendations": ["refined HMW statement 1", "refined HMW 2", "refined HMW 3"],
  "recommended_focus": "A clear recommendation for which opportunity to pursue and why"
}`;
}

export function phase5Prompt(inputs: Record<string, any>): string {
  const mappings = (inputs.insight_to_feature || [])
    .map(
      (m: any) =>
        `Insight: ${m.insight} → Need: ${m.need} → JTBD: ${m.jtbd_connection} → Feature: ${m.feature} (${m.rationale})`
    )
    .join("\n  ") || "(none listed)";
  const priorities = (inputs.feature_priorities || [])
    .map(
      (f: any) =>
        `${f.feature} — Impact: ${f.impact}/5, Feasibility: ${f.feasibility}/5, MVP: ${f.in_mvp ? "Yes" : "No"}`
    )
    .join("\n  ") || "(none listed)";
  const refApps = (inputs.reference_apps || [])
    .map((a: any) => `${a.name}: ${a.what_to_borrow}`)
    .join("\n  ") || "(none listed)";

  return `You are a healthcare design thinking coach helping a medical student translate insights into prioritized features.

The student has mapped insights to features and prioritized them:

**Insight → Feature Mappings:**
  ${mappings}

**Feature Priorities:**
  ${priorities}

**Product Personality:** ${inputs.product_personality || "(not provided)"}

**Reference Apps:**
  ${refApps}

Synthesize these into a clear feature strategy. Help the student see how their clinical insights trace to specific, buildable features. Be critical about MVP scope.

Respond with valid JSON in this exact format:
{
  "mvp_features": ["feature 1 - brief description", "feature 2", "feature 3"],
  "prioritization_rationale": "Why these features were selected for MVP",
  "product_personality_summary": "How the product should feel to users",
  "feature_roadmap": ["v1 (MVP): what's included", "v2 (future): what's deferred and why"]
}`;
}

export function phase6Prompt(inputs: Record<string, any>): string {
  const criteria = (inputs.success_criteria || []).join(", ") || "(none listed)";
  const tradeoffs = (inputs.tradeoff_decisions || [])
    .map((t: any) => `Q: ${t.question} → Choice: ${t.choice} (${t.rationale})`)
    .join("\n  ") || "(none listed)";

  return `You are a healthcare design thinking coach helping a medical student define technical constraints and success criteria.

The student has defined:

**Technical Constraints:** ${inputs.technical_constraints || "(not provided)"}

**Success Criteria:** ${criteria}

**Accessibility Requirements:** ${inputs.accessibility_requirements || "(not provided)"}

**Security Requirements:** ${inputs.security_requirements || "(not provided)"}

**Tradeoff Decisions:**
  ${tradeoffs}

Synthesize these into a clear technical specification summary. Present tradeoffs clearly and assess feasibility. Keep it accessible for a medical student audience.

Respond with valid JSON in this exact format:
{
  "technical_summary": "A plain-language summary of the technical approach",
  "feasibility_assessment": "How feasible is this to build in the available time?",
  "key_tradeoffs": ["tradeoff 1 and its implication", "tradeoff 2"],
  "success_metrics": ["measurable success criterion 1", "criterion 2", "criterion 3"]
}`;
}

export function phase7Prompt(inputs: Record<string, any>): string {
  const edgeCases = (inputs.edge_cases || [])
    .map((e: any) => `${e.scenario} → ${e.expected_behavior}`)
    .join("\n  ") || "(none listed)";
  const neverDo = (inputs.safety_guardrails?.never_do || []).join(", ") || "(none)";
  const alwaysDo = (inputs.safety_guardrails?.always_do || []).join(", ") || "(none)";

  return `You are a healthcare design thinking coach helping a medical student prepare their final build brief.

The student has defined their build parameters:

**Platform:** ${inputs.platform || "(not provided)"}
**Project Name:** ${inputs.project_name || "(not provided)"}
**Deployment Goal:** ${inputs.deployment_goal || "(not provided)"}
**Time Constraint:** ${inputs.time_constraint || "(not provided)"}

**Edge Cases:**
  ${edgeCases}

**Branding:**
  Primary Color: ${inputs.branding?.primary_color || "(not set)"}
  Tagline: ${inputs.branding?.tagline || "(not set)"}

**Safety Guardrails:**
  Never do: ${neverDo}
  Always do: ${alwaysDo}

Synthesize everything into a build brief summary and generate a complete prompt that the student can paste into their build tool. The build prompt should be comprehensive enough to produce a working prototype.

Respond with valid JSON in this exact format:
{
  "prd_summary": "A concise summary of what's being built and why",
  "build_prompt": "A complete, detailed prompt the student can paste into Claude Code, Replit, or Lovable to build their prototype. Include all features, constraints, and requirements.",
  "key_requirements": ["requirement 1", "requirement 2", "requirement 3"],
  "guardrails_summary": "Summary of safety and behavioral guardrails"
}`;
}

export const PHASE_PROMPTS: Record<number, (inputs: Record<string, any>) => string> = {
  1: phase1Prompt,
  2: phase2Prompt,
  3: phase3Prompt,
  4: phase4Prompt,
  5: phase5Prompt,
  6: phase6Prompt,
  7: phase7Prompt,
};
