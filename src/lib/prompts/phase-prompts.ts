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

export function phase4JourneyPrompt(inputs: Record<string, any>): string {
  const steps = (inputs.journey_steps || [])
    .map((s: any, i: number) => `${i + 1}. [${s.label.toUpperCase()}] ${s.step} — ${s.notes}`)
    .join("\n  ") || "(none listed)";

  return `You are a healthcare design thinking coach helping a medical student analyze their user journey map.

The student has mapped these journey steps:

**Journey Steps:**
  ${steps}

Synthesize the journey map into a structured analysis. Identify the emotional arc, friction points, and delight moments.

Respond with valid JSON in this exact format:
{
  "journey_summary": "A 2-3 sentence narrative of the current user journey",
  "emotional_arc": "A description of how the user's emotional state changes across the journey",
  "friction_points": [{"step_index": 0, "description": "what makes this step painful", "severity": "high"}],
  "delight_moments": ["what works well in the current experience"],
  "patterns": ["pattern or theme noticed across multiple steps"],
  "suggested_focus_areas": ["area worth exploring for design opportunities"]
}`;
}

export function phase4HmwPrompt(inputs: Record<string, any>): string {
  const steps = (inputs.journey_steps || [])
    .map((s: any, i: number) => `${i + 1}. [${s.label.toUpperCase()}] ${s.step} — ${s.notes}`)
    .join("\n  ") || "(none listed)";
  const opportunities = (inputs.selected_opportunities || [])
    .map((o: any, i: number) => `${i + 1}. ${o.description} (source: ${o.source_step_index === "custom" ? "custom" : `step ${(o.source_step_index as number) + 1}`})`)
    .join("\n  ") || "(none listed)";

  return `You are a healthcare design thinking coach helping a medical student generate "How Might We" statements for their selected design opportunities.

The student's journey map:
  ${steps}

The student has selected these opportunities to explore:
  ${opportunities}

For each opportunity, generate exactly 3 "How Might We..." statement options. Each HMW should:
- Reframe the problem as an opportunity
- Be specific enough to inspire solutions but open enough to allow creative exploration
- Connect back to the user's experience from the journey map

Respond with valid JSON in this exact format:
{
  "hmw_sets": [
    {
      "opportunity_description": "the opportunity description",
      "hmw_options": ["How might we ...", "How might we ...", "How might we ..."]
    }
  ]
}`;
}

export function phase4FullPrompt(inputs: Record<string, any>): string {
  const steps = (inputs.journey_steps || [])
    .map((s: any, i: number) => `${i + 1}. [${s.label.toUpperCase()}] ${s.step} — ${s.notes}`)
    .join("\n  ") || "(none listed)";
  const opportunities = (inputs.selected_opportunities || [])
    .map((o: any) => `${o.description} → HMW: ${o.chosen_hmw}`)
    .join("\n  ") || "(none listed)";

  return `You are a healthcare design thinking coach helping a medical student map the user journey and identify opportunities.

The student has mapped these journey steps:

**Journey Steps:**
  ${steps}

**Selected Opportunities & How Might We Statements:**
  ${opportunities}

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

export const PHASE_PROMPTS: Record<number, (inputs: Record<string, any>, subStep?: string) => string> = {
  1: phase1Prompt,
  2: phase2Prompt,
  3: phase3Prompt,
  4: (inputs, subStep) => {
    if (subStep === "journey") return phase4JourneyPrompt(inputs);
    if (subStep === "generate_hmw") return phase4HmwPrompt(inputs);
    return phase4FullPrompt(inputs);
  },
  5: phase5Prompt,
  6: phase6Prompt,
  7: phase7Prompt,
};
