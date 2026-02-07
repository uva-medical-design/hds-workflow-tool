import type {
  Phase1Inputs,
  Phase2Inputs,
  Phase3Inputs,
  Phase4Inputs,
  Phase5Inputs,
  Phase6Inputs,
  Phase7Inputs,
} from "@/types";

export interface PhaseConfig {
  number: number;
  name: string;
  description: string;
  microLearning: {
    title: string;
    content: string;
  };
  emptyInputs: Record<string, unknown>;
}

export const PHASE_CONFIGS: PhaseConfig[] = [
  {
    number: 1,
    name: "Problem Discovery",
    description: "Define the healthcare problem you want to solve",
    microLearning: {
      title: "What makes a good healthcare problem?",
      content:
        "Great design starts with a real problem you've witnessed. Think about moments in clinical settings where something felt broken, slow, or frustrating — for patients or providers. The best problems are specific, observable, and personally meaningful to you. Don't worry about solutions yet — just describe what you've seen.",
    },
    emptyInputs: {
      topic_description: "",
      personal_connection: "",
      observations: "",
      research_notes: "",
      file_ids: [],
    } satisfies Phase1Inputs,
  },
  {
    number: 2,
    name: "User Deep-Dive",
    description: "Understand your stakeholders and primary users",
    microLearning: {
      title: "Who are you designing for?",
      content:
        "Every healthcare problem affects multiple people — patients, caregivers, nurses, physicians, administrators. Identify who is most affected (your primary user) and understand their daily reality: what are they trying to accomplish, what frustrates them, and how do they currently cope? Empathy is your most powerful design tool.",
    },
    emptyInputs: {
      stakeholders: [],
      primary_user_description: "",
      user_context: "",
      goals: "",
      frustrations: "",
      coping_strategies: "",
      secondary_users: [],
    } satisfies Phase2Inputs,
  },
  {
    number: 3,
    name: "Jobs to Be Done",
    description: "Identify the functional, emotional, and social jobs",
    microLearning: {
      title: "What job is your user hiring a solution for?",
      content:
        "People don't buy products — they hire them to do a job. A patient doesn't want a pill organizer; they want to feel confident they're taking the right medication. Think about three dimensions: the functional job (what needs to get done), the emotional job (how they want to feel), and the social job (how they want to be perceived). Also look at what tools they're currently using — and where those tools fall short.",
    },
    emptyInputs: {
      job_statement: "",
      functional_dimension: "",
      emotional_dimension: "",
      social_dimension: "",
      current_tools: [],
      cross_field_inspiration: "",
    } satisfies Phase3Inputs,
  },
  {
    number: 4,
    name: "Journey & Opportunities",
    description: "Map the current experience and find opportunities",
    microLearning: {
      title: "Where are the friction points?",
      content:
        'Map out the steps your user takes today to accomplish their goal. Label each step as friction (painful), neutral, or delight (works well). The friction points are your design opportunities. Then reframe them as "How might we..." statements — these open up creative possibilities without jumping to solutions.',
    },
    emptyInputs: {
      journey_steps: [],
      journey_map_accepted: false,
      journey_synthesis: null,
      selected_opportunities: [],
      opportunities_accepted: false,
      opportunities_synthesis: null,
    } satisfies Phase4Inputs,
  },
  {
    number: 5,
    name: "Features & Priorities",
    description: "Translate insights into prioritized features",
    microLearning: {
      title: "From insights to features",
      content:
        "Now connect the dots: each insight from your research should trace to a user need, a JTBD connection, and a concrete feature. Then prioritize ruthlessly — rate each feature on impact (how much it helps) and feasibility (how buildable it is). Only the highest-value, most-feasible features make your MVP. Also think about your product's personality and what existing apps inspire you.",
    },
    emptyInputs: {
      insight_to_feature: [],
      feature_priorities: [],
      product_personality: "",
      reference_apps: [],
    } satisfies Phase5Inputs,
  },
  {
    number: 6,
    name: "Technical Spec",
    description: "Define constraints, success criteria, and tradeoffs",
    microLearning: {
      title: "Setting your build constraints",
      content:
        "Before you build, define what success looks like and what constraints you're working within. What technical limitations exist? What accessibility standards matter? What security requirements apply to health data? And when trade-offs arise (speed vs. polish, features vs. simplicity), document your reasoning. These decisions will guide your build tool.",
    },
    emptyInputs: {
      technical_constraints: "",
      success_criteria: [],
      accessibility_requirements: "",
      security_requirements: "",
      tradeoff_decisions: [],
    } satisfies Phase6Inputs,
  },
  {
    number: 7,
    name: "Build Brief",
    description: "Finalize the PRD for your build tool of choice",
    microLearning: {
      title: "Preparing your build brief",
      content:
        "This is where everything comes together into a document your build tool can use. Choose your platform (Claude Code, Replit, Lovable), name your project, define edge cases, and set safety guardrails. The AI will synthesize all your previous work into a complete PRD and user story — your blueprint for building.",
    },
    emptyInputs: {
      platform: "claude_code",
      deployment_goal: "",
      time_constraint: "",
      edge_cases: [],
      project_name: "",
      branding: { primary_color: "", tagline: "" },
      safety_guardrails: { never_do: [], always_do: [] },
    } satisfies Phase7Inputs,
  },
];

export function getPhaseConfig(phase: number): PhaseConfig {
  return PHASE_CONFIGS[phase - 1];
}
