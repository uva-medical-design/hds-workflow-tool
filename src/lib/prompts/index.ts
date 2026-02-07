import { PHASE_PROMPTS } from "./phase-prompts";

interface PromptOptions {
  phase: number;
  inputs: Record<string, any>;
  subStep?: string;
  previousSynthesis?: Record<string, any>;
  iterationFeedback?: string;
}

export function getSystemPrompt(): string {
  return `You are an AI design thinking coach for the UVA Medical Design Program. You help medical students synthesize their healthcare design research into structured insights.

Rules:
- Always respond with valid JSON only — no markdown, no code fences, no extra text
- Be encouraging but honest — push students to think deeper
- Preserve the student's voice and specific examples
- Focus on healthcare-specific considerations
- Keep language accessible for medical students, not software engineers`;
}

export function getUserPrompt(options: PromptOptions): string {
  const { phase, inputs, subStep, previousSynthesis, iterationFeedback } = options;

  const promptFn = PHASE_PROMPTS[phase];
  if (!promptFn) {
    throw new Error(`No prompt template for phase ${phase}`);
  }

  let prompt = promptFn(inputs, subStep);

  // Add iteration context if this is a revision
  if (previousSynthesis && iterationFeedback) {
    prompt += `

---

ITERATION CONTEXT:
The student has reviewed your previous synthesis and wants revisions.

**Previous Synthesis:**
${JSON.stringify(previousSynthesis, null, 2)}

**Student Feedback:**
${iterationFeedback}

Please revise your synthesis based on this feedback. Maintain the same JSON response format.`;
  }

  return prompt;
}
